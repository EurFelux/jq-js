import { compile } from "./interpreter.js";
import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import type { JsonValue } from "./types.js";

export function jq(filter: string, input: JsonValue): JsonValue[] {
  const tokens = lex(filter);
  const ast = parse(tokens);
  const fn = compile(ast);
  return fn(input);
}

export { compile } from "./interpreter.js";
export { lex } from "./lexer.js";
export { parse } from "./parser.js";
export type { AstNode } from "./ast.js";
export type { Token, TokenType } from "./tokens.js";
export type { JsonValue } from "./types.js";
export { JqLexError, JqParseError, JqRuntimeError } from "./errors.js";
