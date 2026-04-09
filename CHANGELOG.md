# Changelog

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
