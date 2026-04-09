# jq-js

A pure TypeScript implementation of [jq](https://jqlang.github.io/jq/), the JSON processor. Zero native dependencies, full ESM + CJS support.

## Why?

| | jq-js | [node-jq](https://github.com/sanack/node-jq) | [jq-wasm](https://github.com/owenthereal/jq-wasm) | [jsonata](https://github.com/jsonata-js/jsonata) |
|---|---|---|---|---|
| **Implementation** | Pure TypeScript | Shells out to `jq` binary | WASM (C → Emscripten) | Pure JavaScript |
| **jq syntax** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :x: (own DSL) |
| **ESM support** | :white_check_mark: `type: "module"` + `exports` | :x: CJS only | :x: No `exports` | :warning: No `type: "module"` |
| **Browser** | :white_check_mark: | :x: Node only | :white_check_mark: | :white_check_mark: |
| **Native deps** | None | Requires `jq` installed | WASM binary (~1.4MB) | None |
| **Tree-shakeable** | :white_check_mark: | :x: | :x: | :x: |
| **TypeScript** | Written in TS, ships `.d.ts` | `@types/node-jq` | Minimal types | Ships `.d.ts` |
| **Bundle size** | ~85KB (~21KB gzip) | N/A (native) | ~1.4MB (~500KB gzip) | ~74KB (~23KB gzip) |

jq-js is the only option that combines **real jq syntax**, **pure JS** (no WASM/native), and **proper ESM** with `type: "module"` and conditional `exports`.

## Install

```bash
pnpm add @eurfelux/jq-js
# or
npm install @eurfelux/jq-js
# or
yarn add @eurfelux/jq-js
```

## Usage

```typescript
import { jq } from "@eurfelux/jq-js";

// Basic field access
jq(".name", { name: "Alice", age: 30 });
// => ["Alice"]

// Array operations
jq("[.[] | select(. > 2)]", [1, 2, 3, 4, 5]);
// => [[3, 4, 5]]

// Pipe and transform
jq(".users[] | {name, email}", {
  users: [
    { name: "Alice", email: "alice@example.com", role: "admin" },
    { name: "Bob", email: "bob@example.com", role: "user" },
  ],
});
// => [{name: "Alice", email: "alice@example.com"}, {name: "Bob", email: "bob@example.com"}]

// String interpolation
jq('"Hello \\(.name), you are \\(.age) years old"', { name: "Alice", age: 30 });
// => ["Hello Alice, you are 30 years old"]

// Reduce
jq("reduce .[] as $x (0; . + $x)", [1, 2, 3, 4, 5]);
// => [15]
```

## Advanced API

For more control, you can access individual pipeline stages:

```typescript
import { lex, parse, compile } from "@eurfelux/jq-js";

// Tokenize
const tokens = lex(".foo | map(. + 1)");

// Parse to AST
const ast = parse(tokens);

// Compile to reusable filter function
const filter = compile(ast);
filter({ foo: [1, 2, 3] }); // => [[2, 3, 4]]
filter({ foo: [10, 20] }); // => [[11, 21]]
```

## Supported Features

### Core Syntax

| Feature | Syntax | Status |
|---------|--------|--------|
| Identity | `.` | :white_check_mark: |
| Field access | `.foo`, `."foo"`, `.foo.bar` | :white_check_mark: |
| Array index/slice | `.[0]`, `.[-1]`, `.[2:5]` | :white_check_mark: |
| Iteration | `.[]` | :white_check_mark: |
| Pipe | `\|` | :white_check_mark: |
| Comma | `.a, .b` | :white_check_mark: |
| Parentheses | `(expr)` | :white_check_mark: |
| Recursive descent | `..` | :white_check_mark: |
| Optional | `.foo?` | :white_check_mark: |
| Try-catch | `try expr catch handler` | :white_check_mark: |
| Conditionals | `if-then-elif-else-end` | :white_check_mark: |
| String interpolation | `"Hello \(.name)"` | :white_check_mark: |
| Alternative | `//`, `?//` | :white_check_mark: |
| Arithmetic | `+` `-` `*` `/` `%` | :white_check_mark: |
| Comparison | `==` `!=` `<` `>` `<=` `>=` | :white_check_mark: |
| Logic | `and` `or` `not` | :white_check_mark: |
| Array/object construction | `[expr]`, `{key: expr}` | :white_check_mark: |
| Variable binding | `expr as $x \| body` | :white_check_mark: |
| Destructuring | `as [$a, $b]`, `as {k: $v}` | :white_check_mark: |
| Reduce | `reduce .[] as $x (init; update)` | :white_check_mark: |
| Foreach | `foreach .[] as $x (init; update; extract)` | :white_check_mark: |
| Label-break | `label $out \| ... break $out` | :white_check_mark: |
| User-defined functions | `def name(args): body;` | :white_check_mark: |
| Update operators | `\|=` `+=` `-=` `*=` `/=` `%=` `//=` `=` | :white_check_mark: |

### Built-in Functions

**Type & Inspection**: `type`, `length`, `utf8bytelength`, `keys`, `values`, `has`, `contains`, `inside`, `builtins`

**Transform**: `map`, `map_values`, `select`, `empty`, `add`, `any`, `all`, `flatten`, `range`, `reverse`, `sort`, `sort_by`, `group_by`, `unique`, `unique_by`, `min`, `max`, `min_by`, `max_by`, `limit`, `first`, `last`, `nth`, `skip`, `pick`, `isempty`, `transpose`, `bsearch`, `INDEX`, `IN`

**String**: `tostring`, `tonumber`, `toboolean`, `tojson`, `fromjson`, `ascii_downcase`, `ascii_upcase`, `ltrimstr`, `rtrimstr`, `trimstr`, `trim`, `ltrim`, `rtrim`, `startswith`, `endswith`, `split`, `join`, `explode`, `implode`, `index`, `rindex`, `indices`

**Regex**: `test`, `match`, `capture`, `scan`, `sub`, `gsub`, `splits`

**Object**: `to_entries`, `from_entries`, `with_entries`, `keys_unsorted`

**Path**: `path`, `paths`, `getpath`, `setpath`, `delpaths`, `leaf_paths`, `del`

**Math**: `floor`, `ceil`, `round`, `sqrt`, `fabs`, `abs`, `pow`, `log`, `log2`, `log10`, `exp`, `exp2`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `nan`, `infinite`, `isnan`, `isinfinite`, `isfinite`, `isnormal`

**Date/Time**: `now`, `gmtime`, `mktime`, `strftime`, `strptime`, `strflocaltime`, `todate`, `fromdate`, `date`, `dateadd`, `datesub`

**Control**: `recurse`, `walk`, `until`, `while`, `repeat`, `error`, `debug`, `env`, `$ENV`

**Type filters**: `arrays`, `objects`, `numbers`, `strings`, `booleans`, `nulls`, `scalars`, `iterables`, `values`

**Format Strings**: `@base64`, `@base64d`, `@html`, `@csv`, `@tsv`, `@json`, `@uri`, `@urid`, `@text`, `@sh`

**Date/Time**: `now`, `gmtime`, `mktime`, `strftime`, `strptime`, `todate`, `fromdate`, `dateadd`, `datesub`

**Additional**: `try-alternative (?//)`, `$ENV` / `env`, `bsearch`, `transpose`, `INDEX`, `IN`, `pick`, `isempty`, `trim` / `ltrim` / `rtrim`, `toboolean`, `skip`

### Compatibility

jq-js passes **531 of 555** official jq test cases (**95.7%**). The remaining gaps are:

#### Not Supported

| Feature | Reason |
|---------|--------|
| `import` / `include` (module system) | Requires filesystem access; not available in browsers. Parser accepts the syntax but runtime throws an error. |
| Arbitrary precision numbers (`have_decnum`) | JavaScript uses IEEE 754 doubles. Numbers beyond `Number.MAX_SAFE_INTEGER` lose precision. Values like `1E+1000` become `Infinity`. |
| `input` / `inputs` (streaming) | Not applicable — jq-js processes a single input value. |

#### Known Limitations

| Feature | Issue | Workaround |
|---------|-------|------------|
| Recursive update `(.. \| select(cond)) \|= expr` | Complex path updates through recursive descent are not fully supported | Use `path(.. \| select(cond))` with `setpath`/`getpath` |
| `getpath(p) \|= expr` | Update-through-getpath not implemented | Use `setpath(p; getpath(p) \| expr)` |
| Regex `gn` flag | The `n` flag (no-capture for unnamed groups) is not supported | Use named capture groups `(?<name>...)` |
| Regex Unicode `\b` | JavaScript's `\b` does not support multi-codepoint graphemes (e.g. flag emoji) | Use explicit character classes |
| Optional capture groups | JS regex returns `null` for non-participating groups; jq (Oniguruma) returns `""` | Check for both `null` and `""` in downstream code |

## Error Handling

jq-js provides typed errors for each pipeline stage:

```typescript
import { jq, JqLexError, JqParseError, JqRuntimeError } from "@eurfelux/jq-js";

try {
  jq("invalid $$$ filter", null);
} catch (e) {
  if (e instanceof JqLexError) console.log("Tokenization failed:", e.message);
  if (e instanceof JqParseError) console.log("Parse failed:", e.message);
  if (e instanceof JqRuntimeError) console.log("Runtime error:", e.message);
}
```

## Module Formats

jq-js ships with dual ESM + CJS builds and full TypeScript declarations:

```json
{
  "import": "./dist/index.mjs",
  "require": "./dist/index.cjs",
  "types": "./dist/index.d.mts"
}
```

## Development

```bash
pnpm install
pnpm run build        # Build ESM + CJS
pnpm run test         # Run e2e tests
pnpm run test:all     # Run all tests (including official jq test suite)
pnpm run typecheck    # TypeScript type check
pnpm run lint         # oxlint
pnpm run fmt          # oxfmt format
```

## Acknowledgments

This project is inspired by and references the [jq](https://github.com/jqlang/jq) implementation, licensed under the MIT License (Copyright (c) 2012 Stephen Dolan). jq's documentation is licensed under CC BY 3.0.

## License

[MIT](LICENSE)
