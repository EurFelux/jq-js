import type { AstNode, BindingPattern } from "./ast.js";
import { JqRuntimeError } from "./errors.js";
import { logDebug } from "./logger.js";
import type { JsonValue } from "./types.js";

type Filter = (input: JsonValue) => JsonValue[];

interface Env {
  vars: Map<string, JsonValue>;
  funcs: Map<string, { params: string[]; body: AstNode; closure: Env }>;
}

function emptyEnv(): Env {
  return { vars: new Map(), funcs: new Map() };
}

function extendEnv(parent: Env): Env {
  return {
    vars: new Map(parent.vars),
    funcs: new Map(parent.funcs),
  };
}

class BreakSignal {
  constructor(public label: string) {}
}

const REMOVE_SENTINEL = Symbol("remove");

export function run(node: AstNode, input: JsonValue): JsonValue[] {
  const results: JsonValue[] = [];
  generateValues(
    node,
    emptyEnv(),
    input,
    (v) => results.push(v),
    () => {},
  );
  return results;
}

export function compile(node: AstNode, env: Env = emptyEnv()): Filter {
  switch (node.kind) {
    case "identity":
      return (input) => [input];

    case "field":
      return (input) => {
        if (input === null) return [null];
        if (typeof input !== "object" || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot index ${jqType(input)} with string ("${node.name}")`);
        }
        return [input[node.name] ?? null];
      };

    case "index": {
      const indexFn = compile(node.index, env);
      return (input) => {
        if (input === null) return [null];
        const indices = indexFn(input);
        return indices.flatMap((idx) => {
          if (typeof idx === "number") {
            if (!Array.isArray(input)) {
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with number`);
            }
            const i = idx < 0 ? input.length + idx : idx;
            return [input[i] ?? null];
          }
          if (typeof idx === "string") {
            if (typeof input !== "object" || Array.isArray(input)) {
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with string`);
            }
            return [input[idx] ?? null];
          }
          throw new JqRuntimeError(`Cannot index with ${jqType(idx)}`);
        });
      };
    }

    case "slice":
      return (input) => {
        if (input === null) return [null];
        if (!Array.isArray(input) && typeof input !== "string") {
          throw new JqRuntimeError(`Cannot slice ${jqType(input)}`);
        }
        const len = input.length;
        const fromResults = node.from ? compile(node.from, env)(input) : [0];
        const toResults = node.to ? compile(node.to, env)(input) : [len];
        return fromResults.flatMap((f) =>
          toResults.map((t) => {
            const from = normalizeIndex(f as number, len);
            const to = normalizeIndex(t as number, len);
            return input.slice(from, to) as JsonValue;
          }),
        );
      };

    case "iterate":
      return (input) => {
        if (input === null) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === "object") return Object.values(input);
        throw new JqRuntimeError(`Cannot iterate over ${jqType(input)} (${jqTruncate(input)})`);
      };

    case "pipe": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) => leftFn(input).flatMap(rightFn);
    }

    case "comma": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) => [...leftFn(input), ...rightFn(input)];
    }

    case "literal":
      return () => [node.value];

    case "array": {
      if (node.expr === null) return () => [[]];
      const exprFn = compile(node.expr, env);
      return (input) => [exprFn(input)];
    }

    case "object": {
      const compiledEntries = node.entries.map((entry) => ({
        key: compile(entry.key, env),
        value: entry.value
          ? compile(entry.value, env)
          : compile(
              {
                kind: "field",
                name: (entry.key as { value: string }).value as string,
                pos: entry.key.pos,
              },
              env,
            ),
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

    case "condition": {
      const condFn = compile(node.condition, env);
      const thenFn = compile(node.then, env);
      const elifFns = node.elifs.map((e) => ({
        cond: compile(e.condition, env),
        then: compile(e.then, env),
      }));
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

    case "func":
      return compileBuiltin(node.name, node.args, node.pos, env);

    case "try": {
      const catchFn = node.catch_ ? compile(node.catch_, env) : null;
      return (input) => {
        const results: JsonValue[] = [];
        generateValues(
          node.expr,
          env,
          input,
          (v) => results.push(v),
          (e) => {
            if (catchFn) {
              const errVal =
                e instanceof JqRuntimeError
                  ? (e as JqRuntimeError).value
                  : e instanceof Error
                    ? (e as Error).message
                    : String(e);
              results.push(...catchFn(errVal as JsonValue));
            }
          },
        );
        return results;
      };
    }

    case "arith": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) =>
        leftFn(input).flatMap((l) => rightFn(input).map((r) => applyArith(node.op, l, r)));
    }

    case "compare": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) =>
        leftFn(input).flatMap((l) => rightFn(input).map((r) => applyCompare(node.op, l, r)));
    }

    case "logic": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) => {
        if (node.op === "and") {
          return leftFn(input).flatMap((l) =>
            rightFn(input).map((r) => (isTruthy(l) && isTruthy(r)) as JsonValue),
          );
        }
        return leftFn(input).flatMap((l) =>
          rightFn(input).map((r) => (isTruthy(l) || isTruthy(r)) as JsonValue),
        );
      };
    }

    case "not": {
      const exprFn = compile(node.expr, env);
      return (input) => exprFn(input).map((v) => !isTruthy(v) as JsonValue);
    }

    case "negate": {
      const exprFn = compile(node.expr, env);
      return (input) =>
        exprFn(input).map((v) => {
          if (typeof v !== "number")
            throw new JqRuntimeError(`${jqType(v)} (${jqTruncate(v)}) cannot be negated`);
          return -v;
        });
    }

    case "recurse":
      return (input) => {
        const results: JsonValue[] = [];
        const recurse = (v: JsonValue) => {
          results.push(v);
          if (Array.isArray(v)) {
            for (const item of v) recurse(item);
          } else if (v !== null && typeof v === "object") {
            for (const val of Object.values(v)) recurse(val);
          }
        };
        recurse(input);
        return results;
      };

    case "optional": {
      const exprFn = compile(node.expr, env);
      return (input) => {
        try {
          return exprFn(input);
        } catch {
          return [];
        }
      };
    }

    case "alternative": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) => {
        const results = leftFn(input).filter((v) => v !== null && v !== false);
        return results.length > 0 ? results : rightFn(input);
      };
    }

    case "string_interpolation": {
      const compiledParts = node.parts.map((p) => (typeof p === "string" ? p : compile(p, env)));
      return (input) => {
        let results: string[] = [""];
        for (const part of compiledParts) {
          if (typeof part === "string") {
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

    case "var_ref":
      return (_input) => {
        const val = env.vars.get(node.name);
        if (val === undefined) throw new JqRuntimeError(`Undefined variable: ${node.name}`);
        return [val];
      };

    case "as": {
      const exprFn = compile(node.expr, env);
      return (input) => {
        const values = exprFn(input);
        return values.flatMap((val) => {
          const newEnv = extendEnv(env);
          bindPattern(newEnv, node.pattern, val);
          return compile(node.body, newEnv)(input);
        });
      };
    }

    case "reduce": {
      const exprFn = compile(node.expr, env);
      return (input) => {
        const initFn = compile(node.init, env);
        let acc = initFn(input)[0] ?? null;
        const values = exprFn(input);
        for (const val of values) {
          const newEnv = extendEnv(env);
          bindPattern(newEnv, node.pattern, val);
          const updateFn = compile(node.update, newEnv);
          acc = updateFn(acc)[0] ?? null;
        }
        return [acc];
      };
    }

    case "foreach": {
      const exprFn = compile(node.expr, env);
      return (input) => {
        const initFn = compile(node.init, env);
        let acc = initFn(input)[0] ?? null;
        const values = exprFn(input);
        const results: JsonValue[] = [];
        for (const val of values) {
          const newEnv = extendEnv(env);
          bindPattern(newEnv, node.pattern, val);
          const updateFn = compile(node.update, newEnv);
          acc = updateFn(acc)[0] ?? null;
          if (node.extract) {
            const extractFn = compile(node.extract, newEnv);
            results.push(...extractFn(acc));
          } else {
            results.push(acc);
          }
        }
        return results;
      };
    }

    case "label": {
      return (input) => {
        const bodyFn = compile(node.body, env);
        try {
          return bodyFn(input);
        } catch (e) {
          if (e instanceof BreakSignal && e.label === node.name) {
            return [];
          }
          throw e;
        }
      };
    }

    case "break":
      return (_input) => {
        throw new BreakSignal(node.name);
      };

    case "def": {
      const newEnv = extendEnv(env);
      newEnv.funcs.set(node.name, { params: node.params, body: node.body, closure: newEnv });
      return compile(node.next, newEnv);
    }

    case "update": {
      const bodyFn = compile(node.body, env);
      return (input) => {
        return [
          updatePaths(input, node.path, env, (oldVal) => {
            const op = node.op;
            if (op === "|=") {
              const results = bodyFn(oldVal);
              if (results.length === 0) return REMOVE_SENTINEL as unknown as JsonValue;
              return results[0]!;
            }
            if (op === "//=")
              return oldVal !== null && oldVal !== false ? oldVal : (bodyFn(input)[0] ?? null);
            const arithOp = op.slice(0, -1); // '+=' -> '+', etc.
            const newVal = bodyFn(oldVal)[0] ?? null;
            return applyArith(arithOp, oldVal, newVal);
          }),
        ];
      };
    }

    case "assign": {
      const valFn = compile(node.value, env);
      return (input) => {
        const values = valFn(input);
        const val = values[0] ?? null;
        return [updatePaths(input, node.path, env, () => val)];
      };
    }
  }
}

function updatePaths(
  root: JsonValue,
  pathNode: AstNode,
  env: Env,
  updater: (oldVal: JsonValue) => JsonValue,
): JsonValue {
  // Walk the path expression and apply the updater at each leaf
  return updatePathInner(root, pathNode, env, updater);
}

function updatePathInner(
  root: JsonValue,
  node: AstNode,
  env: Env,
  updater: (oldVal: JsonValue) => JsonValue,
): JsonValue {
  switch (node.kind) {
    case "identity":
      return updater(root);

    case "field": {
      if (root === null) {
        // Auto-create object from null
        return { [node.name]: updater(null) };
      }
      if (typeof root !== "object" || Array.isArray(root)) {
        throw new JqRuntimeError(`Cannot index ${jqType(root)} with string "${node.name}"`);
      }
      const obj = { ...root };
      obj[node.name] = updater(obj[node.name] ?? null);
      return obj;
    }

    case "index": {
      const idxFn = compile(node.index, env);
      const idx = idxFn(root)[0];
      if (typeof idx === "number") {
        if (root === null) root = [];
        if (!Array.isArray(root))
          throw new JqRuntimeError(`Cannot index ${jqType(root)} with number`);
        if (idx < 0) {
          const i = root.length + idx;
          if (i < 0) throw new JqRuntimeError("Out of bounds negative array index");
          const arr = [...root];
          arr[i] = updater(arr[i] ?? null);
          return arr;
        }
        if (idx > 536870911) throw new JqRuntimeError("Array index too large");
        const arr = [...root];
        while (arr.length <= idx) arr.push(null);
        arr[idx] = updater(arr[idx] ?? null);
        return arr;
      }
      if (
        typeof idx === "string" &&
        root !== null &&
        typeof root === "object" &&
        !Array.isArray(root)
      ) {
        const obj = { ...root };
        obj[idx] = updater(obj[idx] ?? null);
        return obj;
      }
      throw new JqRuntimeError(`Cannot index ${jqType(root)}`);
    }

    case "iterate": {
      if (Array.isArray(root)) {
        const result = root.map((item) => updater(item));
        return result.filter((item) => item !== (REMOVE_SENTINEL as unknown));
      }
      if (root !== null && typeof root === "object") {
        const obj: Record<string, JsonValue> = {};
        for (const [k, v] of Object.entries(root)) {
          const updated = updater(v);
          if (updated !== (REMOVE_SENTINEL as unknown)) obj[k] = updated;
        }
        return obj;
      }
      throw new JqRuntimeError(`Cannot iterate over ${jqType(root)}`);
    }

    case "pipe": {
      // For a | b, update b within each result of navigating a
      return updatePathInner(root, node.left, env, (leftVal) =>
        updatePathInner(leftVal, node.right, env, updater),
      );
    }

    case "recurse": {
      const rec = (v: JsonValue): JsonValue => {
        const updated = updater(v);
        if (Array.isArray(updated)) return updated.map(rec);
        if (updated !== null && typeof updated === "object") {
          const obj: Record<string, JsonValue> = {};
          for (const [k, val] of Object.entries(updated)) obj[k] = rec(val);
          return obj;
        }
        return updated;
      };
      return rec(root);
    }

    case "optional": {
      try {
        return updatePathInner(root, node.expr, env, updater);
      } catch {
        return root;
      }
    }

    case "try": {
      try {
        return updatePathInner(root, node.expr, env, updater);
      } catch {
        return root;
      }
    }

    case "comma": {
      let result = updatePathInner(root, node.left, env, updater);
      result = updatePathInner(result, node.right, env, updater);
      return result;
    }

    case "slice": {
      if (!Array.isArray(root)) throw new JqRuntimeError(`Cannot slice ${jqType(root)}`);
      const len = root.length;
      const from = node.from ? ((compile(node.from, env)(root)[0] as number) ?? 0) : 0;
      const to = node.to ? ((compile(node.to, env)(root)[0] as number) ?? len) : len;
      const f = normalizeIndex(from, len);
      const t = normalizeIndex(to, len);
      const arr = [...root];
      const sliced = arr.slice(f, t);
      const updated = updater(sliced);
      if (Array.isArray(updated)) {
        arr.splice(f, t - f, ...updated);
      }
      return arr;
    }

    case "func": {
      // select(cond) |= expr — only update items matching condition
      if (node.name === "select" && node.args.length === 1) {
        const condFn = compile(node.args[0]!, env);
        if (Array.isArray(root)) {
          return root.map((item) => {
            const condResult = condFn(item);
            return isTruthy(condResult[0]) ? updater(item) : item;
          });
        }
      }
      // For other function calls, fall through to default behavior
      return updater(compile(node, env)(root)[0] ?? null);
    }

    default:
      // For complex expressions, just evaluate and update
      return updater(compile(node, env)(root)[0] ?? null);
  }
}

function bindPattern(env: Env, pattern: BindingPattern, value: JsonValue): void {
  switch (pattern.type) {
    case "variable":
      env.vars.set(pattern.name, value);
      break;
    case "array": {
      const arr = Array.isArray(value) ? value : [];
      for (let i = 0; i < pattern.elements.length; i++) {
        bindPattern(env, pattern.elements[i]!, arr[i] ?? null);
      }
      break;
    }
    case "object": {
      const obj =
        value !== null && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, JsonValue>)
          : {};
      for (const entry of pattern.entries) {
        // Evaluate the key expression to get the actual key string
        const keyNode = entry.key;
        let keyStr: string;
        if (keyNode.kind === "literal" && typeof keyNode.value === "string") {
          keyStr = keyNode.value;
        } else {
          // For computed keys, compile and evaluate
          const keyFn = compile(keyNode, env);
          const keyResult = keyFn(value);
          keyStr = String(keyResult[0]);
        }
        bindPattern(env, entry.pattern, obj[keyStr] ?? null);
      }
      break;
    }
  }
}

function compileBuiltin(name: string, args: AstNode[], pos: number, env: Env): Filter {
  // Check user-defined functions first
  const userFunc = env.funcs.get(name);
  if (userFunc) {
    return (input) => {
      const funcEnv = extendEnv(userFunc.closure);
      // Bind filter arguments
      for (let i = 0; i < userFunc.params.length; i++) {
        const paramName = userFunc.params[i]!;
        const argNode = args[i];
        if (argNode) {
          // Filter arguments: the argument is a filter, not a value
          // We need to compile it in the caller's env and bind as a function
          funcEnv.funcs.set(paramName, { params: [], body: argNode, closure: env });
        }
      }
      return compile(userFunc.body, funcEnv)(input);
    };
  }

  switch (name) {
    case "length":
      return (input) => {
        if (input === null) return [0];
        if (typeof input === "string" || Array.isArray(input)) return [input.length];
        if (typeof input === "object") return [Object.keys(input).length];
        if (typeof input === "number") return [Math.abs(input)];
        if (typeof input === "boolean") throw new JqRuntimeError("boolean has no length");
        return [0];
      };

    case "keys":
    case "keys_unsorted":
      return (input) => {
        if (Array.isArray(input)) return [input.map((_, i) => i)];
        if (input !== null && typeof input === "object") {
          const k = Object.keys(input);
          return [name === "keys" ? k.sort() : k];
        }
        throw new JqRuntimeError(`${jqType(input)} has no keys`);
      };

    case "values":
      return (input) => {
        if (Array.isArray(input)) return [input];
        if (input !== null && typeof input === "object") return [Object.values(input)];
        throw new JqRuntimeError(`${jqType(input)} has no values`);
      };

    case "type":
      return (input) => [jqType(input)];

    case "has": {
      if (args.length !== 1) throw new JqRuntimeError("has/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) =>
        argFn(input).map((key) => {
          if (Array.isArray(input) && typeof key === "number") {
            return key >= 0 && key < input.length;
          }
          if (
            input !== null &&
            typeof input === "object" &&
            !Array.isArray(input) &&
            typeof key === "string"
          ) {
            return key in input;
          }
          throw new JqRuntimeError(`Cannot check if ${jqType(input)} has key ${jqType(key)}`);
        });
    }

    case "map": {
      if (args.length !== 1) throw new JqRuntimeError("map/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot map over ${jqType(input)}`);
        return [input.flatMap(fn)];
      };
    }

    case "select": {
      if (args.length !== 1) throw new JqRuntimeError("select/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        const result = fn(input);
        return isTruthy(result[0]) ? [input] : [];
      };
    }

    case "empty":
      return () => [];

    case "add": {
      if (args.length === 0) {
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot add ${jqType(input)}`);
          if (input.length === 0) return [null];
          return [input.reduce((acc: JsonValue, item: JsonValue) => applyArith("+", acc, item))];
        };
      }
      // add(f) — collect outputs of f and add them
      const fn = compile(args[0]!, env);
      return (input) => {
        const items = fn(input);
        if (items.length === 0) return [null];
        return [items.reduce((acc: JsonValue, item: JsonValue) => applyArith("+", acc, item))];
      };
    }

    case "any": {
      if (args.length === 0) {
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot any over ${jqType(input)}`);
          return [input.some(isTruthy)];
        };
      }
      if (args.length === 2) {
        const genFn = compile(args[0]!, env);
        const condFn = compile(args[1]!, env);
        return (input) => {
          const values = genFn(input);
          return [values.some((v) => condFn(v).some(isTruthy))];
        };
      }
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot any over ${jqType(input)}`);
        return [input.some((item) => fn(item).some(isTruthy))];
      };
    }

    case "all": {
      if (args.length === 0) {
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot all over ${jqType(input)}`);
          return [input.every(isTruthy)];
        };
      }
      if (args.length === 2) {
        const genFn = compile(args[0]!, env);
        const condFn = compile(args[1]!, env);
        return (input) => {
          const values = genFn(input);
          return [values.every((v) => condFn(v).some(isTruthy))];
        };
      }
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot all over ${jqType(input)}`);
        return [input.every((item) => fn(item).some(isTruthy))];
      };
    }

    case "flatten": {
      const depth = args.length > 0 ? args : undefined;
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot flatten ${jqType(input)}`);
        if (depth) {
          const depthFn = compile(depth[0]!, env);
          return depthFn(input).map((d) => flattenArray(input, d as number));
        }
        return [flattenArray(input, Infinity)];
      };
    }

    case "range": {
      if (args.length === 1) {
        const upperFn = compile(args[0]!, env);
        return (input) => {
          const results: JsonValue[] = [];
          for (const u of upperFn(input)) {
            for (let i = 0; i < (u as number); i++) results.push(i);
          }
          return results;
        };
      }
      if (args.length === 2) {
        const fromFn = compile(args[0]!, env);
        const toFn = compile(args[1]!, env);
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
        const fromFn = compile(args[0]!, env);
        const toFn = compile(args[1]!, env);
        const stepFn = compile(args[2]!, env);
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
      throw new JqRuntimeError("range requires 1-3 arguments");
    }

    case "tostring":
      return (input) => [jsonToString(input)];

    case "tonumber":
      return (input) => {
        if (typeof input === "number") return [input];
        if (typeof input === "string") {
          if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(input))
            throw new JqRuntimeError(
              `Invalid numeric literal at EOF at line 1, column 0 (while parsing '${input}')`,
            );
          return [Number(input)];
        }
        throw new JqRuntimeError(`Cannot convert ${jqType(input)} to number`);
      };

    case "ascii_downcase":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot downcase ${jqType(input)}`);
        return [input.toLowerCase()];
      };

    case "ascii_upcase":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot upcase ${jqType(input)}`);
        return [input.toUpperCase()];
      };

    case "ltrimstr": {
      if (args.length !== 1) throw new JqRuntimeError("ltrimstr/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string") return [input];
        return argFn(input).map((prefix) => {
          if (typeof prefix === "string" && input.startsWith(prefix)) {
            return input.slice(prefix.length);
          }
          return input;
        });
      };
    }

    case "rtrimstr": {
      if (args.length !== 1) throw new JqRuntimeError("rtrimstr/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string") return [input];
        return argFn(input).map((suffix) => {
          if (typeof suffix === "string" && input.endsWith(suffix)) {
            return input.slice(0, -suffix.length);
          }
          return input;
        });
      };
    }

    case "split": {
      if (args.length !== 1) throw new JqRuntimeError("split/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot split ${jqType(input)}`);
        return argFn(input).map((sep) => {
          if (typeof sep !== "string") throw new JqRuntimeError("split separator must be a string");
          return input.split(sep);
        });
      };
    }

    case "join": {
      if (args.length !== 1) throw new JqRuntimeError("join/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot join ${jqType(input)}`);
        return argFn(input).map((sep) => {
          if (typeof sep !== "string") throw new JqRuntimeError("join separator must be a string");
          return input.map((v) => (v === null ? "" : String(v))).join(sep);
        });
      };
    }

    case "test": {
      if (args.length < 1) throw new JqRuntimeError("test requires at least 1 argument");
      const patternFn = compile(args[0]!, env);
      const flagsFn = args.length > 1 ? compile(args[1]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot test ${jqType(input)}`);
        return patternFn(input).map((pattern) => {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "");
          return re.test(input);
        });
      };
    }

    case "match": {
      if (args.length < 1) throw new JqRuntimeError("match requires at least 1 argument");
      const patternFn = compile(args[0]!, env);
      const flagsFn = args.length > 1 ? compile(args[1]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot match ${jqType(input)}`);
        return patternFn(input).flatMap((pattern) => {
          const [re, hasGlobal] = buildRegex(
            pattern,
            flagsFn ? (flagsFn(input)[0] ?? null) : null,
            "",
          );
          if (hasGlobal) return collectAllMatches(re, input);
          const m = re.exec(input);
          if (!m) return [];
          return [buildMatchObject(m)];
        });
      };
    }

    case "capture": {
      if (args.length < 1) throw new JqRuntimeError("capture requires at least 1 argument");
      const patternFn = compile(args[0]!, env);
      const flagsFn = args.length > 1 ? compile(args[1]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot capture ${jqType(input)}`);
        return patternFn(input).map((pattern) => {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "");
          const m = re.exec(input);
          if (!m || !m.groups) return {};
          const result: Record<string, JsonValue> = {};
          for (const [k, v] of Object.entries(m.groups)) result[k] = v ?? null;
          return result;
        });
      };
    }

    case "scan": {
      if (args.length < 1) throw new JqRuntimeError("scan requires at least 1 argument");
      const patternFn = compile(args[0]!, env);
      const flagsFn = args.length > 1 ? compile(args[1]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot scan ${jqType(input)}`);
        const results: JsonValue[] = [];
        for (const pattern of patternFn(input)) {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "g");
          let m: RegExpExecArray | null;
          while ((m = re.exec(input)) !== null) {
            if (m[0]!.length === 0) {
              re.lastIndex++;
              continue;
            }
            if (m.length > 1) {
              results.push(
                Array.from(m)
                  .slice(1)
                  .map((v) => v ?? null),
              );
            } else {
              results.push(m[0]!);
            }
          }
        }
        return results;
      };
    }

    case "sub": {
      if (args.length < 2) throw new JqRuntimeError("sub requires at least 2 arguments");
      const patternFn = compile(args[0]!, env);
      const replFn = compile(args[1]!, env);
      const flagsFn = args.length > 2 ? compile(args[2]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot sub ${jqType(input)}`);
        return patternFn(input).map((pattern) => {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "");
          const m = re.exec(input);
          if (!m) return input;
          const matchObj = buildMatchObject(m);
          const replacement = replFn(matchObj)[0];
          const replStr =
            typeof replacement === "string" ? replacement : JSON.stringify(replacement);
          return input.slice(0, m.index) + replStr + input.slice(m.index + m[0]!.length);
        });
      };
    }

    case "gsub": {
      if (args.length < 2) throw new JqRuntimeError("gsub requires at least 2 arguments");
      const patternFn = compile(args[0]!, env);
      const replFn = compile(args[1]!, env);
      const flagsFn = args.length > 2 ? compile(args[2]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot gsub ${jqType(input)}`);
        return patternFn(input).map((pattern) => {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "g");
          let result = "";
          let lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(input)) !== null) {
            result += input.slice(lastIndex, m.index);
            const matchObj = buildMatchObject(m);
            const replacement = replFn(matchObj)[0];
            result += typeof replacement === "string" ? replacement : JSON.stringify(replacement);
            lastIndex = m.index + m[0]!.length;
            if (m[0]!.length === 0) {
              re.lastIndex++;
              lastIndex = re.lastIndex;
            }
          }
          result += input.slice(lastIndex);
          return result;
        });
      };
    }

    case "splits": {
      if (args.length < 1) throw new JqRuntimeError("splits requires at least 1 argument");
      const patternFn = compile(args[0]!, env);
      const flagsFn = args.length > 1 ? compile(args[1]!, env) : null;
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot splits ${jqType(input)}`);
        const results: JsonValue[] = [];
        for (const pattern of patternFn(input)) {
          const [re] = buildRegex(pattern, flagsFn ? (flagsFn(input)[0] ?? null) : null, "g");
          let lastIndex = 0;
          let m: RegExpExecArray | null;
          while ((m = re.exec(input)) !== null) {
            results.push(input.slice(lastIndex, m.index));
            lastIndex = m.index + m[0]!.length;
            if (m[0]!.length === 0) {
              re.lastIndex++;
              lastIndex = re.lastIndex;
            }
          }
          results.push(input.slice(lastIndex));
        }
        return results;
      };
    }

    case "contains": {
      if (args.length !== 1) throw new JqRuntimeError("contains/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => argFn(input).map((other) => jsonContains(input, other));
    }

    case "not":
      return (input) => [!isTruthy(input)];

    case "null":
      return () => [null];

    case "true":
      return () => [true];

    case "false":
      return () => [false];

    case "error": {
      if (args.length === 0) {
        return (input) => {
          const msg = typeof input === "string" ? input : JSON.stringify(input);
          throw new JqRuntimeError(msg, input);
        };
      }
      const msgFn = compile(args[0]!, env);
      return (input) => {
        const msgs = msgFn(input);
        const val = msgs[0] ?? null;
        const msg = typeof val === "string" ? val : JSON.stringify(val);
        throw new JqRuntimeError(msg, val);
      };
    }

    case "debug": {
      if (args.length === 0) {
        return (input) => {
          logDebug(JSON.stringify(input));
          return [input];
        };
      }
      const labelFn = compile(args[0]!, env);
      return (input) => {
        for (const label of labelFn(input)) {
          logDebug(JSON.stringify(input), jsonToString(label));
        }
        return [input];
      };
    }

    case "first": {
      if (args.length === 1) {
        const fn = compile(args[0]!, env);
        return (input) => {
          const results = fn(input);
          return results.length > 0 ? [results[0]!] : [];
        };
      }
      return (input) => {
        if (!Array.isArray(input) || input.length === 0)
          throw new JqRuntimeError("first requires non-empty array");
        return [input[0]!];
      };
    }

    case "last": {
      if (args.length === 1) {
        const fn = compile(args[0]!, env);
        return (input) => {
          const results = fn(input);
          return results.length > 0 ? [results[results.length - 1]!] : [];
        };
      }
      return (input) => {
        if (!Array.isArray(input) || input.length === 0)
          throw new JqRuntimeError("last requires non-empty array");
        return [input[input.length - 1]!];
      };
    }

    case "limit": {
      if (args.length !== 2) throw new JqRuntimeError("limit/2 requires 2 arguments");
      const nFn = compile(args[0]!, env);
      const exprFn = compile(args[1]!, env);
      return (input) => {
        const ns = nFn(input);
        const n = ns[0] as number;
        return exprFn(input).slice(0, n);
      };
    }

    case "nth": {
      if (args.length === 1) {
        const nFn = compile(args[0]!, env);
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot nth ${jqType(input)}`);
          return nFn(input).map((n) => input[n as number] ?? null);
        };
      }
      if (args.length === 2) {
        const nFn = compile(args[0]!, env);
        const exprFn = compile(args[1]!, env);
        return (input) => {
          const ns = nFn(input);
          const n = ns[0] as number;
          const results = exprFn(input);
          return n < results.length ? [results[n]!] : [];
        };
      }
      throw new JqRuntimeError("nth requires 1-2 arguments");
    }

    case "reverse":
      return (input) => {
        if (Array.isArray(input)) return [[...input].reverse()];
        if (typeof input === "string") return [[...input].reverse().join("")];
        throw new JqRuntimeError(`Cannot reverse ${jqType(input)}`);
      };

    case "sort":
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot sort ${jqType(input)}`);
        return [[...input].sort(jqCompare)];
      };

    case "sort_by": {
      if (args.length !== 1) throw new JqRuntimeError("sort_by/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot sort ${jqType(input)}`);
        const decorated = input.map((item) => ({ item, key: fn(item)[0] }));
        decorated.sort((a, b) => jqCompare(a.key!, b.key!));
        return [decorated.map((d) => d.item)];
      };
    }

    case "group_by": {
      if (args.length !== 1) throw new JqRuntimeError("group_by/1 requires 1 argument");
      const fn = compile(args[0]!, env);
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

    case "unique":
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

    case "unique_by": {
      if (args.length !== 1) throw new JqRuntimeError("unique_by/1 requires 1 argument");
      const fn = compile(args[0]!, env);
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

    case "min":
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(a, b) <= 0 ? a : b))];
      };

    case "max":
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(a, b) >= 0 ? a : b))];
      };

    case "min_by": {
      if (args.length !== 1) throw new JqRuntimeError("min_by/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(fn(a)[0]!, fn(b)[0]!) <= 0 ? a : b))];
      };
    }

    case "max_by": {
      if (args.length !== 1) throw new JqRuntimeError("max_by/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input) || input.length === 0) return [null];
        return [input.reduce((a, b) => (jqCompare(fn(a)[0]!, fn(b)[0]!) >= 0 ? a : b))];
      };
    }

    case "to_entries":
      return (input) => {
        if (input === null || typeof input !== "object" || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot convert ${jqType(input)} to entries`);
        }
        return [Object.entries(input).map(([k, v]) => ({ key: k, value: v }))];
      };

    case "from_entries":
      return (input) => {
        if (!Array.isArray(input))
          throw new JqRuntimeError(`Cannot convert ${jqType(input)} from entries`);
        const obj: Record<string, JsonValue> = {};
        for (const entry of input) {
          if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
            const key =
              (entry as Record<string, JsonValue>).key ?? (entry as Record<string, JsonValue>).name;
            const value = (entry as Record<string, JsonValue>).value;
            obj[String(key)] = value ?? null;
          }
        }
        return [obj];
      };

    case "with_entries": {
      if (args.length !== 1) throw new JqRuntimeError("with_entries/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (input === null || typeof input !== "object" || Array.isArray(input)) {
          throw new JqRuntimeError(`Cannot with_entries on ${jqType(input)}`);
        }
        const entries = Object.entries(input).map(([k, v]) => ({ key: k as JsonValue, value: v }));
        const mapped = entries.flatMap((entry) => fn(entry as unknown as JsonValue));
        const obj: Record<string, JsonValue> = {};
        for (const entry of mapped) {
          if (entry !== null && typeof entry === "object" && !Array.isArray(entry)) {
            const key = (entry as Record<string, JsonValue>).key;
            const value = (entry as Record<string, JsonValue>).value;
            obj[String(key)] = value ?? null;
          }
        }
        return [obj];
      };
    }

    case "map_values": {
      if (args.length !== 1) throw new JqRuntimeError("map_values/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        if (Array.isArray(input)) {
          return [input.map((v) => fn(v)[0] ?? null)];
        }
        if (input !== null && typeof input === "object") {
          const result: Record<string, JsonValue> = {};
          for (const [k, v] of Object.entries(input)) {
            result[k] = fn(v)[0] ?? null;
          }
          return [result];
        }
        throw new JqRuntimeError(`Cannot map_values over ${jqType(input)}`);
      };
    }

    case "arrays":
      return (input) => (Array.isArray(input) ? [input] : []);
    case "objects":
      return (input) =>
        input !== null && typeof input === "object" && !Array.isArray(input) ? [input] : [];
    case "iterables":
      return (input) => (typeof input === "object" && input !== null ? [input] : []);
    case "booleans":
      return (input) => (typeof input === "boolean" ? [input] : []);
    case "numbers":
      return (input) => (typeof input === "number" ? [input] : []);
    case "strings":
      return (input) => (typeof input === "string" ? [input] : []);
    case "nulls":
      return (input) => (input === null ? [input] : []);
    case "scalars":
      return (input) => (typeof input !== "object" || input === null ? [input] : []);

    case "tojson":
      return (input) => [JSON.stringify(input)];

    case "fromjson":
      return (input) => {
        if (typeof input !== "string")
          throw new JqRuntimeError(`Cannot parse ${jqType(input)} as JSON`);
        return [JSON.parse(input) as JsonValue];
      };

    case "explode":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot explode ${jqType(input)}`);
        return [Array.from(input).map((ch) => ch.codePointAt(0)!)];
      };

    case "implode":
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot implode ${jqType(input)}`);
        return [String.fromCodePoint(...(input as number[]))];
      };

    case "startswith": {
      if (args.length !== 1) throw new JqRuntimeError("startswith/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`startswith requires string input`);
        return argFn(input).map((s) => {
          if (typeof s !== "string")
            throw new JqRuntimeError("startswith argument must be a string");
          return input.startsWith(s);
        });
      };
    }

    case "endswith": {
      if (args.length !== 1) throw new JqRuntimeError("endswith/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`endswith requires string input`);
        return argFn(input).map((s) => {
          if (typeof s !== "string") throw new JqRuntimeError("endswith argument must be a string");
          return input.endsWith(s);
        });
      };
    }

    case "inside": {
      if (args.length !== 1) throw new JqRuntimeError("inside/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => argFn(input).map((other) => jsonContains(other, input));
    }

    case "index": {
      if (args.length !== 1) throw new JqRuntimeError("index/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) =>
        argFn(input).map((s) => {
          if (typeof input === "string" && typeof s === "string") {
            const idx = input.indexOf(s);
            return idx === -1 ? null : idx;
          }
          if (Array.isArray(input)) {
            if (Array.isArray(s)) {
              // Find subarray
              outer: for (let i = 0; i <= input.length - s.length; i++) {
                for (let j = 0; j < s.length; j++) {
                  if (JSON.stringify(input[i + j]) !== JSON.stringify(s[j])) continue outer;
                }
                return i as JsonValue;
              }
              return null;
            }
            const idx = input.findIndex((item) => JSON.stringify(item) === JSON.stringify(s));
            return idx === -1 ? null : idx;
          }
          throw new JqRuntimeError(`Cannot index ${jqType(input)}`);
        });
    }

    case "rindex": {
      if (args.length !== 1) throw new JqRuntimeError("rindex/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) =>
        argFn(input).map((s) => {
          if (typeof input === "string" && typeof s === "string") {
            const idx = input.lastIndexOf(s);
            return idx === -1 ? null : idx;
          }
          if (Array.isArray(input)) {
            if (Array.isArray(s)) {
              for (let i = input.length - s.length; i >= 0; i--) {
                let match = true;
                for (let j = 0; j < s.length; j++) {
                  if (JSON.stringify(input[i + j]) !== JSON.stringify(s[j])) {
                    match = false;
                    break;
                  }
                }
                if (match) return i as JsonValue;
              }
              return null;
            }
            for (let i = input.length - 1; i >= 0; i--) {
              if (JSON.stringify(input[i]) === JSON.stringify(s)) return i as JsonValue;
            }
            return null;
          }
          throw new JqRuntimeError(`Cannot rindex ${jqType(input)}`);
        });
    }

    case "indices": {
      if (args.length !== 1) throw new JqRuntimeError("indices/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) =>
        argFn(input).map((s) => {
          const result: number[] = [];
          if (typeof input === "string" && typeof s === "string") {
            let idx = 0;
            while ((idx = input.indexOf(s, idx)) !== -1) {
              result.push(idx);
              idx += 1;
            }
          } else if (Array.isArray(input)) {
            if (Array.isArray(s)) {
              for (let i = 0; i <= input.length - s.length; i++) {
                let match = true;
                for (let j = 0; j < s.length; j++) {
                  if (JSON.stringify(input[i + j]) !== JSON.stringify(s[j])) {
                    match = false;
                    break;
                  }
                }
                if (match) result.push(i);
              }
            } else {
              for (let i = 0; i < input.length; i++) {
                if (JSON.stringify(input[i]) === JSON.stringify(s)) result.push(i);
              }
            }
          } else {
            throw new JqRuntimeError(`Cannot get indices of ${jqType(input)}`);
          }
          return result;
        });
    }

    case "utf8bytelength":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`${jqType(input)} has no length`);
        return [new TextEncoder().encode(input).length];
      };

    case "builtins":
      return () => [BUILTIN_NAMES.map((n) => n)];

    case "walk": {
      if (args.length !== 1) throw new JqRuntimeError("walk/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        const walkInner = (v: JsonValue): JsonValue => {
          if (Array.isArray(v)) {
            return fn(v.map(walkInner))[0] ?? null;
          }
          if (v !== null && typeof v === "object") {
            const obj: Record<string, JsonValue> = {};
            for (const [k, val] of Object.entries(v)) {
              obj[k] = walkInner(val);
            }
            return fn(obj)[0] ?? null;
          }
          return fn(v)[0] ?? null;
        };
        return [walkInner(input)];
      };
    }

    case "recurse": {
      if (args.length === 0) {
        // Same as ..
        return (input) => {
          const results: JsonValue[] = [];
          const rec = (v: JsonValue) => {
            results.push(v);
            if (Array.isArray(v)) for (const item of v) rec(item);
            else if (v !== null && typeof v === "object")
              for (const val of Object.values(v)) rec(val);
          };
          rec(input);
          return results;
        };
      }
      const fn = compile(args[0]!, env);
      const condFn = args.length > 1 ? compile(args[1]!) : null;
      return (input) => {
        const results: JsonValue[] = [];
        const seen = new Set<string>();
        const rec = (v: JsonValue) => {
          const key = JSON.stringify(v);
          if (seen.has(key)) return;
          seen.add(key);
          if (condFn) {
            const condResult = condFn(v);
            if (!isTruthy(condResult[0])) return;
          }
          results.push(v);
          try {
            const next = fn(v);
            for (const n of next) rec(n);
          } catch {
            // stop recursion on error
          }
        };
        rec(input);
        return results;
      };
    }

    case "until": {
      if (args.length !== 2) throw new JqRuntimeError("until/2 requires 2 arguments");
      const condFn = compile(args[0]!, env);
      const updateFn = compile(args[1]!, env);
      return (input) => {
        let current = input;
        for (let i = 0; i < 10000; i++) {
          if (isTruthy(condFn(current)[0])) return [current];
          current = updateFn(current)[0] ?? null;
        }
        throw new JqRuntimeError("until: iteration limit exceeded");
      };
    }

    case "while": {
      if (args.length !== 2) throw new JqRuntimeError("while/2 requires 2 arguments");
      const condFn = compile(args[0]!, env);
      const updateFn = compile(args[1]!, env);
      return (input) => {
        const results: JsonValue[] = [];
        let current = input;
        for (let i = 0; i < 10000; i++) {
          if (!isTruthy(condFn(current)[0])) break;
          results.push(current);
          current = updateFn(current)[0] ?? null;
        }
        return results;
      };
    }

    case "repeat": {
      if (args.length !== 1) throw new JqRuntimeError("repeat/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        const results: JsonValue[] = [];
        let current = input;
        for (let i = 0; i < 10000; i++) {
          results.push(current);
          try {
            const next = fn(current);
            if (next.length === 0) break;
            current = next[0]!;
          } catch {
            break;
          }
        }
        return results;
      };
    }

    case "getpath": {
      if (args.length !== 1) throw new JqRuntimeError("getpath/1 requires 1 argument");
      const pathFn = compile(args[0]!, env);
      return (input) =>
        pathFn(input).map((p) => {
          if (!Array.isArray(p)) throw new JqRuntimeError("Path must be an array");
          return getPath(input, p);
        });
    }

    case "setpath": {
      if (args.length !== 2) throw new JqRuntimeError("setpath/2 requires 2 arguments");
      const pathFn = compile(args[0]!, env);
      const valFn = compile(args[1]!, env);
      return (input) =>
        pathFn(input).flatMap((p) =>
          valFn(input).map((v) => {
            if (!Array.isArray(p)) throw new JqRuntimeError("Path must be an array");
            return setPath(input, p, v);
          }),
        );
    }

    case "delpaths": {
      if (args.length !== 1) throw new JqRuntimeError("delpaths/1 requires 1 argument");
      const pathsFn = compile(args[0]!, env);
      return (input) =>
        pathsFn(input).map((paths) => {
          if (!Array.isArray(paths))
            throw new JqRuntimeError("delpaths argument must be an array of paths");
          let result = input;
          // Delete in reverse order of path length to avoid index shifting
          const sorted = [...(paths as JsonValue[][])].sort((a, b) => b.length - a.length);
          for (const p of sorted) {
            result = delPath(result, p);
          }
          return result;
        });
    }

    case "path": {
      if (args.length !== 1) throw new JqRuntimeError("path/1 requires 1 argument");
      // path(expr) returns the paths to each output of expr
      // This is a simplified implementation
      const exprFn = compile(args[0]!, env);
      return (input) => {
        const paths: JsonValue[] = [];
        collectPaths(input, args[0]!, paths);
        return paths;
      };
    }

    case "leaf_paths":
      return (input) => {
        const paths: JsonValue[][] = [];
        const walk = (v: JsonValue, path: JsonValue[]) => {
          if (Array.isArray(v)) {
            if (v.length === 0) paths.push(path);
            else v.forEach((item, i) => walk(item, [...path, i]));
          } else if (v !== null && typeof v === "object") {
            const keys = Object.keys(v);
            if (keys.length === 0) paths.push(path);
            else keys.forEach((k) => walk((v as Record<string, JsonValue>)[k]!, [...path, k]));
          } else {
            paths.push(path);
          }
        };
        walk(input, []);
        return paths;
      };

    case "abs":
      return (input) => {
        if (typeof input === "number") return [Math.abs(input)];
        throw new JqRuntimeError(`Cannot take abs of ${jqType(input)}`);
      };

    case "input":
    case "inputs":
      throw new JqRuntimeError(`${name} is not supported in jq-js`);

    default:
      throw new JqRuntimeError(`Unknown function: ${name}`);
  }
}

// --- Helpers ---

function generateValues(
  node: AstNode,
  env: Env,
  input: JsonValue,
  onValue: (v: JsonValue) => void,
  onError: (e: unknown) => void,
): void {
  switch (node.kind) {
    case "pipe": {
      generateValues(
        node.left,
        env,
        input,
        (leftVal) => generateValues(node.right, env, leftVal, onValue, onError),
        onError,
      );
      break;
    }
    case "comma": {
      generateValues(node.left, env, input, onValue, onError);
      generateValues(node.right, env, input, onValue, onError);
      break;
    }
    default: {
      try {
        for (const val of compile(node, env)(input)) {
          onValue(val);
        }
      } catch (e) {
        if (e instanceof BreakSignal) throw e;
        onError(e);
      }
    }
  }
}

function jqType(v: JsonValue): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function jqTruncate(v: JsonValue): string {
  const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);
  if (s.length > 15) {
    // Truncate string content (inside quotes) at ~15 visible chars
    if (typeof v === "string") {
      const inner = v.length > 13 ? v.slice(0, 13) + "..." : v;
      return JSON.stringify(inner);
    }
    return s.length > 20 ? s.slice(0, 17) + "..." : s;
  }
  return s;
}

function isTruthy(v: JsonValue | undefined): boolean {
  return v !== false && v !== null && v !== undefined;
}

function jsonToString(v: JsonValue): string {
  if (typeof v === "string") return v;
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
  if (op === "+" && typeof l === "string" && typeof r === "string") return l + r;
  // Array concatenation
  if (op === "+" && Array.isArray(l) && Array.isArray(r)) return [...l, ...r];
  // Object merge
  if (
    op === "+" &&
    l !== null &&
    r !== null &&
    typeof l === "object" &&
    typeof r === "object" &&
    !Array.isArray(l) &&
    !Array.isArray(r)
  ) {
    return { ...l, ...r };
  }
  // Array subtraction
  if (op === "-" && Array.isArray(l) && Array.isArray(r)) {
    return l.filter((item) => !r.some((rItem) => JSON.stringify(item) === JSON.stringify(rItem)));
  }
  // Object merge with *
  if (
    op === "*" &&
    l !== null &&
    r !== null &&
    typeof l === "object" &&
    typeof r === "object" &&
    !Array.isArray(l) &&
    !Array.isArray(r)
  ) {
    return deepMerge(l as Record<string, JsonValue>, r as Record<string, JsonValue>);
  }
  // null arithmetic
  if (op === "+" && l === null) return r;
  if (op === "+" && r === null) return l;
  if (op === "-" && l === null) return r;
  if (op === "-" && r === null) return l;

  if (typeof l !== "number" || typeof r !== "number") {
    throw new JqRuntimeError(`Cannot apply ${op} to ${jqType(l)} and ${jqType(r)}`);
  }
  switch (op) {
    case "+":
      return l + r;
    case "-":
      return l - r;
    case "*":
      return l * r;
    case "/":
      if (r === 0) throw new JqRuntimeError("Division by zero");
      return l / r;
    case "%":
      if (r === 0) throw new JqRuntimeError("Modulo by zero");
      return l % r;
    default:
      throw new JqRuntimeError(`Unknown operator: ${op}`);
  }
}

function applyCompare(op: string, l: JsonValue, r: JsonValue): JsonValue {
  const cmp = jqCompare(l, r);
  switch (op) {
    case "==":
      return cmp === 0;
    case "!=":
      return cmp !== 0;
    case "<":
      return cmp < 0;
    case ">":
      return cmp > 0;
    case "<=":
      return cmp <= 0;
    case ">=":
      return cmp >= 0;
    default:
      return false;
  }
}

function typeOrder(v: JsonValue): number {
  if (v === null) return 0;
  if (v === false) return 1;
  if (v === true) return 2;
  if (typeof v === "number") return 3;
  if (typeof v === "string") return 4;
  if (Array.isArray(v)) return 5;
  return 6; // object
}

function jqCompare(a: JsonValue, b: JsonValue): number {
  const ta = typeOrder(a);
  const tb = typeOrder(b);
  if (ta !== tb) return ta - tb;

  if (a === null) return 0;
  if (typeof a === "boolean") return 0; // same type, same value (handled by typeOrder)
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  if (Array.isArray(a) && Array.isArray(b)) {
    for (let i = 0; i < Math.min(a.length, b.length); i++) {
      const c = jqCompare(a[i]!, b[i]!);
      if (c !== 0) return c;
    }
    return a.length - b.length;
  }
  // Objects: compare by keys then values
  if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    const keysCmp = jqCompare(ka, kb);
    if (keysCmp !== 0) return keysCmp;
    for (const k of ka) {
      const c = jqCompare(
        (a as Record<string, JsonValue>)[k]!,
        (b as Record<string, JsonValue>)[k]!,
      );
      if (c !== 0) return c;
    }
    return 0;
  }
  return 0;
}

function deepMerge(a: Record<string, JsonValue>, b: Record<string, JsonValue>): JsonValue {
  const result = { ...a };
  for (const [k, v] of Object.entries(b)) {
    const existing = result[k];
    if (
      existing !== undefined &&
      existing !== null &&
      v !== null &&
      typeof existing === "object" &&
      typeof v === "object" &&
      !Array.isArray(existing) &&
      !Array.isArray(v)
    ) {
      result[k] = deepMerge(existing as Record<string, JsonValue>, v as Record<string, JsonValue>);
    } else {
      result[k] = v;
    }
  }
  return result;
}

// --- Path helpers ---

function getPath(value: JsonValue, path: JsonValue[]): JsonValue {
  let current = value;
  for (const key of path) {
    if (current === null) return null;
    if (typeof key === "string" && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, JsonValue>)[key] ?? null;
    } else if (typeof key === "number" && Array.isArray(current)) {
      current = current[key < 0 ? current.length + key : key] ?? null;
    } else {
      return null;
    }
  }
  return current;
}

function setPath(value: JsonValue, path: JsonValue[], newVal: JsonValue): JsonValue {
  if (path.length === 0) return newVal;
  const key = path[0]!;
  const rest = path.slice(1);
  if (typeof key === "string") {
    const obj =
      value !== null && typeof value === "object" && !Array.isArray(value)
        ? { ...value }
        : ({} as Record<string, JsonValue>);
    obj[key] = setPath(obj[key] ?? null, rest, newVal);
    return obj;
  }
  if (typeof key === "number") {
    const arr = Array.isArray(value) ? [...value] : [];
    const idx = key < 0 ? arr.length + key : key;
    while (arr.length <= idx) arr.push(null);
    arr[idx] = setPath(arr[idx] ?? null, rest, newVal);
    return arr;
  }
  throw new JqRuntimeError(`Invalid path key type: ${jqType(key)}`);
}

function delPath(value: JsonValue, path: JsonValue[]): JsonValue {
  if (path.length === 0) return value;
  if (path.length === 1) {
    const key = path[0]!;
    if (
      typeof key === "string" &&
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      const obj = { ...value };
      delete obj[key];
      return obj;
    }
    if (typeof key === "number" && Array.isArray(value)) {
      const arr = [...value];
      const idx = key < 0 ? arr.length + key : key;
      arr.splice(idx, 1);
      return arr;
    }
    return value;
  }
  const key = path[0]!;
  const rest = path.slice(1);
  if (
    typeof key === "string" &&
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  ) {
    const obj = { ...value };
    if (key in obj) obj[key] = delPath(obj[key]!, rest);
    return obj;
  }
  if (typeof key === "number" && Array.isArray(value)) {
    const arr = [...value];
    const idx = key < 0 ? arr.length + key : key;
    if (idx >= 0 && idx < arr.length) arr[idx] = delPath(arr[idx]!, rest);
    return arr;
  }
  return value;
}

function collectPaths(
  value: JsonValue,
  node: import("./ast.js").AstNode,
  results: JsonValue[],
): void {
  // Simplified path collection - handles common cases
  if (node.kind === "field") {
    results.push([node.name]);
  } else if (node.kind === "identity") {
    results.push([]);
  } else if (node.kind === "iterate") {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) results.push([i]);
    } else if (value !== null && typeof value === "object") {
      for (const k of Object.keys(value)) results.push([k]);
    }
  } else if (node.kind === "recurse") {
    const walk = (v: JsonValue, path: JsonValue[]) => {
      results.push(path);
      if (Array.isArray(v)) {
        v.forEach((item, i) => walk(item, [...path, i]));
      } else if (v !== null && typeof v === "object") {
        for (const [k, val] of Object.entries(v)) walk(val, [...path, k]);
      }
    };
    walk(value, []);
  } else if (node.kind === "pipe") {
    // For a.b — collect paths by walking the pipe chain
    const leftPaths: JsonValue[] = [];
    collectPaths(value, node.left, leftPaths);
    for (const lp of leftPaths) {
      const subVal = getPath(value, lp as JsonValue[]);
      const rightPaths: JsonValue[] = [];
      collectPaths(subVal, node.right, rightPaths);
      for (const rp of rightPaths) {
        results.push([...(lp as JsonValue[]), ...(rp as JsonValue[])]);
      }
    }
  } else if (node.kind === "optional") {
    try {
      collectPaths(value, node.expr, results);
    } catch {
      // optional — ignore errors
    }
  }
}

const BUILTIN_NAMES = [
  "length",
  "utf8bytelength",
  "keys",
  "keys_unsorted",
  "values",
  "has",
  "contains",
  "inside",
  "add",
  "any",
  "all",
  "flatten",
  "range",
  "floor",
  "ceil",
  "round",
  "sqrt",
  "fabs",
  "pow",
  "log",
  "log2",
  "log10",
  "exp",
  "exp2",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "nan",
  "infinite",
  "isnan",
  "isinfinite",
  "isfinite",
  "isnormal",
  "sort",
  "sort_by",
  "group_by",
  "unique",
  "unique_by",
  "max",
  "max_by",
  "min",
  "min_by",
  "reverse",
  "map",
  "map_values",
  "select",
  "empty",
  "error",
  "debug",
  "type",
  "not",
  "null",
  "true",
  "false",
  "tostring",
  "tonumber",
  "tojson",
  "fromjson",
  "ascii_downcase",
  "ascii_upcase",
  "ltrimstr",
  "rtrimstr",
  "startswith",
  "endswith",
  "split",
  "join",
  "test",
  "match",
  "capture",
  "scan",
  "sub",
  "gsub",
  "splits",
  "index",
  "rindex",
  "indices",
  "explode",
  "implode",
  "to_entries",
  "from_entries",
  "with_entries",
  "recurse",
  "walk",
  "until",
  "while",
  "repeat",
  "limit",
  "first",
  "last",
  "nth",
  "arrays",
  "objects",
  "iterables",
  "booleans",
  "numbers",
  "strings",
  "nulls",
  "scalars",
  "path",
  "getpath",
  "setpath",
  "delpaths",
  "leaf_paths",
  "abs",
  "builtins",
];

// --- Regex helpers ---

function buildRegex(
  pattern: JsonValue,
  flags: JsonValue | null,
  defaultFlags: string,
): [RegExp, boolean] {
  let patStr: string;
  let flagStr = defaultFlags;

  if (Array.isArray(pattern)) {
    patStr = String(pattern[0]);
    if (pattern.length > 1) flagStr = String(pattern[1]);
  } else {
    patStr = String(pattern);
  }

  if (flags !== null && flags !== undefined) {
    if (typeof flags === "string") flagStr = flags;
  }

  // jq flag 'x' (extended) — strip comments and unescaped whitespace
  const hasX = flagStr.includes("x");
  if (hasX) {
    patStr = patStr.replace(/#[^\n]*/g, "").replace(/(?<!\\)\s+/g, "");
    flagStr = flagStr.replace(/x/g, "");
  }
  // jq 'n' flag — not a JS flag, used by jq for explicit captures only
  const hasN = flagStr.includes("n");
  if (hasN) flagStr = flagStr.replace(/n/g, "");
  // jq 'g' flag
  const hasGlobal = flagStr.includes("g") || defaultFlags.includes("g");
  // Map remaining jq flags to JS: i, m, s → i, m, s
  let jsFlags = "";
  if (flagStr.includes("i")) jsFlags += "i";
  if (flagStr.includes("m")) jsFlags += "m";
  if (flagStr.includes("s")) jsFlags += "s";
  if (hasGlobal) jsFlags += "g";

  return [new RegExp(patStr, jsFlags), hasGlobal];
}

function buildMatchObject(m: RegExpExecArray): JsonValue {
  const captures: JsonValue[] = [];
  const namedCaptures: Record<string, JsonValue> = {};
  if (m.length > 1) {
    for (let i = 1; i < m.length; i++) {
      const groupName = m.groups
        ? (Object.entries(m.groups).find(([_, v]) => v === m[i])?.[0] ?? null)
        : null;
      if (m[i] === undefined) {
        captures.push({ offset: -1, length: 0, string: null, name: groupName });
        if (groupName) namedCaptures[groupName] = null;
      } else {
        const groupStr = m[i]!;
        const groupOffset =
          m[0]!.indexOf(groupStr) >= 0 ? m.index + m[0]!.indexOf(groupStr) : m.index;
        captures.push({
          offset: groupOffset,
          length: groupStr.length,
          string: groupStr,
          name: groupName,
        });
        if (groupName) namedCaptures[groupName] = groupStr;
      }
    }
  }
  return {
    offset: m.index,
    length: m[0]!.length,
    string: m[0]!,
    captures,
    ...namedCaptures,
  };
}

function collectAllMatches(re: RegExp, input: string): JsonValue[] {
  const results: JsonValue[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    results.push(buildMatchObject(m));
    if (m[0]!.length === 0) re.lastIndex++;
  }
  return results;
}

function jsonContains(a: JsonValue, b: JsonValue): boolean {
  if (typeof b === "string" && typeof a === "string") return a.includes(b);
  if (typeof a !== typeof b) return false;
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) {
    return b.every((bItem) => a.some((aItem) => jsonContains(aItem, bItem)));
  }
  if (
    a !== null &&
    b !== null &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    return Object.keys(b).every((k) =>
      jsonContains(
        (a as Record<string, JsonValue>)[k] ?? null,
        (b as Record<string, JsonValue>)[k]!,
      ),
    );
  }
  return JSON.stringify(a) === JSON.stringify(b);
}
