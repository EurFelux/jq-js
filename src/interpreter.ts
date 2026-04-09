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
  results: JsonValue[] | undefined;
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
            if (isNaN(idx)) {
              if (Array.isArray(input)) {
                throw new JqRuntimeError(`number (nan) and array cannot be iterated`);
              }
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with number`);
            }
            if (!Array.isArray(input)) {
              throw new JqRuntimeError(`Cannot index ${jqType(input)} with number`);
            }
            const truncated = Math.floor(idx);
            const i = truncated < 0 ? input.length + truncated : truncated;
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
            const from = normalizeIndex(Math.floor(f as number), len);
            const to = normalizeIndex(Math.floor(t as number), len);
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
      return (input) => {
        const leftResults = leftFn(input);
        const results: JsonValue[] = [];
        for (const l of leftResults) {
          try {
            results.push(...rightFn(l));
          } catch (e) {
            if (e instanceof BreakSignal) {
              e.results = results;
              throw e;
            }
            throw e;
          }
        }
        return results;
      };
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
          : entry.key.kind === "literal" &&
              typeof (entry.key as { value: unknown }).value === "string"
            ? compile(
                {
                  kind: "field",
                  name: (entry.key as { value: string }).value as string,
                  pos: entry.key.pos,
                },
                env,
              )
            : // For computed keys (e.g. string interpolation), use index access
              ((keyFn) => (input: JsonValue) => {
                const keys = keyFn(input);
                return keys.flatMap((k) => {
                  if (input !== null && typeof input === "object" && !Array.isArray(input)) {
                    return [(input as Record<string, JsonValue>)[String(k)] ?? null];
                  }
                  return [null];
                });
              })(compile(entry.key, env)),
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
      const elseFn = node.else_ ? compile(node.else_, env) : null;
      return (input) => {
        const condResults = condFn(input);
        const results: JsonValue[] = [];
        for (const cond of condResults) {
          if (isTruthy(cond)) {
            results.push(...thenFn(input));
          } else {
            let handled = false;
            for (const elif of elifFns) {
              const elifResult = elif.cond(input);
              if (isTruthy(elifResult[0])) {
                results.push(...elif.then(input));
                handled = true;
                break;
              }
            }
            if (!handled) {
              results.push(...(elseFn ? elseFn(input) : [input]));
            }
          }
        }
        return results;
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

    case "try_alternative": {
      const leftFn = compile(node.left, env);
      const rightFn = compile(node.right, env);
      return (input) => {
        try {
          const results = leftFn(input);
          if (results.length === 0) return rightFn(input);
          const filtered = results.filter((v) => v !== null && v !== false);
          return filtered.length > 0 ? filtered : rightFn(input);
        } catch {
          return rightFn(input);
        }
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

    case "format": {
      const strFn = node.str ? compile(node.str, env) : null;
      return (input) => {
        if (strFn) {
          // @format "string interpolation" — apply format to the interpolation result
          const strs = strFn(input);
          return strs.map((s) => applyFormat(node.name, s, node.pos));
        }
        return [applyFormat(node.name, input, node.pos)];
      };
    }

    case "var_ref":
      if (node.name === "$ENV") {
        return () => {
          const result: Record<string, JsonValue> = {};
          if (typeof globalThis.process !== "undefined" && globalThis.process.env) {
            for (const [k, v] of Object.entries(globalThis.process.env)) {
              if (v !== undefined) result[k] = v;
            }
          }
          return [result];
        };
      }
      return (_input) => {
        if (node.name === "$__loc__") return [{ file: "<top-level>", line: 1 }];
        if (node.name === "$ENV") {
          const result: Record<string, JsonValue> = {};
          for (const [k, v] of Object.entries(process.env)) {
            if (v !== undefined) result[k] = v;
          }
          return [result];
        }
        const val = env.vars.get(node.name);
        if (val === undefined) throw new JqRuntimeError(`Undefined variable: ${node.name}`);
        return [val];
      };

    case "as": {
      const exprFn = compile(node.expr, env);
      const hasAlternatives = node.alternativePatterns.length > 0;
      const allPatterns = [node.pattern, ...node.alternativePatterns];
      return (input) => {
        const values = exprFn(input);
        if (!hasAlternatives) {
          return values.flatMap((val) => {
            const newEnv = extendEnv(env);
            bindPattern(newEnv, node.pattern, val);
            return compile(node.body, newEnv)(input);
          });
        }
        // Collect all variable names from all patterns for null-initialization
        const allVarNames: string[] = [];
        for (const p of allPatterns) collectPatternVars(p, allVarNames);
        return values.flatMap((val) => {
          for (let i = 0; i < allPatterns.length; i++) {
            try {
              const newEnv = extendEnv(env);
              // Pre-initialize all vars to null
              for (const name of allVarNames) newEnv.vars.set(name, null);
              strictBindPattern(newEnv, allPatterns[i]!, val);
              return compile(node.body, newEnv)(input);
            } catch {
              if (i === allPatterns.length - 1) {
                // Last pattern also failed — try non-strict bind on last pattern
                const newEnv = extendEnv(env);
                for (const name of allVarNames) newEnv.vars.set(name, null);
                bindPattern(newEnv, allPatterns[i]!, val);
                return compile(node.body, newEnv)(input);
              }
            }
          }
          return [];
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
        const initValues = initFn(input);
        const values = exprFn(input);
        const results: JsonValue[] = [];
        for (const initVal of initValues) {
          let acc: JsonValue = initVal ?? null;
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
            return e.results ?? [];
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

    case "import":
      throw new JqRuntimeError("Module system (import) is not yet supported in jq-js");

    case "include":
      throw new JqRuntimeError("Module system (include) is not yet supported in jq-js");

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
            // For +=, -=, etc., evaluate the RHS with the original input, not the old value
            const newVal = bodyFn(input)[0] ?? null;
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
        const val = updater(null);
        if (val === (REMOVE_SENTINEL as unknown)) return null;
        return { [node.name]: val };
      }
      if (typeof root !== "object" || Array.isArray(root)) {
        throw new JqRuntimeError(`Cannot index ${jqType(root)} with string "${node.name}"`);
      }
      const obj = { ...root };
      const val = updater(obj[node.name] ?? null);
      if (val === (REMOVE_SENTINEL as unknown)) {
        delete obj[node.name];
      } else {
        obj[node.name] = val;
      }
      return obj;
    }

    case "index": {
      const idxFn = compile(node.index, env);
      const indices = idxFn(root);
      if (indices.length <= 1) {
        // Single index: apply directly
        const idx = indices[0];
        if (idx === undefined) return root;
        if (typeof idx === "number") {
          if (root === null) root = [];
          if (!Array.isArray(root))
            throw new JqRuntimeError(`Cannot index ${jqType(root)} with number`);
          if (isNaN(idx)) return root;
          if (idx < 0) {
            const i = root.length + idx;
            if (i < 0) throw new JqRuntimeError("Out of bounds negative array index");
            const arr = [...root];
            const val = updater(arr[i] ?? null);
            if (val === (REMOVE_SENTINEL as unknown)) {
              arr.splice(i, 1);
            } else {
              arr[i] = val;
            }
            return arr;
          }
          if (idx > 536870911) throw new JqRuntimeError("Array index too large");
          const arr = [...root];
          while (arr.length <= idx) arr.push(null);
          const val = updater(arr[idx] ?? null);
          if (val === (REMOVE_SENTINEL as unknown)) {
            arr.splice(idx, 1);
          } else {
            arr[idx] = val;
          }
          return arr;
        }
        if (
          typeof idx === "string" &&
          root !== null &&
          typeof root === "object" &&
          !Array.isArray(root)
        ) {
          const obj = { ...root };
          const val = updater(obj[idx] ?? null);
          if (val === (REMOVE_SENTINEL as unknown)) {
            delete obj[idx];
          } else {
            obj[idx] = val;
          }
          return obj;
        }
        throw new JqRuntimeError(`Cannot index ${jqType(root)}`);
      }

      // Multiple indices: apply all, collect REMOVE_SENTINEL markers
      // First pass: apply updater to each index on the ORIGINAL array
      if (Array.isArray(root)) {
        const arr = [...root];
        const toRemove = new Set<number>();
        for (const idx of indices) {
          if (typeof idx !== "number" || isNaN(idx)) continue;
          const i = idx < 0 ? arr.length + idx : idx;
          if (i < 0) throw new JqRuntimeError("Out of bounds negative array index");
          const val = updater(arr[i] ?? null);
          if (val === (REMOVE_SENTINEL as unknown)) {
            toRemove.add(i);
          } else {
            arr[i] = val;
          }
        }
        if (toRemove.size > 0) {
          return arr.filter((_, i) => !toRemove.has(i));
        }
        return arr;
      }
      if (root !== null && typeof root === "object") {
        const obj = { ...root };
        for (const idx of indices) {
          if (typeof idx !== "string") continue;
          const val = updater(obj[idx] ?? null);
          if (val === (REMOVE_SENTINEL as unknown)) {
            delete obj[idx];
          } else {
            obj[idx] = val;
          }
        }
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
      if (updated === (REMOVE_SENTINEL as unknown)) {
        arr.splice(f, t - f);
      } else if (Array.isArray(updated)) {
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
        // For non-array root, check condition on the root itself
        const condResult = condFn(root);
        if (condResult.length > 0 && isTruthy(condResult[0])) {
          return updater(root);
        }
        return root; // condition not met, don't update
      }
      // Check for user-defined function that might be a path expression
      const userFunc = env.funcs.get(node.name);
      if (userFunc) {
        // Expand the user-defined function body and use it as a path
        const funcEnv = extendEnv(userFunc.closure);
        for (let i = 0; i < userFunc.params.length; i++) {
          const paramName = userFunc.params[i]!;
          const argNode = node.args[i];
          if (argNode) {
            funcEnv.funcs.set(paramName, { params: [], body: argNode, closure: env });
          }
        }
        return updatePathInner(root, userFunc.body, funcEnv, updater);
      }
      // For other function calls, check if it's a valid path expression
      // map, sort, reverse, etc. are NOT valid path expressions
      const output = compile(node, env)(root);
      const outputStr = JSON.stringify(output.length === 1 ? output[0] : output);
      throw new JqRuntimeError(`Invalid path expression with result ${outputStr}`);
    }

    default:
      // For complex expressions, just evaluate and update
      return updater(compile(node, env)(root)[0] ?? null);
  }
}

function collectPatternVars(pattern: BindingPattern, out: string[]): void {
  switch (pattern.type) {
    case "variable":
      out.push(pattern.name);
      break;
    case "array":
      for (const el of pattern.elements) collectPatternVars(el, out);
      break;
    case "object":
      for (const entry of pattern.entries) collectPatternVars(entry.pattern, out);
      break;
  }
}

function bindPattern(env: Env, pattern: BindingPattern, value: JsonValue): void {
  bindPatternImpl(env, pattern, value, false);
}

function strictBindPattern(env: Env, pattern: BindingPattern, value: JsonValue): void {
  bindPatternImpl(env, pattern, value, true);
}

function bindPatternImpl(
  env: Env,
  pattern: BindingPattern,
  value: JsonValue,
  strict: boolean,
): void {
  switch (pattern.type) {
    case "variable":
      env.vars.set(pattern.name, value);
      break;
    case "array": {
      if (strict && !Array.isArray(value)) {
        throw new JqRuntimeError(`Cannot destructure ${jqType(value)} as array`);
      }
      const arr = Array.isArray(value) ? value : [];
      for (let i = 0; i < pattern.elements.length; i++) {
        bindPatternImpl(env, pattern.elements[i]!, arr[i] ?? null, strict);
      }
      break;
    }
    case "object": {
      if (strict && (value === null || typeof value !== "object" || Array.isArray(value))) {
        throw new JqRuntimeError(`Cannot destructure ${jqType(value)} as object`);
      }
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
        bindPatternImpl(env, entry.pattern, obj[keyStr] ?? null, strict);
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
        // Type selector: pass through non-null values, filter out null
        if (input === null) return [];
        return [input];
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
        return (input) => {
          let found = false;
          generateValues(
            args[0]!,
            env,
            input,
            (v) => {
              if (found) return;
              try {
                if (compile(args[1]!, env)(v).some(isTruthy)) found = true;
              } catch {
                /* skip errors */
              }
            },
            () => {},
          );
          return [found];
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
        return (input) => {
          let allTrue = true;
          generateValues(
            args[0]!,
            env,
            input,
            (v) => {
              if (!allTrue) return;
              try {
                if (!compile(args[1]!, env)(v).some(isTruthy)) allTrue = false;
              } catch {
                allTrue = false;
              }
            },
            () => {},
          );
          return [allTrue];
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
          return depthFn(input).map((d) => {
            if (typeof d === "number" && d < 0)
              throw new JqRuntimeError("flatten depth must not be negative");
            return flattenArray(input, d as number);
          });
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
          if (input.includes("\0")) {
            const escaped = input.replace(/\0/g, "\\u0000");
            throw new JqRuntimeError(`string ("${escaped}") cannot be parsed as a number`);
          }
          if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(input.trim()))
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
        return [input.replace(/[A-Z]/g, (c) => c.toLowerCase())];
      };

    case "ascii_upcase":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError(`Cannot upcase ${jqType(input)}`);
        return [input.replace(/[a-z]/g, (c) => c.toUpperCase())];
      };

    case "ltrimstr": {
      if (args.length !== 1) throw new JqRuntimeError("ltrimstr/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        return argFn(input).map((prefix) => {
          if (typeof input !== "string" || typeof prefix !== "string") {
            throw new JqRuntimeError("startswith() requires string inputs");
          }
          if (input.startsWith(prefix)) {
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
        return argFn(input).map((suffix) => {
          if (typeof input !== "string" || typeof suffix !== "string") {
            throw new JqRuntimeError("endswith() requires string inputs");
          }
          if (suffix.length > 0 && input.endsWith(suffix)) {
            return input.slice(0, -suffix.length);
          }
          return input;
        });
      };
    }

    case "trimstr": {
      if (args.length !== 1) throw new JqRuntimeError("trimstr/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        return argFn(input).map((s) => {
          if (typeof input !== "string" || typeof s !== "string")
            throw new JqRuntimeError("startswith() requires string inputs");
          let result = input;
          if (s.length > 0) {
            if (result.startsWith(s)) result = result.slice(s.length);
            if (result.endsWith(s)) result = result.slice(0, -s.length);
          }
          return result;
        });
      };
    }

    case "trim":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError("trim input must be a string");
        return [trimUnicode(input, "both")];
      };

    case "ltrim":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError("trim input must be a string");
        return [trimUnicode(input, "left")];
      };

    case "rtrim":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError("trim input must be a string");
        return [trimUnicode(input, "right")];
      };

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
        return (input) => {
          const results = limitedEval(args[0]!, env, input, 1);
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
      return (input) => {
        const allResults: JsonValue[] = [];
        for (const nVal of nFn(input)) {
          const n = nVal as number;
          if (n < 0) throw new JqRuntimeError("limit doesn't support negative count");
          if (n === 0) continue;
          const results = limitedEval(args[1]!, env, input, n);
          allResults.push(...results);
        }
        return allResults;
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
        return (input) => {
          const allResults: JsonValue[] = [];
          for (const nVal of nFn(input)) {
            const n = nVal as number;
            if (n < 0) throw new JqRuntimeError("nth doesn't support negative indices");
            // Need n+1 results to get the nth (0-indexed)
            const results = limitedEval(args[1]!, env, input, n + 1);
            if (n < results.length) allResults.push(results[n]!);
          }
          return allResults;
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
        result.sort(jqCompare);
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
        return [input.reduce((a, b) => (jqCompare(a, b) > 0 ? a : b))];
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
        return [input.reduce((a, b) => (jqCompare(fn(a)[0]!, fn(b)[0]!) > 0 ? a : b))];
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
            const e = entry as Record<string, JsonValue>;
            const key = e.key ?? e.Key ?? e.name ?? e.Name;
            const value = e.value ?? e.Value;
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
      return (input) => [jqStringify(input)];

    case "fromjson":
      return (input) => {
        if (typeof input !== "string")
          throw new JqRuntimeError(`Cannot parse ${jqType(input)} as JSON`);
        // Handle NaN/nan and variants
        if (input === "nan" || input === "NaN" || input === "-NaN" || input === "-nan") {
          return [NaN as unknown as JsonValue];
        }
        // Handle NaN with trailing chars (like NaN1, NaN10, etc.) — error
        if (/^-?[Nn][Aa][Nn].+$/.test(input)) {
          throw new JqRuntimeError(
            `Invalid numeric literal at EOF at line 1, column ${input.length} (while parsing '${input}')`,
          );
        }
        try {
          return [JSON.parse(input) as JsonValue];
        } catch {
          // Generate jq-compatible error messages
          if (input.startsWith("'") || input.includes("'")) {
            const col = input.indexOf("'") + 1;
            throw new JqRuntimeError(
              `Invalid string literal; expected ", but got ' at line 1, column ${col} (while parsing '${input}')`,
            );
          }
          throw new JqRuntimeError(
            `Invalid numeric literal at EOF at line 1, column ${input.length} (while parsing '${input}')`,
          );
        }
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
        return argFn(input).map((s) => {
          if (typeof input !== "string" || typeof s !== "string")
            throw new JqRuntimeError("startswith() requires string inputs");
          return input.startsWith(s);
        });
      };
    }

    case "endswith": {
      if (args.length !== 1) throw new JqRuntimeError("endswith/1 requires 1 argument");
      const argFn = compile(args[0]!, env);
      return (input) => {
        return argFn(input).map((s) => {
          if (typeof input !== "string" || typeof s !== "string")
            throw new JqRuntimeError("endswith() requires string inputs");
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
        if (typeof input !== "string")
          throw new JqRuntimeError(
            `${jqType(input)} (${jsonToString(input)}) only strings have UTF-8 byte length`,
          );
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
            return setPathChecked(input, p, v);
          }),
        );
    }

    case "delpaths": {
      if (args.length !== 1) throw new JqRuntimeError("delpaths/1 requires 1 argument");
      const pathsFn = compile(args[0]!, env);
      return (input) =>
        pathsFn(input).map((paths) => {
          if (!Array.isArray(paths))
            throw new JqRuntimeError("Paths must be specified as an array");
          let result = input;
          // Sort by path, deeper paths first, then by index descending for same-depth
          const sorted = [...(paths as JsonValue[][])].sort((a, b) => {
            // First by length descending (deeper paths first)
            if (a.length !== b.length) return b.length - a.length;
            // Then compare elements to sort indices descending
            for (let i = 0; i < a.length; i++) {
              if (typeof a[i] === "number" && typeof b[i] === "number") {
                if ((a[i] as number) !== (b[i] as number))
                  return (b[i] as number) - (a[i] as number);
              }
            }
            return 0;
          });
          for (const p of sorted) {
            result = delPath(result, p);
          }
          return result;
        });
    }

    case "path": {
      if (args.length !== 1) throw new JqRuntimeError("path/1 requires 1 argument");
      return (input) => {
        const paths: JsonValue[] = [];
        collectPaths(input, args[0]!, paths, env);
        return paths;
      };
    }

    case "paths": {
      if (args.length === 0) {
        // paths with no args: all paths (excluding root)
        return (input) => {
          const paths: JsonValue[][] = [];
          const walk = (v: JsonValue, path: JsonValue[]) => {
            if (path.length > 0) paths.push(path);
            if (Array.isArray(v)) {
              v.forEach((item, i) => walk(item, [...path, i]));
            } else if (v !== null && typeof v === "object") {
              for (const [k, val] of Object.entries(v)) walk(val, [...path, k]);
            }
          };
          walk(input, []);
          return paths;
        };
      }
      // paths(filter) - all paths where filter is truthy on the node
      const filterFn = compile(args[0]!, env);
      return (input) => {
        const paths: JsonValue[][] = [];
        const walk = (v: JsonValue, path: JsonValue[]) => {
          try {
            const result = filterFn(v);
            if (result.length > 0 && isTruthy(result[0])) {
              paths.push(path);
            }
          } catch {
            // skip on error
          }
          if (Array.isArray(v)) {
            v.forEach((item, i) => walk(item, [...path, i]));
          } else if (v !== null && typeof v === "object") {
            for (const [k, val] of Object.entries(v)) walk(val, [...path, k]);
          }
        };
        walk(input, []);
        return paths;
      };
    }

    case "del": {
      if (args.length !== 1) throw new JqRuntimeError("del/1 requires 1 argument");
      return (input) => {
        // del(.) returns null
        if (args[0]!.kind === "identity") return [null];
        // del(empty) is a no-op
        if (args[0]!.kind === "func" && (args[0] as any).name === "empty") return [input];
        // Collect all deletion paths from the ORIGINAL input
        const paths: JsonValue[][] = [];
        collectDelPaths(input, args[0]!, paths, env);
        if (paths.length === 0) return [input];
        // Sort paths: deeper first, then by index descending for same prefix
        const sorted = paths.sort((a, b) => {
          const minLen = Math.min(a.length, b.length);
          for (let i = 0; i < minLen; i++) {
            if (typeof a[i] === "number" && typeof b[i] === "number") {
              if ((a[i] as number) !== (b[i] as number)) return (b[i] as number) - (a[i] as number);
            } else if (a[i] !== b[i]) {
              return String(b[i]!) > String(a[i]!) ? 1 : -1;
            }
          }
          return b.length - a.length;
        });
        let result = input;
        for (const p of sorted) {
          result = delPath(result, p);
        }
        return [result];
      };
    }

    case "pick": {
      if (args.length !== 1) throw new JqRuntimeError("pick/1 requires 1 argument");
      return (input) => {
        const paths: JsonValue[] = [];
        collectPaths(input, args[0]!, paths, env);
        let result: JsonValue = null;
        for (const p of paths as JsonValue[][]) {
          const val = getPath(input, p);
          result = setPath(result, p, val);
        }
        return [result];
      };
    }

    case "skip": {
      if (args.length !== 2) throw new JqRuntimeError("skip/2 requires 2 arguments");
      const nFn = compile(args[0]!, env);
      const exprFn = compile(args[1]!, env);
      return (input) => {
        const allResults: JsonValue[] = [];
        for (const nVal of nFn(input)) {
          const n = nVal as number;
          if (n < 0) throw new JqRuntimeError("skip doesn't support negative count");
          try {
            const results = exprFn(input);
            allResults.push(...results.slice(n));
          } catch {
            // on error, no results
          }
        }
        return allResults;
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
    case "fabs":
      return (input) => {
        if (typeof input === "number") {
          const v = Math.abs(input);
          return [Object.is(v, -0) ? 0 : v];
        }
        // jq: abs on non-numbers returns the value unchanged (like length)
        return [input];
      };

    case "nan":
      return () => [NaN];

    case "infinite":
      return () => [Infinity];

    case "isnan":
      return (input) => {
        if (typeof input === "number") return [isNaN(input)];
        return [false];
      };

    case "isinfinite":
      return (input) => {
        if (typeof input === "number") return [!isFinite(input) && !isNaN(input)];
        return [false];
      };

    case "isfinite":
      return (input) => {
        if (typeof input === "number") return [isFinite(input)];
        return [false];
      };

    case "isnormal":
      return (input) => {
        if (typeof input === "number") return [isFinite(input) && input !== 0];
        return [false];
      };

    case "env":
      return () => {
        const result: Record<string, JsonValue> = {};
        if (typeof globalThis.process !== "undefined" && globalThis.process.env) {
          for (const [k, v] of Object.entries(globalThis.process.env)) {
            if (v !== undefined) result[k] = v;
          }
        }
        return [result];
      };

    case "input":
    case "inputs":
      throw new JqRuntimeError(`${name} is not supported in jq-js`);

    case "bsearch": {
      if (args.length !== 1) throw new JqRuntimeError("bsearch/1 requires 1 argument");
      const targetFn = compile(args[0]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot bsearch ${jqType(input)}`);
        return targetFn(input).map((target) => {
          let lo = 0;
          let hi = input.length - 1;
          while (lo <= hi) {
            const mid = Math.floor((lo + hi) / 2);
            const cmp = jqCompare(input[mid]!, target);
            if (cmp === 0) return mid;
            if (cmp < 0) lo = mid + 1;
            else hi = mid - 1;
          }
          return -(lo + 1);
        });
      };
    }

    case "transpose":
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot transpose ${jqType(input)}`);
        const maxLen = input.reduce((max: number, row) => {
          if (!Array.isArray(row)) throw new JqRuntimeError(`Cannot transpose non-array element`);
          return Math.max(max, row.length);
        }, 0);
        const result: JsonValue[][] = [];
        for (let i = 0; i < maxLen; i++) {
          const col: JsonValue[] = [];
          for (const row of input) {
            col.push(Array.isArray(row) && i < row.length ? (row[i] as JsonValue) : null);
          }
          result.push(col);
        }
        return [result];
      };

    case "INDEX": {
      if (args.length === 1) {
        // INDEX(expr): input is array, create object keyed by expr
        const keyFn = compile(args[0]!, env);
        return (input) => {
          if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot INDEX ${jqType(input)}`);
          const result: Record<string, JsonValue> = {};
          for (const item of input) {
            for (const key of keyFn(item)) {
              result[String(key)] = item;
            }
          }
          return [result];
        };
      }
      if (args.length === 2) {
        // INDEX(stream; expr): stream generates values, expr generates keys
        const streamFn = compile(args[0]!, env);
        const keyFn = compile(args[1]!, env);
        return (input) => {
          const result: Record<string, JsonValue> = {};
          for (const item of streamFn(input)) {
            for (const key of keyFn(item)) {
              result[String(key)] = item;
            }
          }
          return [result];
        };
      }
      throw new JqRuntimeError("INDEX requires 1 or 2 arguments");
    }

    case "JOIN": {
      if (args.length !== 2) throw new JqRuntimeError("JOIN/2 requires 2 arguments");
      const idxFn = compile(args[0]!, env);
      const keyFn = compile(args[1]!, env);
      return (input) => {
        if (!Array.isArray(input)) throw new JqRuntimeError(`Cannot JOIN ${jqType(input)}`);
        const idx = idxFn(input)[0];
        return [
          input.map((item) => {
            const key = keyFn(item)[0];
            const keyStr = typeof key === "string" ? key : JSON.stringify(key);
            const lookup =
              idx !== null && typeof idx === "object" && !Array.isArray(idx)
                ? ((idx as Record<string, JsonValue>)[keyStr] ?? null)
                : null;
            return [item, lookup] as JsonValue;
          }),
        ];
      };
    }

    case "IN": {
      if (args.length === 1) {
        // IN(stream): check if input is in stream's outputs
        const streamFn = compile(args[0]!, env);
        return (input) => {
          for (const val of streamFn(input)) {
            if (jqCompare(input, val) === 0) return [true];
          }
          return [false];
        };
      }
      if (args.length === 2) {
        // IN(s; f): any(s; IN(f)) — returns single boolean
        const sFn = compile(args[0]!, env);
        const streamFn = compile(args[1]!, env);
        return (input) => {
          const streamVals = streamFn(input);
          for (const sVal of sFn(input)) {
            if (streamVals.some((v) => jqCompare(sVal, v) === 0)) return [true];
          }
          return [false];
        };
      }
      throw new JqRuntimeError("IN requires 1 or 2 arguments");
    }

    case "env":
      return () => {
        const result: Record<string, JsonValue> = {};
        for (const [k, v] of Object.entries(process.env)) {
          if (v !== undefined) result[k] = v;
        }
        return [result];
      };

    // --- Date/time functions ---

    case "now":
      return () => [Math.floor(Date.now() / 1000)];

    case "gmtime":
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`gmtime requires a number, got ${jqType(input)}`);
        const d = new Date(input * 1000);
        const year = d.getUTCFullYear();
        const mon = d.getUTCMonth();
        const mday = d.getUTCDate();
        const hour = d.getUTCHours();
        const min = d.getUTCMinutes();
        const sec = d.getUTCSeconds();
        const wday = d.getUTCDay();
        // Calculate day of year
        const startOfYear = Date.UTC(year, 0, 1);
        const yday = Math.floor((d.getTime() - startOfYear) / 86400000);
        return [[sec, min, hour, mday, mon, year - 1900, wday, yday]];
      };

    case "mktime":
      return (input) => {
        if (!Array.isArray(input) || input.length < 6)
          throw new JqRuntimeError("mktime requires a broken-down time array");
        const [sec, min, hour, mday, mon, tmYear] = input as number[];
        const year = tmYear! + 1900;
        const ts = Date.UTC(year, mon!, mday!, hour!, min!, sec!) / 1000;
        return [ts];
      };

    case "strftime": {
      if (args.length !== 1) throw new JqRuntimeError("strftime requires 1 argument");
      const fmtFilter = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`strftime requires a number input, got ${jqType(input)}`);
        const fmtValues = fmtFilter(input);
        const results: JsonValue[] = [];
        for (const fmt of fmtValues) {
          if (typeof fmt !== "string")
            throw new JqRuntimeError("strftime/1 requires a string format");
          results.push(formatStrftime(fmt, input));
        }
        return results;
      };
    }

    case "strflocaltime": {
      if (args.length !== 1) throw new JqRuntimeError("strflocaltime requires 1 argument");
      const fmtFilter = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`strflocaltime requires a number input, got ${jqType(input)}`);
        const fmtValues = fmtFilter(input);
        const results: JsonValue[] = [];
        for (const fmt of fmtValues) {
          if (typeof fmt !== "string")
            throw new JqRuntimeError("strflocaltime/1 requires a string format");
          results.push(formatStrftime(fmt, input));
        }
        return results;
      };
    }

    case "strptime": {
      if (args.length !== 1) throw new JqRuntimeError("strptime requires 1 argument");
      const fmtFilter = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string")
          throw new JqRuntimeError(`strptime requires a string input, got ${jqType(input)}`);
        const fmtValues = fmtFilter(input);
        const results: JsonValue[] = [];
        for (const fmt of fmtValues) {
          if (typeof fmt !== "string") throw new JqRuntimeError("strptime format must be a string");
          results.push(parseStrptime(input, fmt));
        }
        return results;
      };
    }

    case "todate":
    case "date":
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`todate requires a number, got ${jqType(input)}`);
        return [formatStrftime("%Y-%m-%dT%H:%M:%SZ", input)];
      };

    case "fromdate":
      return (input) => {
        if (typeof input !== "string")
          throw new JqRuntimeError(`fromdate requires a string, got ${jqType(input)}`);
        const d = new Date(input);
        if (isNaN(d.getTime())) throw new JqRuntimeError(`Invalid date string: ${input}`);
        return [Math.floor(d.getTime() / 1000)];
      };

    case "dateadd": {
      if (args.length !== 2) throw new JqRuntimeError("dateadd requires 2 arguments");
      const unitFilter = compile(args[0]!, env);
      const amountFilter = compile(args[1]!, env);
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`dateadd requires a number input, got ${jqType(input)}`);
        const results: JsonValue[] = [];
        for (const unit of unitFilter(input)) {
          for (const amount of amountFilter(input)) {
            if (typeof unit !== "string") throw new JqRuntimeError("dateadd unit must be a string");
            if (typeof amount !== "number")
              throw new JqRuntimeError("dateadd amount must be a number");
            results.push(dateAdd(input, unit, amount));
          }
        }
        return results;
      };
    }

    case "datesub": {
      if (args.length !== 2) throw new JqRuntimeError("datesub requires 2 arguments");
      const unitFilter = compile(args[0]!, env);
      const amountFilter = compile(args[1]!, env);
      return (input) => {
        if (typeof input !== "number")
          throw new JqRuntimeError(`datesub requires a number input, got ${jqType(input)}`);
        const results: JsonValue[] = [];
        for (const unit of unitFilter(input)) {
          for (const amount of amountFilter(input)) {
            if (typeof unit !== "string") throw new JqRuntimeError("datesub unit must be a string");
            if (typeof amount !== "number")
              throw new JqRuntimeError("datesub amount must be a number");
            results.push(dateAdd(input, unit, -amount));
          }
        }
        return results;
      };
    }

    case "toboolean":
      return (input) => {
        if (typeof input === "boolean") return [input];
        if (typeof input === "string") {
          if (input === "true") return [true];
          if (input === "false") return [false];
          const escaped = input.replace(/\0/g, "\\u0000");
          throw new JqRuntimeError(`string ("${escaped}") cannot be parsed as a boolean`);
        }
        throw new JqRuntimeError(
          `${jqType(input)} (${jsonToString(input)}) cannot be parsed as a boolean`,
        );
      };

    case "skip": {
      if (args.length !== 2) throw new JqRuntimeError("skip/2 requires 2 arguments");
      const nFn = compile(args[0]!, env);
      const exprFn = compile(args[1]!, env);
      return (input) => {
        const results: JsonValue[] = [];
        for (const n of nFn(input)) {
          if (typeof n !== "number") throw new JqRuntimeError("skip count must be a number");
          if (n < 0) throw new JqRuntimeError("skip doesn't support negative count");
          const all = exprFn(input);
          results.push(...all.slice(n));
        }
        return results;
      };
    }

    case "pick": {
      if (args.length !== 1) throw new JqRuntimeError("pick/1 requires 1 argument");
      return (input) => {
        const paths: JsonValue[][] = [];
        collectPaths(input, args[0]!, paths);
        let result: JsonValue = null;
        for (const p of paths) {
          const val = getPath(input, p);
          result = setPath(result, p, val);
        }
        return [result];
      };
    }

    case "trim":
    case "ltrim":
    case "rtrim":
      return (input) => {
        if (typeof input !== "string") throw new JqRuntimeError("trim input must be a string");
        if (name === "trim") return [input.replace(WS_START, "").replace(WS_END, "")];
        if (name === "ltrim") return [input.replace(WS_START, "")];
        return [input.replace(WS_END, "")];
      };

    case "trimstr": {
      if (args.length !== 1) throw new JqRuntimeError("trimstr/1 requires 1 argument");
      const strFn = compile(args[0]!, env);
      return (input) => {
        if (typeof input !== "string")
          throw new JqRuntimeError(`trimstr requires a string, got ${jqType(input)}`);
        const results: JsonValue[] = [];
        for (const s of strFn(input)) {
          if (typeof s !== "string") throw new JqRuntimeError("trimstr argument must be a string");
          let r = input;
          if (r.startsWith(s)) r = r.slice(s.length);
          if (r.endsWith(s)) r = r.slice(0, r.length - s.length);
          results.push(r);
        }
        return results;
      };
    }

    case "isempty": {
      if (args.length !== 1) throw new JqRuntimeError("isempty/1 requires 1 argument");
      const fn = compile(args[0]!, env);
      return (input) => {
        try {
          const results = fn(input);
          return [results.length === 0];
        } catch {
          return [false];
        }
      };
    }

    case "strflocaltime": {
      if (args.length !== 1) throw new JqRuntimeError("strflocaltime requires 1 argument");
      const fmtFilter = compile(args[0]!, env);
      return (input) => {
        let timestamp: number;
        if (typeof input === "number") {
          timestamp = input;
        } else if (Array.isArray(input)) {
          // Broken-down time array: [year, month(0-based), day, hour, min, sec, weekday, yearday]
          // Validate that first element is a number
          if (typeof input[0] !== "number") {
            throw new JqRuntimeError("strflocaltime/1 requires parsed datetime inputs");
          }
          const yr = input[0] as number;
          const mo = (input[1] as number) ?? 0;
          const dy = (input[2] as number) ?? 1;
          const hr = (input[3] as number) ?? 0;
          const mi = (input[4] as number) ?? 0;
          const sc = (input[5] as number) ?? 0;
          timestamp = new Date(yr + 1900, mo, dy, hr, mi, sc).getTime() / 1000;
        } else {
          throw new JqRuntimeError(`strflocaltime/1 requires parsed datetime inputs`);
        }
        const fmtValues = fmtFilter(input);
        const results: JsonValue[] = [];
        for (const fmt of fmtValues) {
          if (typeof fmt !== "string")
            throw new JqRuntimeError("strflocaltime format must be a string");
          results.push(formatStrflocaltime(fmt, timestamp));
        }
        return results;
      };
    }

    case "modulemeta":
      return () => {
        return [{ version: null, deps: [], defs: [] }];
      };

    // Math builtins
    case "nan":
      return () => [NaN];
    case "infinite":
      return () => [Infinity];
    case "isnan":
      return (input) => {
        if (typeof input !== "number") return [false];
        return [isNaN(input)];
      };
    case "isinfinite":
      return (input) => {
        if (typeof input !== "number") return [false];
        return [!isFinite(input) && !isNaN(input)];
      };
    case "isfinite":
      return (input) => {
        if (typeof input !== "number") return [false];
        return [isFinite(input)];
      };
    case "isnormal":
      return (input) => {
        if (typeof input !== "number") return [false];
        return [isFinite(input) && input !== 0];
      };
    case "floor":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot floor ${jqType(input)}`);
        return [Math.floor(input)];
      };
    case "ceil":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot ceil ${jqType(input)}`);
        return [Math.ceil(input)];
      };
    case "round":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot round ${jqType(input)}`);
        return [Math.round(input)];
      };
    case "sqrt":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot sqrt ${jqType(input)}`);
        return [Math.sqrt(input)];
      };
    case "sin":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot sin ${jqType(input)}`);
        return [Math.sin(input)];
      };
    case "cos":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot cos ${jqType(input)}`);
        return [Math.cos(input)];
      };
    case "tan":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot tan ${jqType(input)}`);
        return [Math.tan(input)];
      };
    case "asin":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot asin ${jqType(input)}`);
        return [Math.asin(input)];
      };
    case "acos":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot acos ${jqType(input)}`);
        return [Math.acos(input)];
      };
    case "atan":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot atan ${jqType(input)}`);
        return [Math.atan(input)];
      };
    case "log":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot log ${jqType(input)}`);
        return [Math.log(input)];
      };
    case "log2":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot log2 ${jqType(input)}`);
        return [Math.log2(input)];
      };
    case "log10":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot log10 ${jqType(input)}`);
        return [Math.log10(input)];
      };
    case "exp":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot exp ${jqType(input)}`);
        return [Math.exp(input)];
      };
    case "exp2":
      return (input) => {
        if (typeof input !== "number") throw new JqRuntimeError(`Cannot exp2 ${jqType(input)}`);
        return [2 ** input];
      };
    case "pow": {
      if (args.length !== 2) throw new JqRuntimeError("pow/2 requires 2 arguments");
      const baseFn = compile(args[0]!, env);
      const expFn = compile(args[1]!, env);
      return (input) => {
        const results: JsonValue[] = [];
        for (const b of baseFn(input)) {
          for (const e of expFn(input)) {
            if (typeof b !== "number" || typeof e !== "number")
              throw new JqRuntimeError(`pow requires number arguments`);
            results.push(Math.pow(b, e));
          }
        }
        return results;
      };
    }
    case "atan2": {
      if (args.length !== 2) throw new JqRuntimeError("atan2/2 requires 2 arguments");
      const yFn = compile(args[0]!, env);
      const xFn = compile(args[1]!, env);
      return (input) => {
        const results: JsonValue[] = [];
        for (const y of yFn(input)) {
          for (const x of xFn(input)) {
            if (typeof y !== "number" || typeof x !== "number")
              throw new JqRuntimeError(`atan2 requires number arguments`);
            results.push(Math.atan2(y, x));
          }
        }
        return results;
      };
    }
    case "have_decnum":
      return () => [false];

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
    case "import":
      throw new JqRuntimeError("Module system (import) is not yet supported in jq-js");
    case "include":
      throw new JqRuntimeError("Module system (include) is not yet supported in jq-js");
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

function applyFormat(name: string, input: JsonValue, pos: number): JsonValue {
  switch (name) {
    case "base64": {
      const str = typeof input === "string" ? input : JSON.stringify(input);
      return btoa(unescape(encodeURIComponent(str)));
    }
    case "base64d": {
      if (typeof input !== "string") {
        throw new JqRuntimeError("@base64d requires string input");
      }
      return decodeURIComponent(escape(atob(input)));
    }
    case "html": {
      const str = typeof input === "string" ? input : JSON.stringify(input);
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/'/g, "&#39;");
    }
    case "csv": {
      if (!Array.isArray(input)) {
        throw new JqRuntimeError("@csv requires array input");
      }
      return input
        .map((v) => {
          if (typeof v === "string") {
            return '"' + v.replace(/"/g, '""') + '"';
          }
          if (v === null) return "";
          return String(v);
        })
        .join(",");
    }
    case "tsv": {
      if (!Array.isArray(input)) {
        throw new JqRuntimeError("@tsv requires array input");
      }
      return input
        .map((v) => {
          if (typeof v === "string") {
            return v
              .replace(/\\/g, "\\\\")
              .replace(/\t/g, "\\t")
              .replace(/\n/g, "\\n")
              .replace(/\r/g, "\\r");
          }
          if (v === null) return "";
          return String(v);
        })
        .join("\t");
    }
    case "json":
      return JSON.stringify(input);
    case "uri": {
      const str = typeof input === "string" ? input : JSON.stringify(input);
      return encodeURIComponent(str);
    }
    case "urid": {
      if (typeof input !== "string") {
        throw new JqRuntimeError("@urid requires string input");
      }
      return decodeURIComponent(input);
    }
    case "text":
      return jsonToString(input);
    case "sh": {
      if (Array.isArray(input)) {
        return input.map((v) => shQuote(v)).join(" ");
      }
      return shQuote(input);
    }
    default:
      throw new JqRuntimeError(`Unknown format: @${name}`);
  }
}

function shQuote(v: JsonValue): string {
  const str = typeof v === "string" ? v : JSON.stringify(v);
  return "'" + str.replace(/'/g, "'\\''") + "'";
}

// Unicode whitespace pattern matching jq's definition
const UNICODE_WS =
  /[\u0009\u000A\u000B\u000C\u000D\u0020\u0085\u00A0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

function trimUnicode(s: string, side: "left" | "right" | "both"): string {
  let start = 0;
  let end = s.length;
  if (side === "left" || side === "both") {
    while (start < end && UNICODE_WS.test(s[start]!)) start++;
  }
  if (side === "right" || side === "both") {
    while (end > start && UNICODE_WS.test(s[end - 1]!)) end--;
  }
  return s.slice(start, end);
}

function repeatString(s: string, n: number): JsonValue {
  if (n < 0 || isNaN(n)) return null;
  const count = Math.floor(n);
  if (count === 0) return s.length === 0 ? "" : "";
  if (s.length === 0) return "";
  if (s.length * count > 1_000_000_000) throw new JqRuntimeError("Repeat string result too long");
  return s.repeat(count);
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
  // String repetition: string * number or number * string
  if (op === "*" && typeof l === "string" && typeof r === "number") {
    return repeatString(l, r);
  }
  if (op === "*" && typeof l === "number" && typeof r === "string") {
    return repeatString(r, l);
  }
  // String division: string / string = split
  if (op === "/" && typeof l === "string" && typeof r === "string") {
    return l.split(r);
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
    case "%": {
      if (r === 0) throw new JqRuntimeError("Modulo by zero");
      if (isNaN(l) || isNaN(r)) return NaN;
      // jq casts to long long (int64) for modulo
      const LLONG_MAX = 9223372036854775807n;
      const LLONG_MIN = -9223372036854775808n;
      const toBigInt = (v: number): bigint => {
        if (v === Infinity || v > Number.MAX_SAFE_INTEGER) return LLONG_MAX;
        if (v === -Infinity || v < -Number.MAX_SAFE_INTEGER) return LLONG_MIN;
        return BigInt(Math.trunc(v));
      };
      const bl = toBigInt(l);
      const br = toBigInt(r);
      if (br === 0n) throw new JqRuntimeError("Modulo by zero");
      // Avoid LLONG_MIN % -1 (UB in C, we return 0)
      if (bl === LLONG_MIN && br === -1n) return 0;
      const result = Number(bl % br);
      return Object.is(result, -0) ? 0 : result;
    }
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

function setPathChecked(value: JsonValue, path: JsonValue[], newVal: JsonValue): JsonValue {
  if (path.length === 0) return newVal;
  const key = path[0]!;
  const rest = path.slice(1);
  if (typeof key === "string") {
    if (Array.isArray(value)) {
      throw new JqRuntimeError(`Cannot update field at array index of array`);
    }
    const obj =
      value !== null && typeof value === "object"
        ? { ...value }
        : ({} as Record<string, JsonValue>);
    obj[key] = setPathChecked(obj[key] ?? null, rest, newVal);
    return obj;
  }
  if (typeof key === "number") {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      throw new JqRuntimeError(`Cannot index object with number (${key})`);
    }
    const arr = Array.isArray(value) ? [...value] : [];
    const idx = key < 0 ? arr.length + key : key;
    while (arr.length <= idx) arr.push(null);
    arr[idx] = setPathChecked(arr[idx] ?? null, rest, newVal);
    return arr;
  }
  if (Array.isArray(key)) {
    throw new JqRuntimeError(`Cannot update field at array index of array`);
  }
  throw new JqRuntimeError(`Invalid path key type: ${jqType(key)}`);
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
    if (idx < 0) throw new JqRuntimeError("Out of bounds negative array index");
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
      if (isNaN(key)) return value; // NaN index is a no-op
      const arr = [...value];
      const idx = key < 0 ? arr.length + key : key;
      if (idx < 0 || idx >= arr.length) return value; // out of bounds, no-op
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

class LimitReached {
  constructor(public results: JsonValue[]) {}
}

function limitedEval(node: AstNode, env: Env, input: JsonValue, limit: number): JsonValue[] {
  if (limit <= 0) return [];

  if (node.kind === "comma") {
    const leftResults = limitedEval(node.left, env, input, limit);
    if (leftResults.length >= limit) return leftResults.slice(0, limit);
    const rightResults = limitedEval(node.right, env, input, limit - leftResults.length);
    return [...leftResults, ...rightResults];
  }

  if (node.kind === "pipe") {
    const leftResults = limitedEval(node.left, env, input, Infinity);
    const results: JsonValue[] = [];
    for (const l of leftResults) {
      const remaining = limit - results.length;
      if (remaining <= 0) break;
      const rightResults = limitedEval(node.right, env, l, remaining);
      results.push(...rightResults);
    }
    return results.slice(0, limit);
  }

  try {
    const results = compile(node, env)(input);
    return results.slice(0, limit);
  } catch {
    return [];
  }
}

function collectDelPaths(value: JsonValue, node: AstNode, results: JsonValue[][], env: Env): void {
  switch (node.kind) {
    case "comma":
      collectDelPaths(value, node.left, results, env);
      collectDelPaths(value, node.right, results, env);
      return;
    case "pipe": {
      const leftPaths: JsonValue[][] = [];
      collectDelPaths(value, node.left, leftPaths, env);
      for (const lp of leftPaths) {
        const subVal = getPath(value, lp);
        const rightPaths: JsonValue[][] = [];
        collectDelPaths(subVal, node.right, rightPaths, env);
        for (const rp of rightPaths) {
          results.push([...lp, ...rp]);
        }
      }
      return;
    }
    case "slice": {
      // Expand slice into individual indices
      if (!Array.isArray(value)) return;
      const len = value.length;
      const from = node.from ? ((compile(node.from, env)(value)[0] as number) ?? 0) : 0;
      const to = node.to ? ((compile(node.to, env)(value)[0] as number) ?? len) : len;
      const f = normalizeIndex(from, len);
      const t = normalizeIndex(to, len);
      for (let i = f; i < t; i++) {
        results.push([i]);
      }
      return;
    }
    case "identity":
    case "field":
    case "index":
    case "iterate":
    case "recurse":
    case "optional":
    case "func":
      collectPaths(value, node, results as JsonValue[], env);
      return;
    default:
      collectPaths(value, node, results as JsonValue[], env);
      return;
  }
}

function delByExpr(input: JsonValue, node: AstNode, env: Env): JsonValue {
  // For comma nodes, apply left then right
  if (node.kind === "comma") {
    let result = delByExpr(input, node.left, env);
    result = delByExpr(result, node.right, env);
    return result;
  }
  // For pipe nodes like (.foo,.bar,.baz) | .[2,3,0]
  // We need to walk the path and delete
  // Try to collect paths first
  const paths: JsonValue[] = [];
  let hasSlice = false;
  try {
    collectPathsOrSlices(input, node, paths, env, () => {
      hasSlice = true;
    });
  } catch {
    // Fall back to updatePaths
    return updatePaths(input, node, env, () => REMOVE_SENTINEL as unknown as JsonValue);
  }

  if (hasSlice) {
    // If there are slices, use updatePaths approach
    return updatePaths(input, node, env, () => REMOVE_SENTINEL as unknown as JsonValue);
  }

  if (paths.length === 0) return input;

  // Sort paths: deeper first, then by index descending for same prefix
  const sorted = [...(paths as JsonValue[][])].sort((a, b) => {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (typeof a[i] === "number" && typeof b[i] === "number") {
        if ((a[i] as number) !== (b[i] as number)) return (b[i] as number) - (a[i] as number);
      } else if (a[i] !== b[i]) {
        return String(b[i]!) > String(a[i]!) ? 1 : -1;
      }
    }
    return b.length - a.length;
  });

  let result = input;
  for (const p of sorted) {
    result = delPath(result, p);
  }
  return result;
}

function collectPathsOrSlices(
  value: JsonValue,
  node: AstNode,
  results: JsonValue[],
  env: Env,
  onSlice: () => void,
): void {
  if (node.kind === "slice") {
    onSlice();
    return;
  }
  if (node.kind === "comma") {
    collectPathsOrSlices(value, node.left, results, env, onSlice);
    collectPathsOrSlices(value, node.right, results, env, onSlice);
    return;
  }
  if (node.kind === "pipe") {
    // Check if the right side contains a slice
    let rightHasSlice = false;
    const leftPaths: JsonValue[] = [];
    collectPathsOrSlices(value, node.left, leftPaths, env, () => {
      rightHasSlice = true;
    });
    if (rightHasSlice) {
      onSlice();
      return;
    }
    for (const lp of leftPaths) {
      const subVal = getPath(value, lp as JsonValue[]);
      const rightPaths: JsonValue[] = [];
      collectPathsOrSlices(subVal, node.right, rightPaths, env, () => {
        rightHasSlice = true;
      });
      if (rightHasSlice) {
        onSlice();
        return;
      }
      for (const rp of rightPaths) {
        results.push([...(lp as JsonValue[]), ...(rp as JsonValue[])]);
      }
    }
    return;
  }
  // Delegate to regular collectPaths
  collectPaths(value, node, results, env);
}

function describePathNode(node: AstNode): { kind: string; detail?: string } | null {
  if (node.kind === "field") return { kind: "access", detail: `"${node.name}"` };
  if (node.kind === "index") {
    if (node.index.kind === "literal") return { kind: "access", detail: String(node.index.value) };
    return { kind: "access" };
  }
  if (node.kind === "iterate") return { kind: "iterate" };
  if (node.kind === "pipe") {
    // For .[0] which is pipe(identity, index(0)), look at the right side
    if (node.left.kind === "identity") return describePathNode(node.right);
    return describePathNode(node.left);
  }
  return null;
}

function throwInvalidPathNear(node: AstNode, value: JsonValue): never {
  const valStr = JSON.stringify(value);
  const desc = describePathNode(node);
  if (desc) {
    if (desc.kind === "iterate") {
      throw new JqRuntimeError(`Invalid path expression near attempt to iterate through ${valStr}`);
    }
    if (desc.kind === "access" && desc.detail) {
      throw new JqRuntimeError(
        `Invalid path expression near attempt to access element ${desc.detail} of ${valStr}`,
      );
    }
    throw new JqRuntimeError(`Invalid path expression near attempt to access element of ${valStr}`);
  }
  throw new JqRuntimeError(`Invalid path expression with result ${valStr}`);
}

function collectPaths(
  value: JsonValue,
  node: import("./ast.js").AstNode,
  results: JsonValue[],
  env: Env = emptyEnv(),
): void {
  switch (node.kind) {
    case "identity":
      results.push([]);
      return;
    case "field":
      results.push([node.name]);
      return;
    case "index": {
      const idxResults = compile(node.index, env)(value);
      for (const idx of idxResults) {
        // Resolve negative indices for arrays
        if (typeof idx === "number" && idx < 0 && Array.isArray(value)) {
          results.push([value.length + idx]);
        } else {
          results.push([idx]);
        }
      }
      return;
    }
    case "iterate":
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) results.push([i]);
      } else if (value !== null && typeof value === "object") {
        for (const k of Object.keys(value)) results.push([k]);
      }
      return;
    case "recurse": {
      const walk = (v: JsonValue, path: JsonValue[]) => {
        results.push(path);
        if (Array.isArray(v)) {
          v.forEach((item, i) => walk(item, [...path, i]));
        } else if (v !== null && typeof v === "object") {
          for (const [k, val] of Object.entries(v)) walk(val, [...path, k]);
        }
      };
      walk(value, []);
      return;
    }
    case "pipe": {
      let leftPaths: JsonValue[];
      try {
        leftPaths = [];
        collectPaths(value, node.left, leftPaths, env);
      } catch (e) {
        // Left side is not a valid path expression — evaluate it, then check right side
        const leftResult = compile(node.left, env)(value);
        if (leftResult.length === 1) {
          const lv = leftResult[0]!;
          throwInvalidPathNear(node.right, lv);
        }
        throw e;
      }
      for (const lp of leftPaths) {
        const subVal = getPath(value, lp as JsonValue[]);
        const rightPaths: JsonValue[] = [];
        collectPaths(subVal, node.right, rightPaths, env);
        for (const rp of rightPaths) {
          results.push([...(lp as JsonValue[]), ...(rp as JsonValue[])]);
        }
      }
      return;
    }
    case "comma": {
      collectPaths(value, node.left, results, env);
      collectPaths(value, node.right, results, env);
      return;
    }
    case "optional": {
      try {
        collectPaths(value, node.expr, results, env);
      } catch {
        // optional — ignore errors
      }
      return;
    }
    case "func": {
      if (node.name === "select" && node.args.length === 1) {
        // select(cond) in path context — keep current path if condition passes
        const condFn = compile(node.args[0]!, env);
        const condResult = condFn(value);
        if (condResult.length > 0 && isTruthy(condResult[0])) {
          results.push([]);
        }
        return;
      }
      if (node.name === "recurse" && node.args.length === 0) {
        const walk = (v: JsonValue, path: JsonValue[]) => {
          results.push(path);
          if (Array.isArray(v)) {
            v.forEach((item, i) => walk(item, [...path, i]));
          } else if (v !== null && typeof v === "object") {
            for (const [k, val] of Object.entries(v)) walk(val, [...path, k]);
          }
        };
        walk(value, []);
        return;
      }
      if (node.name === "first" && node.args.length === 0) {
        // first = .[0]
        results.push([0]);
        return;
      }
      if (node.name === "last" && node.args.length === 0) {
        // last = .[-1] — uses negative index for path
        results.push([-1]);
        return;
      }
      // Other functions are not valid path expressions
      const output = compile(node, env)(value);
      const outputStr = JSON.stringify(output.length === 1 ? output[0] : output);
      throw new JqRuntimeError(`Invalid path expression with result ${outputStr}`);
    }
    default: {
      // Check if this is a complex expression that produces values navigated from input
      // For expressions like path(.a[path(.b)[0]]), evaluate the expression
      // and see if it navigates the input — but for non-path expressions, error
      const output = compile(node, env)(value);
      const outputStr = JSON.stringify(output.length === 1 ? output[0] : output);
      throw new JqRuntimeError(`Invalid path expression with result ${outputStr}`);
    }
  }
}

// --- Whitespace regex for trim ---
const WS_START = /^[\s\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/;
const WS_END = /[\s\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+$/;

// --- Date/time helpers ---

const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function pad3(n: number): string {
  if (n < 10) return `00${n}`;
  if (n < 100) return `0${n}`;
  return `${n}`;
}

function formatStrftime(fmt: string, timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const year = d.getUTCFullYear();
  const mon = d.getUTCMonth();
  const mday = d.getUTCDate();
  const hour = d.getUTCHours();
  const min = d.getUTCMinutes();
  const sec = d.getUTCSeconds();
  const wday = d.getUTCDay();
  const startOfYear = Date.UTC(year, 0, 1);
  const yday = Math.floor((d.getTime() - startOfYear) / 86400000);

  let result = "";
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      const spec = fmt[i + 1]!;
      switch (spec) {
        case "Y":
          result += `${year}`;
          break;
        case "m":
          result += pad2(mon + 1);
          break;
        case "d":
          result += pad2(mday);
          break;
        case "H":
          result += pad2(hour);
          break;
        case "M":
          result += pad2(min);
          break;
        case "S":
          result += pad2(sec);
          break;
        case "j":
          result += pad3(yday + 1);
          break;
        case "a":
          result += WEEKDAYS_SHORT[wday]!;
          break;
        case "A":
          result += WEEKDAYS_LONG[wday]!;
          break;
        case "b":
          result += MONTHS_SHORT[mon]!;
          break;
        case "B":
          result += MONTHS_LONG[mon]!;
          break;
        case "Z":
          result += "UTC";
          break;
        case "z":
          result += "+0000";
          break;
        case "s":
          result += `${Math.floor(d.getTime() / 1000)}`;
          break;
        case "n":
          result += "\n";
          break;
        case "t":
          result += "\t";
          break;
        case "e":
          result += mday < 10 ? ` ${mday}` : `${mday}`;
          break;
        case "%":
          result += "%";
          break;
        default:
          result += `%${spec}`;
          break;
      }
      i += 2;
    } else {
      result += fmt[i];
      i++;
    }
  }
  return result;
}

function formatStrflocaltime(fmt: string, timestamp: number): string {
  const d = new Date(timestamp * 1000);
  const year = d.getFullYear();
  const mon = d.getMonth();
  const mday = d.getDate();
  const hour = d.getHours();
  const min = d.getMinutes();
  const sec = d.getSeconds();
  const wday = d.getDay();
  const startOfYear = new Date(year, 0, 1).getTime();
  const yday = Math.floor((d.getTime() - startOfYear) / 86400000);
  const tzOffset = -d.getTimezoneOffset();
  const tzSign = tzOffset >= 0 ? "+" : "-";
  const tzHours = pad2(Math.floor(Math.abs(tzOffset) / 60));
  const tzMins = pad2(Math.abs(tzOffset) % 60);

  let result = "";
  let i = 0;
  while (i < fmt.length) {
    if (fmt[i] === "%" && i + 1 < fmt.length) {
      const spec = fmt[i + 1]!;
      switch (spec) {
        case "Y":
          result += `${year}`;
          break;
        case "m":
          result += pad2(mon + 1);
          break;
        case "d":
          result += pad2(mday);
          break;
        case "H":
          result += pad2(hour);
          break;
        case "M":
          result += pad2(min);
          break;
        case "S":
          result += pad2(sec);
          break;
        case "j":
          result += pad3(yday + 1);
          break;
        case "a":
          result += WEEKDAYS_SHORT[wday]!;
          break;
        case "A":
          result += WEEKDAYS_LONG[wday]!;
          break;
        case "b":
          result += MONTHS_SHORT[mon]!;
          break;
        case "B":
          result += MONTHS_LONG[mon]!;
          break;
        case "Z":
          result +=
            Intl.DateTimeFormat("en", { timeZoneName: "short" })
              .formatToParts(d)
              .find((p) => p.type === "timeZoneName")?.value ?? "";
          break;
        case "z":
          result += `${tzSign}${tzHours}${tzMins}`;
          break;
        case "s":
          result += `${Math.floor(d.getTime() / 1000)}`;
          break;
        case "n":
          result += "\n";
          break;
        case "t":
          result += "\t";
          break;
        case "e":
          result += mday < 10 ? ` ${mday}` : `${mday}`;
          break;
        case "%":
          result += "%";
          break;
        default:
          result += `%${spec}`;
          break;
      }
      i += 2;
    } else {
      result += fmt[i];
      i++;
    }
  }
  return result;
}

function parseStrptime(input: string, fmt: string): JsonValue {
  // Basic strptime implementation for common format specifiers
  let year = 1970,
    mon = 0,
    mday = 1,
    hour = 0,
    min = 0,
    sec = 0;
  let fi = 0,
    si = 0;

  while (fi < fmt.length && si < input.length) {
    if (fmt[fi] === "%" && fi + 1 < fmt.length) {
      const spec = fmt[fi + 1]!;
      fi += 2;
      switch (spec) {
        case "Y": {
          const m = input.slice(si).match(/^(\d{4})/);
          if (m) {
            year = parseInt(m[1]!, 10);
            si += m[1]!.length;
          }
          break;
        }
        case "m": {
          const m = input.slice(si).match(/^(\d{1,2})/);
          if (m) {
            mon = parseInt(m[1]!, 10) - 1;
            si += m[1]!.length;
          }
          break;
        }
        case "d": {
          const m = input.slice(si).match(/^(\d{1,2})/);
          if (m) {
            mday = parseInt(m[1]!, 10);
            si += m[1]!.length;
          }
          break;
        }
        case "H": {
          const m = input.slice(si).match(/^(\d{1,2})/);
          if (m) {
            hour = parseInt(m[1]!, 10);
            si += m[1]!.length;
          }
          break;
        }
        case "M": {
          const m = input.slice(si).match(/^(\d{1,2})/);
          if (m) {
            min = parseInt(m[1]!, 10);
            si += m[1]!.length;
          }
          break;
        }
        case "S": {
          const m = input.slice(si).match(/^(\d{1,2})/);
          if (m) {
            sec = parseInt(m[1]!, 10);
            si += m[1]!.length;
          }
          break;
        }
        case "Z": {
          // Skip timezone name
          const m = input.slice(si).match(/^([A-Za-z]+)/);
          if (m) {
            si += m[1]!.length;
          }
          break;
        }
        case "z": {
          // Skip timezone offset
          const m = input.slice(si).match(/^([+-]\d{4})/);
          if (m) {
            si += m[1]!.length;
          }
          break;
        }
        default:
          break;
      }
    } else {
      // Literal character match
      si++;
      fi++;
    }
  }

  const d = new Date(Date.UTC(year, mon, mday, hour, min, sec));
  const actualYear = d.getUTCFullYear();
  const startOfYear = Date.UTC(actualYear, 0, 1);
  const yday = Math.floor((d.getTime() - startOfYear) / 86400000);
  const wday = d.getUTCDay();

  return [sec, min, hour, mday, mon, actualYear - 1900, wday, yday];
}

function dateAdd(timestamp: number, unit: string, amount: number): number {
  switch (unit) {
    case "years": {
      const d = new Date(timestamp * 1000);
      d.setUTCFullYear(d.getUTCFullYear() + amount);
      return Math.floor(d.getTime() / 1000);
    }
    case "months": {
      const d = new Date(timestamp * 1000);
      d.setUTCMonth(d.getUTCMonth() + amount);
      return Math.floor(d.getTime() / 1000);
    }
    case "days":
      return timestamp + amount * 86400;
    case "hours":
      return timestamp + amount * 3600;
    case "minutes":
      return timestamp + amount * 60;
    case "seconds":
      return timestamp + amount;
    default:
      throw new JqRuntimeError(`Unknown time unit: ${unit}`);
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
  "del",
  "pick",
  "skip",
  "paths",
  "leaf_paths",
  "abs",
  "builtins",
  "@base64",
  "@base64d",
  "@html",
  "@csv",
  "@tsv",
  "@json",
  "@uri",
  "@text",
  "@sh",
  "bsearch",
  "transpose",
  "INDEX",
  "IN",
  "env",
  "now",
  "gmtime",
  "mktime",
  "strftime",
  "strptime",
  "todate",
  "date",
  "fromdate",
  "dateadd",
  "datesub",
  "toboolean",
  "skip",
  "pick",
  "trim",
  "ltrim",
  "rtrim",
  "trimstr",
  "isempty",
  "strflocaltime",
  "modulemeta",
  "@urid",
  "atan2",
  "have_decnum",
  "nan",
  "infinite",
  "isnan",
  "isinfinite",
  "isfinite",
  "isnormal",
  "floor",
  "ceil",
  "round",
  "sqrt",
  "sin",
  "cos",
  "tan",
  "asin",
  "acos",
  "atan",
  "log",
  "log2",
  "log10",
  "exp",
  "exp2",
  "pow",
  "JOIN",
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
