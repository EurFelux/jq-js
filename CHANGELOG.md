# Changelog

## 0.2.0 (2026-04-09)

Major feature release — official test suite passing rate: **384/656 (58.5%)**.

### Features

- **Variable binding**: `expr as $x | body`, array/object destructuring (`as [$a, $b]`, `as {k: $v}`)
- **User-defined functions**: `def name(args): body;` with filter arguments and recursion
- **Reduce/Foreach**: `reduce .[] as $x (init; update)`, `foreach .[] as $x (init; update; extract)`
- **Label-break**: `label $out | ... break $out`
- **Alternative operator**: `//` (null/false fallback)
- **Update operators**: `|=`, `+=`, `-=`, `*=`, `/=`, `%=`, `//=`, `=` (path-based update)
- **Regex builtins**: `match`, `capture`, `scan`, `sub`, `gsub`, `splits`
- **Math builtins**: `floor`, `ceil`, `round`, `sqrt`, `pow`, `log`, `exp`, trig functions, `nan`, `infinite`
- **Path operations**: `getpath`, `setpath`, `delpaths`, `path`, `leaf_paths`
- **New builtins**: `tojson`/`fromjson`, `explode`/`implode`, `startswith`/`endswith`, `inside`, `index`/`rindex`/`indices`, `utf8bytelength`, `walk`, `recurse(f)`, `until`/`while`/`repeat`, `abs`, `builtins`
- **Parser**: `."foo"` quoted field access, `{$var}` shorthand in object construction
- **Arithmetic**: array subtraction (`-`), object deep merge (`*`), `add(f)` with filter argument

### Infrastructure

- GitHub Actions CI (lint, typecheck, test on Node 20/22, build)
- `oxlint` for linting, `oxfmt` for formatting
- `prek` pre-commit hooks
- 509 official jq tests + 47 regex tests ported from upstream
- README with comparison table and API reference

### Breaking Changes

- Minimum Node version raised from 18 to 20 (vitest/rolldown dependency)
- Removed `picocolors` dependency — now zero runtime dependencies

## 0.1.0 (2026-04-09)

Initial release — a pure TypeScript implementation of jq with full ESM support.

### Features

- **Three-stage pipeline**: Lexer → Parser → Tree-walking Interpreter
- **Dual module format**: ESM (`.mjs`) + CJS (`.cjs`) with TypeScript declarations
- **Core jq syntax**:
  - Identity (`.`), field access (`.foo`), array index (`.[0]`), array slice (`.[1:3]`)
  - Array/object iteration (`.[]`)
  - Pipe (`|`) and comma (`,`) for composition and multiple outputs
  - Arithmetic (`+`, `-`, `*`, `/`, `%`) with string/array/object overloads
  - Comparison (`==`, `!=`, `<`, `>`, `<=`, `>=`)
  - Boolean logic (`and`, `or`, `not`)
  - Conditionals (`if-then-elif-else-end`)
  - Array construction (`[expr]`) and object construction (`{key: expr}`)
  - String interpolation (`"Hello \(.name)"`)
  - Recursive descent (`..`)
  - Try-catch (`try expr catch handler`) and optional operator (`?`)
  - Negation (`-expr`)
- **40+ built-in functions**:
  - Type: `type`, `length`, `keys`, `values`, `has`, `contains`
  - Transform: `map`, `select`, `empty`, `add`, `flatten`, `range`, `reverse`
  - Sort/Group: `sort`, `sort_by`, `group_by`, `unique`, `unique_by`, `min`, `max`, `min_by`, `max_by`
  - String: `tostring`, `tonumber`, `ascii_downcase`, `ascii_upcase`, `ltrimstr`, `rtrimstr`, `split`, `join`, `test`
  - Object: `to_entries`, `from_entries`, `with_entries`, `map_values`, `keys_unsorted`
  - Type filters: `arrays`, `objects`, `numbers`, `strings`, `booleans`, `nulls`, `scalars`, `iterables`
  - Control: `first`, `last`, `limit`, `nth`, `any`, `all`
  - Debug: `debug`, `error`
- **Colored debug output** via `picocolors`
- **Custom error types**: `JqLexError`, `JqParseError`, `JqRuntimeError`
