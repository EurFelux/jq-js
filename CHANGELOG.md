# Changelog

## 0.3.0 (2026-04-10)

Major edge-case and compatibility release — official test suite passing rate: **531/555 (95.7%)**.

### Features

- **New builtins**: `toboolean`, `skip/2`, `pick/1`, `trim`, `ltrim`, `rtrim`, `trimstr/1`, `fabs`, `isempty/1`, `strflocaltime/1`, `modulemeta` (stub), `@urid` format (#36)
- **`values` type selector**: `values` now acts as a type selector (passes non-null, filters null) matching jq 1.7+ behavior
- **Format strings**: `@base64`, `@base64d`, `@html`, `@csv`, `@tsv`, `@json`, `@uri`, `@text`, `@sh` with string interpolation support (#5)
- **bsearch**: Binary search on sorted arrays (#36)
- **transpose**: Matrix transpose with null padding (#36)
- **INDEX**: Create objects keyed by expression (`INDEX(expr)` and `INDEX(stream; expr)`) (#36)
- **IN**: Membership test (`IN(stream)` and `IN(s; stream)`) (#36)
- **env / $ENV**: Access environment variables (#36)
- **$__loc__**: Source location special variable (#36)
- **Date/time builtins**: `now`, `gmtime`, `mktime`, `strftime`, `strptime`, `todate`/`date`, `fromdate`, `dateadd`, `datesub` (#35)
- **Try-alternative operator** (`?//`): catches errors and handles empty output, unlike `//` which only handles null/false (#38)
- **Pattern alternatives in `as` bindings**: `expr as pattern1 ?// pattern2 | body` tries each destructuring pattern in order
- **Module system**: parse `import "path" as name;` and `include "path";` statements (#37)
  - Adds `Import` and `Include` tokens, AST nodes, and parser support
  - Runtime throws a descriptive error (module loading not yet implemented)
- **`$ENV` and `env`**: access environment variables via `$ENV` object or `env` builtin

### Bug Fixes

- **Arithmetic evaluation order**: Binary operators now use right-outer evaluation order matching jq semantics (#32)
- **`splits("")`**: Empty regex split now correctly produces individual characters with boundary empty strings (#32)
- **Postfix bracket `useOriginalInput`**: `.foo[.baz]`, `[][.]`, and `expr[from:to]` now correctly evaluate index/slice expressions against the original input (#32)
- **`walk`**: When the walk function produces empty output (e.g., `select` filters), keys are omitted instead of set to null (#32)
- **`(.a as $x | .b) = "b"`**: Assignment through `as` bindings now works correctly (#32)
- **`def f($x;$y)`**: Support `$`-prefixed value parameters in function definitions (#32)
- **Object destructuring `{$b:[$c,$d]}`**: `$`-prefixed keys with sub-patterns now also bind the variable to the extracted value (#32)
- **`updatePathInner` func lookup**: Use arity-qualified key (`name/arity`) when looking up user-defined functions in path updates (#32)
- **`getpath(p) |= expr`**: `getpath` now works as a valid path expression in updates (#32)
- **Deep nesting**: `tojson` and `fromjson` now handle deeply nested structures (10000+ levels) without stack overflow (#32)
- **`fromjson` depth limit**: Reject JSON input exceeding 10000 nesting levels with "Exceeds depth limit for parsing" (#32)
- **`tojson` depth limit**: Emit `<skipped: too deep>` for structures exceeding 10000 levels (#32)
- **`flatten`**: Use iterative implementation to handle deeply nested arrays without stack overflow (#32)
- **Number formatting in errors**: Large numbers now display without scientific notation in error messages (#32)
- **rtrimstr**: Fix `rtrimstr("")` incorrectly emptying strings (#36)
- **ltrimstr/rtrimstr**: Error on non-string inputs matching jq behavior (#36)
- **Keywords as object keys**: Allow keyword tokens (`if`, `and`, `or`, `as`, `try`, `catch`, etc.) as object keys in both shorthand `{as}` and `key: value` forms (#32)
- **Keywords in destructuring**: Accept keyword tokens as keys in destructuring patterns (e.g., `. as {as: $kw} | $kw`) (#32)
- **String shorthand in objects**: Support `{"str"}` and `{"str\(expr)"}` shorthand syntax in object construction (#32)
- **`-reduce` / `-foreach`**: Parse unary minus before `reduce` and `foreach` expressions (#32)
- **Reduce/foreach expression parsing**: Use full expression parsing (not just postfix) for the source expression, allowing `reduce .[] / .[] as $i (...)` (#32)
- **`{$var: value}` key evaluation**: Use variable value (not variable name) as key when `$var` is followed by colon in object construction (#32)
- **`$__loc__`**: Return `"file":"<top-level>"` instead of `"<stdin>"` to match jq behavior (#32)
- **ascii_downcase/ascii_upcase**: Only affect ASCII letters (a-z, A-Z), not Unicode (#36)
- **flatten**: Negative depth now correctly throws an error (#36)

- **try/catch**: Preserve original error values through try/catch (not just strings) (#33)
- **try/catch**: Properly propagate errors per-element in generators via `generateValues` (#33)
- **try/catch**: Pass environment to catch clause compilation (#33)
- **try/catch**: Re-throw `BreakSignal` instead of catching it (#33)
- **optional**: `.foo?.bar?` now correctly propagates optional through chained access (#33)
- **optional**: `(.a, .a)?` correctly suppresses errors per-output (#33)
- **optional**: `.[1:3]?` now works on non-sliceable types (#33)
- **parser**: `try` body/catch now parsed at unary level, fixing `try -.? catch .` (#33)
- **parser**: `.a.[]` syntax (dot-bracket iterate) now parses correctly (#33)
- **parser**: Object values now support `//` alternative operator (#33)
- **null handling**: `.field`, `.[idx]`, `.[from:to]`, `.[]` on null now return null/empty instead of throwing (#33)
- **error messages**: Negate/field-access error messages now match jq format (#33)
- **sub/gsub**: String interpolation with named capture groups now works (`\(.name)`) (#34)
- **assignment**: Negative array index bounds checking (`Out of bounds negative array index`) (#33)
- **assignment**: Large array index detection (`Array index too large`) (#33)
- **assignment**: Auto-create objects/arrays from null on field/index assignment (#33)
- **tonumber**: Strict validation rejecting strings with leading/trailing whitespace (#33)
- **any/all**: Added 2-argument form `any(generator; condition)` / `all(generator; condition)` (#33)
- **top-level execution**: Use `generateValues` for streaming evaluation, matching jq's per-element error handling (#33)
- **Date/time array format**: Fixed broken-down time to match jq's `[year,month,mday,hour,min,sec,wday,yday]` format (#32)
- **Float indexing**: `.[1.5]` truncates to `.[1]`, `.[nan]` returns null (#32)
- **Label/break continuation**: `BreakSignal` now preserves accumulated results through pipe, comma, and foreach (#32)
- **`sort_by` multiple keys**: `sort_by(.a, .b)` now sorts by multiple keys (#32)
- **`group_by` sorting**: Groups are now sorted by key (#32)
- **`@html`/`@uri`**: Use standard entity names and RFC 3986 encoding (#32)
- **`implode` errors**: Match jq error message format for non-numeric codepoints (#32)
- **`match` output**: Named captures no longer leak to top-level match object (#32)
- **`fromjson` error column**: Column calculation matches jq for single-quoted strings (#32)
- **Test generator**: Handle `nan`/`Infinity` in JSON, `#` comments, `%%FAIL` variants, BOM (#32)

### Infrastructure

- **Minification**: Post-build minification via `@swc/core` (ESM 155KB→85KB, CJS 155KB→95KB)
- **Submodule**: `ref-jq` is now a git submodule for reproducible test generation
- **Package renamed**: `jq-js` → `@eurfelux/jq-js` for npm publishing

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
