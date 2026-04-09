import { JqLexError } from "./errors.js";
import { type Token, TokenType } from "./tokens.js";

const KEYWORDS: Record<string, TokenType> = {
  and: TokenType.And,
  or: TokenType.Or,
  not: TokenType.Not,
  if: TokenType.If,
  then: TokenType.Then,
  elif: TokenType.Elif,
  else: TokenType.Else,
  end: TokenType.End,
  true: TokenType.True,
  false: TokenType.False,
  null: TokenType.Null,
  try: TokenType.Try,
  catch: TokenType.Catch,
  as: TokenType.As,
  def: TokenType.Def,
  reduce: TokenType.Reduce,
  foreach: TokenType.Foreach,
  label: TokenType.Label,
  break: TokenType.Break,
  import: TokenType.Import,
  include: TokenType.Include,
};

export function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    const ch = input[i]!;

    // Whitespace
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r") {
      i++;
      continue;
    }

    // Comments
    if (ch === "#") {
      while (i < input.length && input[i] !== "\n") i++;
      continue;
    }

    // Numbers
    if (ch >= "0" && ch <= "9") {
      const start = i;
      while (i < input.length && input[i]! >= "0" && input[i]! <= "9") i++;
      if (i < input.length && input[i] === ".") {
        i++;
        while (i < input.length && input[i]! >= "0" && input[i]! <= "9") i++;
      }
      if (i < input.length && (input[i] === "e" || input[i] === "E")) {
        i++;
        if (i < input.length && (input[i] === "+" || input[i] === "-")) i++;
        while (i < input.length && input[i]! >= "0" && input[i]! <= "9") i++;
      }
      tokens.push({ type: TokenType.Number, value: input.slice(start, i), pos: start });
      continue;
    }

    // Strings
    if (ch === '"') {
      const start = i;
      i++; // skip opening quote
      let value = "";
      while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\") {
          i++;
          if (i >= input.length) throw new JqLexError("Unterminated string escape", i);
          const esc = input[i]!;
          switch (esc) {
            case '"':
              value += '"';
              break;
            case "\\":
              value += "\\";
              break;
            case "/":
              value += "/";
              break;
            case "b":
              value += "\b";
              break;
            case "f":
              value += "\f";
              break;
            case "n":
              value += "\n";
              break;
            case "r":
              value += "\r";
              break;
            case "t":
              value += "\t";
              break;
            case "(": {
              // String interpolation \(...) — emit what we have so far and the interpolation tokens
              // For now, store the raw form; the parser will handle interpolation
              value += "\\(";
              i++;
              let depth = 1;
              while (i < input.length && depth > 0) {
                if (input[i] === "(") depth++;
                else if (input[i] === ")") depth--;
                if (depth > 0) {
                  value += input[i];
                  i++;
                }
              }
              if (depth !== 0) throw new JqLexError("Unterminated string interpolation", start);
              value += ")";
              break;
            }
            case "u": {
              i++;
              const hex = input.slice(i, i + 4);
              if (hex.length < 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
                throw new JqLexError("Invalid unicode escape", i);
              }
              value += String.fromCharCode(parseInt(hex, 16));
              i += 3; // the loop will increment once more
              break;
            }
            default:
              throw new JqLexError(`Unknown escape character: \\${esc}`, i);
          }
        } else {
          value += input[i];
        }
        i++;
      }
      if (i >= input.length) throw new JqLexError("Unterminated string", start);
      i++; // skip closing quote
      tokens.push({ type: TokenType.String, value, pos: start });
      continue;
    }

    // Format strings (@name)
    if (ch === "@") {
      const start = i;
      i++; // skip @
      while (
        i < input.length &&
        ((input[i]! >= "a" && input[i]! <= "z") ||
          (input[i]! >= "A" && input[i]! <= "Z") ||
          (input[i]! >= "0" && input[i]! <= "9") ||
          input[i] === "_")
      ) {
        i++;
      }
      const name = input.slice(start + 1, i);
      if (!name) throw new JqLexError("Expected format name after @", start);
      tokens.push({ type: TokenType.Format, value: name, pos: start });
      continue;
    }

    // Variables ($name)
    if (ch === "$") {
      const start = i;
      i++; // skip $
      while (
        i < input.length &&
        ((input[i]! >= "a" && input[i]! <= "z") ||
          (input[i]! >= "A" && input[i]! <= "Z") ||
          (input[i]! >= "0" && input[i]! <= "9") ||
          input[i] === "_")
      ) {
        i++;
      }
      tokens.push({ type: TokenType.Variable, value: input.slice(start, i), pos: start });
      continue;
    }

    // Identifiers and keywords
    if ((ch >= "a" && ch <= "z") || (ch >= "A" && ch <= "Z") || ch === "_") {
      const start = i;
      while (
        i < input.length &&
        ((input[i]! >= "a" && input[i]! <= "z") ||
          (input[i]! >= "A" && input[i]! <= "Z") ||
          (input[i]! >= "0" && input[i]! <= "9") ||
          input[i] === "_")
      ) {
        i++;
      }
      const word = input.slice(start, i);
      const kwType = KEYWORDS[word];
      if (kwType !== undefined) {
        tokens.push({ type: kwType, value: word, pos: start });
      } else {
        tokens.push({ type: TokenType.Ident, value: word, pos: start });
      }
      continue;
    }

    // Three-character operators
    if (i + 2 < input.length) {
      const three = input.slice(i, i + 3);
      if (three === "?//") {
        tokens.push({ type: TokenType.TryAlternative, value: three, pos: i });
        i += 3;
        continue;
      }
      if (three === "//=") {
        tokens.push({ type: TokenType.AltAssign, value: three, pos: i });
        i += 3;
        continue;
      }
    }

    // Two-character operators
    if (i + 1 < input.length) {
      const two = input.slice(i, i + 2);
      switch (two) {
        case "==":
          tokens.push({ type: TokenType.Eq, value: two, pos: i });
          i += 2;
          continue;
        case "!=":
          tokens.push({ type: TokenType.Neq, value: two, pos: i });
          i += 2;
          continue;
        case "<=":
          tokens.push({ type: TokenType.Lte, value: two, pos: i });
          i += 2;
          continue;
        case ">=":
          tokens.push({ type: TokenType.Gte, value: two, pos: i });
          i += 2;
          continue;
        case "//":
          tokens.push({ type: TokenType.Alternative, value: two, pos: i });
          i += 2;
          continue;
        case "..":
          tokens.push({ type: TokenType.Recurse, value: two, pos: i });
          i += 2;
          continue;
        case "|=":
          tokens.push({ type: TokenType.UpdatePipe, value: two, pos: i });
          i += 2;
          continue;
        case "+=":
          tokens.push({ type: TokenType.PlusAssign, value: two, pos: i });
          i += 2;
          continue;
        case "-=":
          tokens.push({ type: TokenType.MinusAssign, value: two, pos: i });
          i += 2;
          continue;
        case "*=":
          tokens.push({ type: TokenType.MultiplyAssign, value: two, pos: i });
          i += 2;
          continue;
        case "/=":
          tokens.push({ type: TokenType.DivideAssign, value: two, pos: i });
          i += 2;
          continue;
        case "%=":
          tokens.push({ type: TokenType.ModuloAssign, value: two, pos: i });
          i += 2;
          continue;
      }
    }

    // Single-character tokens
    const pos = i;
    i++;
    switch (ch) {
      case ".":
        tokens.push({ type: TokenType.Dot, value: ch, pos });
        break;
      case "|":
        tokens.push({ type: TokenType.Pipe, value: ch, pos });
        break;
      case "[":
        tokens.push({ type: TokenType.LBracket, value: ch, pos });
        break;
      case "]":
        tokens.push({ type: TokenType.RBracket, value: ch, pos });
        break;
      case "(":
        tokens.push({ type: TokenType.LParen, value: ch, pos });
        break;
      case ")":
        tokens.push({ type: TokenType.RParen, value: ch, pos });
        break;
      case "{":
        tokens.push({ type: TokenType.LBrace, value: ch, pos });
        break;
      case "}":
        tokens.push({ type: TokenType.RBrace, value: ch, pos });
        break;
      case ",":
        tokens.push({ type: TokenType.Comma, value: ch, pos });
        break;
      case ":":
        tokens.push({ type: TokenType.Colon, value: ch, pos });
        break;
      case "?":
        tokens.push({ type: TokenType.Question, value: ch, pos });
        break;
      case ";":
        tokens.push({ type: TokenType.Semicolon, value: ch, pos });
        break;
      case "+":
        tokens.push({ type: TokenType.Plus, value: ch, pos });
        break;
      case "-":
        tokens.push({ type: TokenType.Minus, value: ch, pos });
        break;
      case "*":
        tokens.push({ type: TokenType.Multiply, value: ch, pos });
        break;
      case "/":
        tokens.push({ type: TokenType.Divide, value: ch, pos });
        break;
      case "%":
        tokens.push({ type: TokenType.Modulo, value: ch, pos });
        break;
      case "<":
        tokens.push({ type: TokenType.Lt, value: ch, pos });
        break;
      case ">":
        tokens.push({ type: TokenType.Gt, value: ch, pos });
        break;
      case "=":
        tokens.push({ type: TokenType.Assign, value: ch, pos });
        break;
      default:
        throw new JqLexError(`Unexpected character: ${ch}`, pos);
    }
  }

  tokens.push({ type: TokenType.EOF, value: "", pos: i });
  return tokens;
}
