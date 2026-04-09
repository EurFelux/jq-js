# jq-js

A pure TypeScript implementation of [jq](https://jqlang.github.io/jq/), the JSON processor. Zero native dependencies, full ESM + CJS support.

## Why?

Existing jq libraries for JavaScript are either WASM wrappers or call a native binary. None offer a **pure JS implementation with proper ESM support**. jq-js fills that gap.

## Install

```bash
pnpm add jq-js
# or
npm install jq-js
# or
yarn add jq-js
```

## Usage

```typescript
import { jq } from "jq-js";

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
import { lex, parse, compile } from "jq-js";

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
| Alternative | `//` | :white_check_mark: |
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

**Transform**: `map`, `map_values`, `select`, `empty`, `add`, `any`, `all`, `flatten`, `range`, `reverse`, `sort`, `sort_by`, `group_by`, `unique`, `unique_by`, `min`, `max`, `min_by`, `max_by`, `limit`, `first`, `last`, `nth`

**String**: `tostring`, `tonumber`, `tojson`, `fromjson`, `ascii_downcase`, `ascii_upcase`, `ltrimstr`, `rtrimstr`, `startswith`, `endswith`, `split`, `join`, `explode`, `implode`, `index`, `rindex`, `indices`

**Regex**: `test`, `match`, `capture`, `scan`, `sub`, `gsub`, `splits`

**Object**: `to_entries`, `from_entries`, `with_entries`, `keys_unsorted`

**Path**: `path`, `getpath`, `setpath`, `delpaths`, `leaf_paths`

**Math**: `floor`, `ceil`, `round`, `sqrt`, `fabs`, `pow`, `log`, `log2`, `log10`, `exp`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `nan`, `infinite`, `isnan`, `isinfinite`, `isfinite`

**Control**: `recurse`, `walk`, `until`, `while`, `repeat`, `error`, `debug`

**Type filters**: `arrays`, `objects`, `numbers`, `strings`, `booleans`, `nulls`, `scalars`, `iterables`

### Not Yet Implemented

- `@format` strings (`@base64`, `@html`, `@csv`, `@tsv`, `@uri`)
- `import` / `include` (module system)
- `$ENV` / `env`
- `input` / `inputs` (streaming)
- `strftime` / `strptime` (date functions)
- `?//` (try-alternative operator)
- `limit` with generators, `SQL`-style operators

## Error Handling

jq-js provides typed errors for each pipeline stage:

```typescript
import { jq, JqLexError, JqParseError, JqRuntimeError } from "jq-js";

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
