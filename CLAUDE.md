# jq-js

A pure TypeScript implementation of jq with zero runtime dependencies.

## Development

```bash
pnpm install
pnpm run build        # Build ESM + CJS via tsdown
pnpm run test         # Run e2e tests (CI)
pnpm run test:all     # Run all tests including official jq test suite
pnpm run typecheck    # tsc --noEmit
pnpm run lint         # oxlint
pnpm run fmt          # oxfmt --write
pnpm run fmt:check    # oxfmt --check
```

## Architecture

Three-stage pipeline: `Lexer → Parser → Interpreter`

- `src/lexer.ts` — Tokenizer
- `src/tokens.ts` — Token type definitions
- `src/parser.ts` — Recursive descent parser
- `src/ast.ts` — AST node types (discriminated unions)
- `src/interpreter.ts` — Tree-walking interpreter with scoped environment
- `src/types.ts` — `JsonValue` type
- `src/errors.ts` — `JqLexError`, `JqParseError`, `JqRuntimeError`
- `src/index.ts` — Public API (`jq`, `lex`, `parse`, `compile`)

## Rules

- Every `feat:` or `fix:` PR **must** update `CHANGELOG.md` under an `## Unreleased` section.
- Use `pnpx` instead of `npx` or `bunx`.
- Zero runtime dependencies — do not add any.
- Tests: `tests/e2e.test.ts` for curated tests, `tests/official/` for ported jq upstream tests.
- Pre-commit hooks via `prek` — run `prek install` after clone.
