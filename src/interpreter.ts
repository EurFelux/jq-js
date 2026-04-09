import type { AstNode } from './ast.js';
import { JqRuntimeError } from './errors.js';
import { logDebug } from './logger.js';
import type { JsonValue } from './types.js';

type Filter = (input: JsonValue) => JsonValue[];

export function compile(node: AstNode): Filter {
  switch (node.kind) {
    case 'identity':
      return (input) => [input];

    case 'field':
      return (input) => {
        if (input === null || typeof input !== 'object' || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot index ${jqType(input)} with string "${node.name}"`);
        }
        return [input[node.name] ?? null];
      };

    case 'index': {
      const indexFn = compile(node.index);
      return (input) => {
        const indices = indexFn(input);
        return indices.flatMap((idx) => {
          if (typeof idx === 'number') {
            if (!Array.isArray(input)) {
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with number`);
            }
            const i = idx < 0 ? input.length + idx : idx;
            return [input[i] ?? null];
          }
          if (typeof idx === 'string') {
            if (input === null || typeof input !== 'object' || Array.isArray(input)) {
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with string`);
            }
            return [input[idx] ?? null];
          }
          throw new JqRuntimeError(`Cannot index with ${jqType(idx)}`);
        });
      };
    }

    case 'slice':
      return (input) => {
        if (!Array.isArray(input) && typeof input !== 'string') {
          throw new JqRuntimeError(`Cannot slice ${jqType(input)}`);
        }
        const len = input.length;
        const fromResults = node.from ? compile(node.from)(input) : [0];
        const toResults = node.to ? compile(node.to)(input) : [len];
        return fromResults.flatMap((f) =>
          toResults.map((t) => {
            const from = normalizeIndex(f as number, len);
            const to = normalizeIndex(t as number, len);
            return input.slice(from, to) as JsonValue;
          }),
        );
      };

    case 'iterate':
      return (input) => {
        if (Array.isArray(input)) return input;
        if (input !== null && typeof input === 'object') return Object.values(input);
        throw new JqRuntimeError(`Cannot iterate over ${jqType(input)}`);
      };

    case 'pipe': {
      const leftFn = compile(node.left);
      const rightFn = compile(node.right);
      return (input) => leftFn(input).flatMap(rightFn);
    }

    case 'comma': {
      const leftFn = compile(node.left);
      const rightFn = compile(node.right);
      return (input) => [...leftFn(input), ...rightFn(input)];
    }

    case 'literal':
      return () => [node.value];

    case 'array': {
      if (node.expr === null) return () => [[]];
      const exprFn = compile(node.expr);
      return (input) => [exprFn(input)];
    }

    case 'object': {
      const compiledEntries = node.entries.map((entry) => ({
        key: compile(entry.key),
        value: entry.value
          ? compile(entry.value)
          : compile({ kind: 'field', name: (entry.key as { value: string }).value as string, pos: entry.key.pos }),
      }));
      return (input) => {
        let results: JsonValue[] = [{}];
        for (const entry of compiledEntries) {
          const keys = entry.key(input);
          const values = entry.value(input);
          const newResults: JsonValue[] = [];
          for (const obj of results) {
            for (const k of keys) {
              for (const v of values) {
                newResults.push({ ...(obj as Record<string, JsonValue>), [String(k)]: v });
              }
            }
          }
          results = newResults;
        }
        return results;
      };
    }

    case 'condition': {
      const condFn = compile(node.condition);
      const thenFn = compile(node.then);
      const elifFns = node.elifs.map((e) => ({ cond: compile(e.condition), then: compile(e.then) }));
      const elseFn = node.else_ ? compile(node.else_) : null;
      return (input) => {
        const condResult = condFn(input);
        if (isTruthy(condResult[0])) return thenFn(input);
        for (const elif of elifFns) {
          const elifResult = elif.cond(input);
          if (isTruthy(elifResult[0])) return elif.then(input);
        }
        return elseFn ? elseFn(input) : [input];
      };
    }

    case 'func':
      return compileBuiltin(node.name, node.args, node.pos);

    case 'try': {
      const exprFn = compile(node.expr);
      const catchFn = node.catch_ ? compile(node.catch_) : null;
      return (input) => {
        try {
          return exprFn(input);
        } catch (e) {
          if (catchFn) {
            const errMsg = e instanceof Error ? e.message : String(e);
            return catchFn(errMsg as JsonValue);
          }
          return [];
        }
      };
    }

    case 'arith': {
      const leftFn = compile(node.left);
      const rightFn = compile(node.right);
      return (input) =>
        leftFn(input).flatMap((l) =>
          rightFn(input).map((r) => applyArith(node.op, l, r)),
        );
    }

    case 'compare': {
      const leftFn = compile(node.left);
      const rightFn = compile(node.right);
      return (input) =>
        leftFn(input).flatMap((l) =>
          rightFn(input).map((r) => applyCompare(node.op, l, r)),
        );
    }

    case 'logic': {
      const leftFn = compile(node.left);
      const rightFn = compile(node.right);
      return (input) => {
        if (node.op === 'and') {
          return leftFn(input).flatMap((l) =>
            rightFn(input).map((r) => (isTruthy(l) && isTruthy(r)) as JsonValue),
          );
        }
        return leftFn(input).flatMap((l) =>
          rightFn(input).map((r) => (isTruthy(l) || isTruthy(r)) as JsonValue),
        );
      };
    }

    case 'not': {
      const exprFn = compile(node.expr);
      return (input) => exprFn(input).map((v) => !isTruthy(v) as JsonValue);
    }

    case 'negate': {
      const exprFn = compile(node.expr);
      return (input) =>
        exprFn(input).map((v) => {
          if (typeof v !== 'number') throw new JqRuntimeError(`Cannot negate ${jqType(v)}`);
          return -v;
        });
    }

    case 'recurse':
      return (input) => {
        const results: JsonValue[] = [];
        const recurse = (v: JsonValue) => {
          results.push(v);
          if (Array.isArray(v)) {
            for (const item of v) recurse(item);
          } else if (v !== null && typeof v === 'object') {
            for (const val of Object.values(v)) recurse(val);
          }
        };
        recurse(input);
        return results;
      };

    case 'optional': {
      const exprFn = compile(node.expr);
      return (input) => {
        try {
          return exprFn(input);
        } catch {
          return [];
        }
      };
    }

    case 'string_interpolation': {
      const compiledParts = node.parts.map((p) =>
        typeof p === 'string' ? p : compile(p),
      );
      return (input) => {
        let results: string[] = [''];
        for (const part of compiledParts) {
          if (typeof part === 'string') {
            results = results.map((r) => r + part);
          } else {
            const values = part(input);
            const newResults: string[] = [];
            for (const r of results) {
              for (const v of values) {
                newResults.push(r + jsonToString(v));
              }
            }
            results = newResults;
          }
        }
        return results;
      };
    }
  }
}

function compileBuiltin(name: string, args: AstNode[], pos: number): Filter {
  switch (name) {
    case 'length':
      return (input) => {
        if (input === null) return [0];
        if (typeof input === 'string' || Array.isArray(input)) return [input.length];
        if (typeof input === 'object') return [Object.keys(input).length];
        if (typeof input === 'number') return [Math.abs(input)];
        if (typeof input === 'boolean') throw new JqRuntimeError('boolean has no length');
        return [0];
      };

    case 'keys':
    case 'keys_unsorted':
      return (input) => {
        if (Array.isArray(input)) return [input.map((_, i) => i)];
        if (input !== null && typeof input === 'object') {
          const k = Object.keys(input);
          return [name === 'keys' ? k.sort() : k];
        }
        throw new JqRuntimeError(`${jqType(input)} has no keys`);
      };

    case 'values':
      return (input) => {
        if (Array.isArray(input)) return [input];
        if (input !== null && typeof input === 'object') return [Object.values(input)];
        throw new JqRuntimeError(`${jqType(input)} has no values`);
      };

    case 'type':
      return (input) => [jqType(input)];

    case 'has': {
      if (args.length !== 1) throw new JqRuntimeError('has/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) =>
        argFn(input).map((key) => {
          if (Array.isArray(input) && typeof key === 'number') {
            return key >= 0 && key < input.length;
          }
          if (input !== null && typeof input === 'object' && !Array.isArray(input) && typeof key === 'string') {
            return key in input;
          }
          throw new JqRuntimeError(`Cannot check if ${jqType(input)} has key ${jqType(key)}`);
        });
    }

    case 'map': {
      if (args.length !== 1) throw new JqRuntimeError('map/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot map over ${jqType(input)}`);
        return [input.flatMap(fn)];
      };
    }

    case 'select': {
      if (args.length !== 1) throw new JqRuntimeError('select/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        const result = fn(input);
        return isTruthy(result[0]) ? [input] : [];
      };
    }

    case 'empty':
      return () => [];

    case 'add':
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot add ${jqType(input)}`);
        if (input.length === 0) return [null];
        return [input.reduce((acc: JsonValue, item: JsonValue) => applyArith('+', acc, item))];
      };

    case 'any': {
      if (args.length === 0) {
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot any over ${jqType(input)}`);
          return [input.some(isTruthy)];
        };
      }
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot any over ${jqType(input)}`);
        return [input.some((item) => fn(item).some(isTruthy))];
      };
    }

    case 'all': {
      if (args.length === 0) {
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot all over ${jqType(input)}`);
          return [input.every(isTruthy)];
        };
      }
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot all over ${jqType(input)}`);
        return [input.every((item) => fn(item).some(isTruthy))];
      };
    }

    case 'flatten': {
      const depth = args.length > 0 ? args : undefined;
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot flatten ${jqType(input)}`);
        if (depth) {
          const depthFn = compile(depth[0]!);
          return depthFn(input).map((d) => flattenArray(input, d as number));
        }
        return [flattenArray(input, Infinity)];
      };
    }

    case 'range': {
      if (args.length === 1) {
        const upperFn = compile(args[0]!);
        return (input) => {
          const results: JsonValue[] = [];
          for (const u of upperFn(input)) {
            for (let i = 0; i < (u as number); i++) results.push(i);
          }
          return results;
        };
      }
      if (args.length === 2) {
        const fromFn = compile(args[0]!);
        const toFn = compile(args[1]!);
        return (input) => {
          const results: JsonValue[] = [];
          for (const f of fromFn(input)) {
            for (const t of toFn(input)) {
              for (let i = f as number; i < (t as number); i++) results.push(i);
            }
          }
          return results;
        };
      }
      if (args.length === 3) {
        const fromFn = compile(args[0]!);
        const toFn = compile(args[1]!);
        const stepFn = compile(args[2]!);
        return (input) => {
          const results: JsonValue[] = [];
          for (const f of fromFn(input)) {
            for (const t of toFn(input)) {
              for (const s of stepFn(input)) {
                const step = s as number;
                if (step > 0) {
                  for (let i = f as number; i < (t as number); i += step) results.push(i);
                } else if (step < 0) {
                  for (let i = f as number; i > (t as number); i += step) results.push(i);
                }
              }
            }
          }
          return results;
        };
      }
      throw new JqRuntimeError('range requires 1-3 arguments');
    }

    case 'tostring':
      return (input) => [jsonToString(input)];

    case 'tonumber':
      return (input) => {
        if (typeof input === 'number') return [input];
        if (typeof input === 'string') {
          const n = Number(input);
          if (isNaN(n)) throw new JqRuntimeError(`Cannot convert "${input}" to number`);
          return [n];
        }
        throw new JqRuntimeError(`Cannot convert ${jqType(input)} to number`);
      };

    case 'ascii_downcase':
      return (input) => {
        if (typeof input !== 'string') throw new JqRuntimeError(`Cannot downcase ${jqType(input)}`);
        return [input.toLowerCase()];
      };

    case 'ascii_upcase':
      return (input) => {
        if (typeof input !== 'string') throw new JqRuntimeError(`Cannot upcase ${jqType(input)}`);
        return [input.toUpperCase()];
      };

    case 'ltrimstr': {
      if (args.length !== 1) throw new JqRuntimeError('ltrimstr/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) => {
        if (typeof input !== 'string') return [input];
        return argFn(input).map((prefix) => {
          if (typeof prefix === 'string' && input.startsWith(prefix)) {
            return input.slice(prefix.length);
          }
          return input;
        });
      };
    }

    case 'rtrimstr': {
      if (args.length !== 1) throw new JqRuntimeError('rtrimstr/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) => {
        if (typeof input !== 'string') return [input];
        return argFn(input).map((suffix) => {
          if (typeof suffix === 'string' && input.endsWith(suffix)) {
            return input.slice(0, -suffix.length);
          }
          return input;
        });
      };
    }

    case 'split': {
      if (args.length !== 1) throw new JqRuntimeError('split/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) => {
        if (typeof input !== 'string') throw new JqRuntimeError(`Cannot split ${jqType(input)}`);
        return argFn(input).map((sep) => {
          if (typeof sep !== 'string') throw new JqRuntimeError('split separator must be a string');
          return input.split(sep);
        });
      };
    }

    case 'join': {
      if (args.length !== 1) throw new JqRuntimeError('join/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot join ${jqType(input)}`);
        return argFn(input).map((sep) => {
          if (typeof sep !== 'string') throw new JqRuntimeError('join separator must be a string');
          return input.map((v) => (v === null ? '' : String(v))).join(sep);
        });
      };
    }

    case 'test': {
      if (args.length < 1) throw new JqRuntimeError('test requires at least 1 argument');
      const patternFn = compile(args[0]!);
      const flagsFn = args.length > 1 ? compile(args[1]!) : null;
      return (input) => {
        if (typeof input !== 'string') throw new JqRuntimeError(`Cannot test ${jqType(input)}`);
        return patternFn(input).flatMap((pattern) => {
          const flags = flagsFn ? flagsFn(input).map(String) : [''];
          return flags.map((f) => new RegExp(String(pattern), f).test(input));
        });
      };
    }

    case 'contains': {
      if (args.length !== 1) throw new JqRuntimeError('contains/1 requires 1 argument');
      const argFn = compile(args[0]!);
      return (input) => argFn(input).map((other) => jsonContains(input, other));
    }

    case 'not':
      return (input) => [!isTruthy(input)];

    case 'null':
      return () => [null];

    case 'true':
      return () => [true];

    case 'false':
      return () => [false];

    case 'error': {
      if (args.length === 0) {
        return (input) => {
          throw new JqRuntimeError(typeof input === 'string' ? input : JSON.stringify(input));
        };
      }
      const msgFn = compile(args[0]!);
      return (input) => {
        const msgs = msgFn(input);
        throw new JqRuntimeError(typeof msgs[0] === 'string' ? msgs[0] : JSON.stringify(msgs[0]));
      };
    }

    case 'debug': {
      if (args.length === 0) {
        return (input) => {
          logDebug(JSON.stringify(input));
          return [input];
        };
      }
      const labelFn = compile(args[0]!);
      return (input) => {
        for (const label of labelFn(input)) {
          logDebug(JSON.stringify(input), jsonToString(label));
        }
        return [input];
      };
    }

    case 'first': {
      if (args.length === 1) {
        const fn = compile(args[0]!);
        return (input) => {
          const results = fn(input);
          return results.length > 0 ? [results[0]!] : [];
        };
      }
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) throw new JqRuntimeError('first requires non-empty array');
        return [input[0]!];
      };
    }

    case 'last': {
      if (args.length === 1) {
        const fn = compile(args[0]!);
        return (input) => {
          const results = fn(input);
          return results.length > 0 ? [results[results.length - 1]!] : [];
        };
      }
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) throw new JqRuntimeError('last requires non-empty array');
        return [input[input.length - 1]!];
      };
    }

    case 'limit': {
      if (args.length !== 2) throw new JqRuntimeError('limit/2 requires 2 arguments');
      const nFn = compile(args[0]!);
      const exprFn = compile(args[1]!);
      return (input) => {
        const ns = nFn(input);
        const n = ns[0] as number;
        return exprFn(input).slice(0, n);
      };
    }

    case 'nth': {
      if (args.length === 1) {
        const nFn = compile(args[0]!);
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot nth ${jqType(input)}`);
          return nFn(input).map((n) => input[n as number] ?? null);
        };
      }
      if (args.length === 2) {
        const nFn = compile(args[0]!);
        const exprFn = compile(args[1]!);
        return (input) => {
          const ns = nFn(input);
          const n = ns[0] as number;
          const results = exprFn(input);
          return n < results.length ? [results[n]!] : [];
        };
      }
      throw new JqRuntimeError('nth requires 1-2 arguments');
    }

    case 'reverse':
      return (input) => {
        if (Array.isArray(input)) return [[...input].reverse()];
        if (typeof input === 'string') return [[...input].reverse().join('')];
        throw new JqRuntimeError(`Cannot reverse ${jqType(input)}`);
      };

    case 'sort':
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot sort ${jqType(input)}`);
        return [[...input].sort(jqCompare)];
      };

    case 'sort_by': {
      if (args.length !== 1) throw new JqRuntimeError('sort_by/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot sort ${jqType(input)}`);
        const decorated = input.map((item) => ({ item, key: fn(item)[0] }));
        decorated.sort((a, b) => jqCompare(a.key!, b.key!));
        return [decorated.map((d) => d.item)];
      };
    }

    case 'group_by': {
      if (args.length !== 1) throw new JqRuntimeError('group_by/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot group ${jqType(input)}`);
        const groups = new Map<string, JsonValue[]>();
        for (const item of input) {
          const key = JSON.stringify(fn(item)[0]);
          const group = groups.get(key);
          if (group) group.push(item);
          else groups.set(key, [item]);
        }
        return [[...groups.values()]];
      };
    }

    case 'unique':
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot unique ${jqType(input)}`);
        const seen = new Set<string>();
        const result: JsonValue[] = [];
        for (const item of input) {
          const key = JSON.stringify(item);
          if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
          }
        }
        return [result];
      };

    case 'unique_by': {
      if (args.length !== 1) throw new JqRuntimeError('unique_by/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot unique ${jqType(input)}`);
        const seen = new Set<string>();
        const result: JsonValue[] = [];
        for (const item of input) {
          const key = JSON.stringify(fn(item)[0]);
          if (!seen.has(key)) {
            seen.add(key);
            result.push(item);
          }
        }
        return [result];
      };
    }

    case 'min':
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(a, b) <= 0 ? a : b))];
      };

    case 'max':
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(a, b) >= 0 ? a : b))];
      };

    case 'min_by': {
      if (args.length !== 1) throw new JqRuntimeError('min_by/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(fn(a)[0]!, fn(b)[0]!) <= 0 ? a : b))];
      };
    }

    case 'max_by': {
      if (args.length !== 1) throw new JqRuntimeError('max_by/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(fn(a)[0]!, fn(b)[0]!) >= 0 ? a : b))];
      };
    }

    case 'to_entries':
      return (input) => {
        if (input === null || typeof input !== 'object' || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot convert ${jqType(input)} to entries`);
        }
        return [Object.entries(input).map(([k, v]) => ({ key: k, value: v }))];
      };

    case 'from_entries':
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot convert ${jqType(input)} from entries`);
        const obj: Record<string, JsonValue> = {};
        for (const entry of input) {
          if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
            const key = (entry as Record<string, JsonValue>).key ?? (entry as Record<string, JsonValue>).name;
            const value = (entry as Record<string, JsonValue>).value;
            obj[String(key)] = value ?? null;
          }
        }
        return [obj];
      };

    case 'with_entries': {
      if (args.length !== 1) throw new JqRuntimeError('with_entries/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (input === null || typeof input !== 'object' || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot with_entries on ${jqType(input)}`);
        }
        const entries = Object.entries(input).map(([k, v]) => ({ key: k as JsonValue, value: v }));
        const mapped = entries.flatMap((entry) => fn(entry as unknown as JsonValue));
        const obj: Record<string, JsonValue> = {};
        for (const entry of mapped) {
          if (entry !== null && typeof entry === 'object' && !Array.isArray(entry)) {
            const key = (entry as Record<string, JsonValue>).key;
            const value = (entry as Record<string, JsonValue>).value;
            obj[String(key)] = value ?? null;
          }
        }
        return [obj];
      };
    }

    case 'map_values': {
      if (args.length !== 1) throw new JqRuntimeError('map_values/1 requires 1 argument');
      const fn = compile(args[0]!);
      return (input) => {
        if (Array.isArray(input)) {
          return [input.map((v) => fn(v)[0] ?? null)];
        }
        if (input !== null && typeof input === 'object') {
          const result: Record<string, JsonValue> = {};
          for (const [k, v] of Object.entries(input)) {
            result[k] = fn(v)[0] ?? null;
          }
          return [result];
        }
        throw new JqRuntimeError(`Cannot map_values over ${jqType(input)}`);
      };
    }

    case 'arrays':
      return (input) => (Array.isArray(input) ? [input] : []);
    case 'objects':
      return (input) => (input !== null && typeof input === 'object' && !Array.isArray(input) ? [input] : []);
    case 'iterables':
      return (input) => (typeof input === 'object' && input !== null ? [input] : []);
    case 'booleans':
      return (input) => (typeof input === 'boolean' ? [input] : []);
    case 'numbers':
      return (input) => (typeof input === 'number' ? [input] : []);
    case 'strings':
      return (input) => (typeof input === 'string' ? [input] : []);
    case 'nulls':
      return (input) => (input === null ? [input] : []);
    case 'scalars':
      return (input) => (typeof input !== 'object' || input === null ? [input] : []);

    case 'input':
    case 'inputs':
      throw new JqRuntimeError(`${name} is not supported in jq-js`);

    default:
      throw new JqRuntimeError(`Unknown function: ${name}`);
  }
}

// --- Helpers ---

function jqType(v: JsonValue): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function isTruthy(v: JsonValue | undefined): boolean {
  return v !== false && v !== null && v !== undefined;
}

function jsonToString(v: JsonValue): string {
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function normalizeIndex(i: number, len: number): number {
  return i < 0 ? Math.max(0, len + i) : Math.min(i, len);
}

function flattenArray(arr: JsonValue[], depth: number): JsonValue[] {
  if (depth <= 0) return arr;
  const result: JsonValue[] = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenArray(item, depth - 1));
    } else {
      result.push(item);
    }
  }
  return result;
}

function applyArith(op: string, l: JsonValue, r: JsonValue): JsonValue {
  // String concatenation
  if (op === '+' && typeof l === 'string' && typeof r === 'string') return l + r;
  // Array concatenation
  if (op === '+' && Array.isArray(l) && Array.isArray(r)) return [...l, ...r];
  // Object merge
  if (op === '+' && l !== null && r !== null && typeof l === 'object' && typeof r === 'object' && !Array.isArray(l) && !Array.isArray(r)) {
    return { ...l, ...r };
  }
  // null arithmetic
  if (op === '+' && l === null) return r;
  if (op === '+' && r === null) return l;

  if (typeof l !== 'number' || typeof r !== 'number') {
    throw new JqRuntimeError(`Cannot apply ${op} to ${jqType(l)} and ${jqType(r)}`);
  }
  switch (op) {
    case '+': return l + r;
    case '-': return l - r;
    case '*': return l * r;
    case '/':
      if (r === 0) throw new JqRuntimeError('Division by zero');
      return l / r;
    case '%':
      if (r === 0) throw new JqRuntimeError('Modulo by zero');
      return l % r;
    default: throw new JqRuntimeError(`Unknown operator: ${op}`);
  }
}

function applyCompare(op: string, l: JsonValue, r: JsonValue): JsonValue {
  const cmp = jqCompare(l, r);
  switch (op) {
    case '==': return cmp === 0;
    case '!=': return cmp !== 0;
    case '<': return cmp < 0;
    case '>': return cmp > 0;
    case '<=': return cmp <= 0;
    case '>=': return cmp >= 0;
    default: return false;
  }
}

function typeOrder(v: JsonValue): number {
  if (v === null) return 0;
  if (v === false) return 1;
  if (v === true) return 2;
  if (typeof v === 'number') return 3;
  if (typeof v === 'string') return 4;
  if (Array.isArray(v)) return 5;
  return 6; // object
}

function jqCompare(a: JsonValue, b: JsonValue): number {
  const ta = typeOrder(a);
  const tb = typeOrder(b);
  if (ta !== tb) return ta - tb;

  if (a === null) return 0;
  if (typeof a === 'boolean') return 0; // same type, same value (handled by typeOrder)
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'string' && typeof b === 'string') return a < b ? -1 : a > b ? 1 : 0;
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = jqCompare(a[i]!, b[i]!);
      if (c !== 0) return c;
    }
    return a.length - b.length;
  }
  // Objects: compare by keys then values
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    const keysCmp = jqCompare(ka, kb);
    if (keysCmp !== 0) return keysCmp;
    for (const k of ka) {
      const c = jqCompare((a as Record<string, JsonValue>)[k]!, (b as Record<string, JsonValue>)[k]!);
      if (c !== 0) return c;
    }
    return 0;
  }
  return 0;
}

function jsonContains(a: JsonValue, b: JsonValue): boolean {
  if (typeof b === 'string' && typeof a === 'string') return a.includes(b);
  if (typeof a !== typeof b) return false;
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return b.every((bItem) => a.some((aItem) => jsonContains(aItem, bItem)));
  }
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    return Object.keys(b).every((k) => jsonContains((a as Record<string, JsonValue>)[k] ?? null, (b as Record<string, JsonValue>)[k]!));
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
