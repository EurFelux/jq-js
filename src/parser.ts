import type { AstNode, BindingPattern, ObjectEntry } from "./ast.js";
import { JqParseError } from "./errors.js";
import { type Token, TokenType } from "./tokens.js";

class Parser {
  private pos = 0;

  constructor(private tokens: Token[]) {}

  parse(): AstNode {
    const node = this.parsePipe();
    this.expect(TokenType.EOF);
    return node;
  }

  private peek(): Token {
    return this.tokens[this.pos]!;
  }

  private advance(): Token {
    const token = this.tokens[this.pos]!;
    this.pos++;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.peek();
    if (token.type !== type) {
      throw new JqParseError(
        `Expected ${TokenType[type]}, got ${TokenType[token.type]} (${JSON.stringify(token.value)})`,
        token.pos,
      );
    }
    return this.advance();
  }

  private match(type: TokenType): Token | null {
    if (this.peek().type === type) return this.advance();
    return null;
  }

  // pipe = comma ("as" pattern "|" pipe | "|" comma)*
  private parsePipe(): AstNode {
    let left = this.parseComma();
    while (true) {
      if (this.match(TokenType.As)) {
        const pattern = this.parsePattern();
        this.expect(TokenType.Pipe);
        const body = this.parsePipe();
        left = { kind: "as", expr: left, pattern, body, pos: left.pos };
      } else if (this.match(TokenType.Pipe)) {
        const right = this.parseComma();
        left = { kind: "pipe", left, right, pos: left.pos };
      } else if (this.isUpdateOp()) {
        const op = this.advance().value as "|=" | "+=" | "-=" | "*=" | "/=" | "%=" | "//=";
        const body = this.parseComma();
        left = { kind: "update", path: left, op, body, pos: left.pos };
      } else if (this.peek().type === TokenType.Assign) {
        this.advance();
        const value = this.parseComma();
        left = { kind: "assign", path: left, value, pos: left.pos };
      } else {
        break;
      }
    }
    return left;
  }

  private isUpdateOp(): boolean {
    const t = this.peek().type;
    return (
      t === TokenType.UpdatePipe ||
      t === TokenType.PlusAssign ||
      t === TokenType.MinusAssign ||
      t === TokenType.MultiplyAssign ||
      t === TokenType.DivideAssign ||
      t === TokenType.ModuloAssign ||
      t === TokenType.AltAssign
    );
  }

  private parsePattern(): BindingPattern {
    if (this.peek().type === TokenType.Variable) {
      const token = this.advance();
      return { type: "variable", name: token.value };
    }
    if (this.peek().type === TokenType.LBracket) {
      this.advance();
      const elements: BindingPattern[] = [];
      if (this.peek().type !== TokenType.RBracket) {
        elements.push(this.parsePattern());
        while (this.match(TokenType.Comma)) {
          elements.push(this.parsePattern());
        }
      }
      this.expect(TokenType.RBracket);
      return { type: "array", elements };
    }
    if (this.peek().type === TokenType.LBrace) {
      this.advance();
      const entries: { key: AstNode; pattern: BindingPattern }[] = [];
      if (this.peek().type !== TokenType.RBrace) {
        entries.push(this.parsePatternObjectEntry());
        while (this.match(TokenType.Comma)) {
          entries.push(this.parsePatternObjectEntry());
        }
      }
      this.expect(TokenType.RBrace);
      return { type: "object", entries };
    }
    throw new JqParseError("Expected binding pattern ($var, [...], or {...})", this.peek().pos);
  }

  private parsePatternObjectEntry(): { key: AstNode; pattern: BindingPattern } {
    // {$var} shorthand — key is var name without $
    if (this.peek().type === TokenType.Variable) {
      const varToken = this.peek();
      // Check if next is colon (key: $pattern) or comma/rbrace (shorthand)
      if (this.tokens[this.pos + 1]?.type === TokenType.Colon) {
        // name: $var — but this is {name: $var}
        // Actually jq doesn't do this with $var as key, it's {key: $var}
      }
      const pattern = this.parsePattern();
      return {
        key: { kind: "literal", value: varToken.value.slice(1), pos: varToken.pos },
        pattern,
      };
    }
    // key: $pattern
    let key: AstNode;
    if (this.peek().type === TokenType.Ident) {
      const name = this.advance();
      key = { kind: "literal", value: name.value, pos: name.pos };
    } else if (this.peek().type === TokenType.String) {
      const str = this.advance();
      key = { kind: "literal", value: str.value, pos: str.pos };
    } else if (this.peek().type === TokenType.LParen) {
      this.advance();
      key = this.parsePipe();
      this.expect(TokenType.RParen);
    } else {
      throw new JqParseError("Expected object pattern key", this.peek().pos);
    }
    this.expect(TokenType.Colon);
    const pattern = this.parsePattern();
    return { key, pattern };
  }

  // comma = alternative ("," alternative)*
  private parseComma(): AstNode {
    let left = this.parseAlternative();
    while (this.match(TokenType.Comma)) {
      const right = this.parseAlternative();
      left = { kind: "comma", left, right, pos: left.pos };
    }
    return left;
  }

  // alternative = logic ("//" logic)*
  private parseAlternative(): AstNode {
    let left = this.parseLogic();
    while (this.match(TokenType.Alternative)) {
      const right = this.parseLogic();
      left = { kind: "alternative", left, right, pos: left.pos };
    }
    return left;
  }

  // logic = comparison (("and" | "or") comparison)*
  private parseLogic(): AstNode {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.And || this.peek().type === TokenType.Or) {
      const op = this.advance().value as "and" | "or";
      const right = this.parseComparison();
      left = { kind: "logic", op, left, right, pos: left.pos };
    }
    return left;
  }

  // comparison = addition (("==" | "!=" | "<" | ">" | "<=" | ">=") addition)?
  private parseComparison(): AstNode {
    let left = this.parseAddition();
    const t = this.peek().type;
    if (
      t === TokenType.Eq ||
      t === TokenType.Neq ||
      t === TokenType.Lt ||
      t === TokenType.Gt ||
      t === TokenType.Lte ||
      t === TokenType.Gte
    ) {
      const op = this.advance().value as "==" | "!=" | "<" | ">" | "<=" | ">=";
      const right = this.parseAddition();
      left = { kind: "compare", op, left, right, pos: left.pos };
    }
    return left;
  }

  // addition = multiplication (("+" | "-") multiplication)*
  private parseAddition(): AstNode {
    let left = this.parseMultiplication();
    while (this.peek().type === TokenType.Plus || this.peek().type === TokenType.Minus) {
      const op = this.advance().value as "+" | "-";
      const right = this.parseMultiplication();
      left = { kind: "arith", op, left, right, pos: left.pos };
    }
    return left;
  }

  // multiplication = unary (("*" | "/" | "%") unary)*
  private parseMultiplication(): AstNode {
    let left = this.parseUnary();
    while (
      this.peek().type === TokenType.Multiply ||
      this.peek().type === TokenType.Divide ||
      this.peek().type === TokenType.Modulo
    ) {
      const op = this.advance().value as "*" | "/" | "%";
      const right = this.parseUnary();
      left = { kind: "arith", op, left, right, pos: left.pos };
    }
    return left;
  }

  // unary = "-" unary | postfix
  private parseUnary(): AstNode {
    if (this.peek().type === TokenType.Minus) {
      const token = this.advance();
      const expr = this.parseUnary();
      return { kind: "negate", expr, pos: token.pos };
    }
    return this.parsePostfix();
  }

  // postfix = primary ( "." IDENT | "[" ... "]" | "?" )*
  private parsePostfix(): AstNode {
    let left = this.parsePrimary();

    for (;;) {
      if (this.peek().type === TokenType.Dot) {
        // Check it's not ".." (Recurse)
        if (this.tokens[this.pos + 1]?.type === TokenType.Dot) break;
        this.advance(); // consume "."
        if (this.peek().type === TokenType.Ident) {
          const name = this.advance();
          left = {
            kind: "pipe",
            left,
            right: { kind: "field", name: name.value, pos: name.pos },
            pos: left.pos,
          };
        } else if (this.peek().type === TokenType.String) {
          const str = this.advance();
          left = {
            kind: "pipe",
            left,
            right: { kind: "field", name: str.value, pos: str.pos },
            pos: left.pos,
          };
        } else if (this.peek().type === TokenType.LBracket) {
          // .foo.[...] — bracket access after dot
          left = this.parseBracketPostfix(left);
        } else {
          throw new JqParseError('Expected field name after "."', this.peek().pos);
        }
      } else if (this.peek().type === TokenType.LBracket) {
        left = this.parseBracketPostfix(left);
      } else if (this.peek().type === TokenType.Question) {
        const token = this.advance();
        left = { kind: "optional", expr: left, pos: token.pos };
      } else {
        break;
      }
    }

    return left;
  }

  private parseBracketPostfix(left: AstNode): AstNode {
    const bracketPos = this.advance().pos; // consume "["

    // .[] — iterate
    if (this.peek().type === TokenType.RBracket) {
      this.advance();
      return { kind: "pipe", left, right: { kind: "iterate", pos: bracketPos }, pos: left.pos };
    }

    // Check for slice: [from:to]
    if (this.peek().type === TokenType.Colon) {
      this.advance();
      const to = this.peek().type === TokenType.RBracket ? null : this.parsePipe();
      this.expect(TokenType.RBracket);
      return {
        kind: "pipe",
        left,
        right: { kind: "slice", from: null, to, pos: bracketPos },
        pos: left.pos,
      };
    }

    const indexExpr = this.parsePipe();

    // Check if it's a slice [from:to]
    if (this.match(TokenType.Colon)) {
      const to = this.peek().type === TokenType.RBracket ? null : this.parsePipe();
      this.expect(TokenType.RBracket);
      return {
        kind: "pipe",
        left,
        right: { kind: "slice", from: indexExpr, to, pos: bracketPos },
        pos: left.pos,
      };
    }

    this.expect(TokenType.RBracket);
    return {
      kind: "pipe",
      left,
      right: { kind: "index", index: indexExpr, pos: bracketPos },
      pos: left.pos,
    };
  }

  private parsePrimary(): AstNode {
    const token = this.peek();

    switch (token.type) {
      case TokenType.Dot: {
        this.advance();
        // Check for field access: .foo
        if (this.peek().type === TokenType.Ident) {
          const name = this.advance();
          return { kind: "field", name: name.value, pos: token.pos };
        }
        // Check for ."foo" (quoted field access)
        if (this.peek().type === TokenType.String) {
          const str = this.advance();
          return { kind: "field", name: str.value, pos: token.pos };
        }
        // Check for .[
        if (this.peek().type === TokenType.LBracket) {
          const identity: AstNode = { kind: "identity", pos: token.pos };
          return this.parseBracketPostfix(identity);
        }
        return { kind: "identity", pos: token.pos };
      }

      case TokenType.Recurse:
        this.advance();
        return { kind: "recurse", pos: token.pos };

      case TokenType.Number:
        this.advance();
        return { kind: "literal", value: Number(token.value), pos: token.pos };

      case TokenType.String:
        this.advance();
        return this.parseStringValue(token);

      case TokenType.True:
        this.advance();
        return { kind: "literal", value: true, pos: token.pos };

      case TokenType.False:
        this.advance();
        return { kind: "literal", value: false, pos: token.pos };

      case TokenType.Null:
        this.advance();
        return { kind: "literal", value: null, pos: token.pos };

      case TokenType.Not: {
        this.advance();
        return { kind: "not", expr: { kind: "identity", pos: token.pos }, pos: token.pos };
      }

      case TokenType.LParen: {
        this.advance();
        const expr = this.parsePipe();
        this.expect(TokenType.RParen);
        return expr;
      }

      case TokenType.LBracket: {
        this.advance();
        if (this.peek().type === TokenType.RBracket) {
          this.advance();
          return { kind: "array", expr: null, pos: token.pos };
        }
        const expr = this.parsePipe();
        this.expect(TokenType.RBracket);
        return { kind: "array", expr, pos: token.pos };
      }

      case TokenType.LBrace:
        return this.parseObject();

      case TokenType.If:
        return this.parseCondition();

      case TokenType.Try:
        return this.parseTry();

      case TokenType.Variable:
        this.advance();
        return { kind: "var_ref", name: token.value, pos: token.pos };

      case TokenType.Reduce:
        return this.parseReduce();

      case TokenType.Foreach:
        return this.parseForeach();

      case TokenType.Label:
        return this.parseLabel();

      case TokenType.Break: {
        this.advance();
        const name = this.expect(TokenType.Variable);
        return { kind: "break", name: name.value, pos: token.pos };
      }

      case TokenType.Def:
        return this.parseDef();

      case TokenType.Ident:
        return this.parseFuncOrIdent();

      default:
        throw new JqParseError(
          `Unexpected token: ${TokenType[token.type]} (${JSON.stringify(token.value)})`,
          token.pos,
        );
    }
  }

  private parseStringValue(token: Token): AstNode {
    // Check for string interpolation \(...)
    if (token.value.includes("\\(")) {
      const parts: (string | AstNode)[] = [];
      let current = "";
      let j = 0;
      const val = token.value;

      while (j < val.length) {
        if (val[j] === "\\" && val[j + 1] === "(") {
          if (current) {
            parts.push(current);
            current = "";
          }
          j += 2; // skip \(
          let depth = 1;
          let interpExpr = "";
          while (j < val.length && depth > 0) {
            if (val[j] === "(") depth++;
            else if (val[j] === ")") {
              depth--;
              if (depth === 0) break;
            }
            interpExpr += val[j];
            j++;
          }
          j++; // skip closing )
          const interpTokens = lex(interpExpr);
          const interpParser = new Parser(interpTokens);
          parts.push(interpParser.parse());
        } else {
          current += val[j];
          j++;
        }
      }
      if (current) parts.push(current);
      return { kind: "string_interpolation", parts, pos: token.pos };
    }

    return { kind: "literal", value: token.value, pos: token.pos };
  }

  private parseObject(): AstNode {
    const token = this.expect(TokenType.LBrace);
    const entries: ObjectEntry[] = [];

    if (this.peek().type !== TokenType.RBrace) {
      entries.push(this.parseObjectEntry());
      while (this.match(TokenType.Comma)) {
        entries.push(this.parseObjectEntry());
      }
    }

    this.expect(TokenType.RBrace);
    return { kind: "object", entries, pos: token.pos };
  }

  private parseObjectEntry(): ObjectEntry {
    // {name} shorthand — equivalent to {name: .name}
    if (
      this.peek().type === TokenType.Ident &&
      this.tokens[this.pos + 1]?.type !== TokenType.Colon
    ) {
      const name = this.advance();
      return {
        key: { kind: "literal", value: name.value, pos: name.pos },
        value: null,
      };
    }

    // {$var} shorthand — equivalent to {(var_name): $var}
    if (
      this.peek().type === TokenType.Variable &&
      this.tokens[this.pos + 1]?.type !== TokenType.Colon
    ) {
      const varToken = this.advance();
      return {
        key: { kind: "literal", value: varToken.value.slice(1), pos: varToken.pos },
        value: { kind: "var_ref", name: varToken.value, pos: varToken.pos },
      };
    }

    // key: value
    let key: AstNode;
    if (this.peek().type === TokenType.Ident) {
      const name = this.advance();
      key = { kind: "literal", value: name.value, pos: name.pos };
    } else if (this.peek().type === TokenType.String) {
      const str = this.advance();
      key = this.parseStringValue(str);
    } else if (this.peek().type === TokenType.LParen) {
      this.advance();
      key = this.parsePipe();
      this.expect(TokenType.RParen);
    } else if (this.peek().type === TokenType.Variable) {
      const varToken = this.advance();
      key = { kind: "literal", value: varToken.value.slice(1), pos: varToken.pos };
    } else {
      throw new JqParseError("Expected object key", this.peek().pos);
    }

    this.expect(TokenType.Colon);
    const value = this.parseAlternative();
    return { key, value };
  }

  private parseCondition(): AstNode {
    const token = this.expect(TokenType.If);
    const condition = this.parsePipe();
    this.expect(TokenType.Then);
    const then = this.parsePipe();

    const elifs: { condition: AstNode; then: AstNode }[] = [];
    while (this.match(TokenType.Elif)) {
      const elifCond = this.parsePipe();
      this.expect(TokenType.Then);
      const elifThen = this.parsePipe();
      elifs.push({ condition: elifCond, then: elifThen });
    }

    let else_: AstNode | null = null;
    if (this.match(TokenType.Else)) {
      else_ = this.parsePipe();
    }

    this.expect(TokenType.End);
    return { kind: "condition", condition, then, elifs, else_, pos: token.pos };
  }

  private parseTry(): AstNode {
    const token = this.expect(TokenType.Try);
    const expr = this.parseUnary();
    let catch_: AstNode | null = null;
    if (this.match(TokenType.Catch)) {
      catch_ = this.parseUnary();
    }
    return { kind: "try", expr, catch_, pos: token.pos };
  }

  private parseFuncOrIdent(): AstNode {
    const name = this.expect(TokenType.Ident);

    // not is a special postfix operator in jq
    if (name.value === "not") {
      return { kind: "not", expr: { kind: "identity", pos: name.pos }, pos: name.pos };
    }

    // Check for function call: name(args)
    if (this.peek().type === TokenType.LParen) {
      this.advance();
      const args: AstNode[] = [];
      if (this.peek().type !== TokenType.RParen) {
        args.push(this.parsePipe());
        while (this.match(TokenType.Semicolon)) {
          args.push(this.parsePipe());
        }
      }
      this.expect(TokenType.RParen);
      return { kind: "func", name: name.value, args, pos: name.pos };
    }

    // Zero-arg function call (like length, keys, etc.)
    return { kind: "func", name: name.value, args: [], pos: name.pos };
  }

  // reduce EXPR as $VAR (INIT; UPDATE)
  private parseReduce(): AstNode {
    const token = this.expect(TokenType.Reduce);
    const expr = this.parsePostfix();
    this.expect(TokenType.As);
    const pattern = this.parsePattern();
    this.expect(TokenType.LParen);
    const init = this.parsePipe();
    this.expect(TokenType.Semicolon);
    const update = this.parsePipe();
    this.expect(TokenType.RParen);
    return { kind: "reduce", expr, pattern, init, update, pos: token.pos };
  }

  // foreach EXPR as $VAR (INIT; UPDATE; EXTRACT?)
  private parseForeach(): AstNode {
    const token = this.expect(TokenType.Foreach);
    const expr = this.parsePostfix();
    this.expect(TokenType.As);
    const pattern = this.parsePattern();
    this.expect(TokenType.LParen);
    const init = this.parsePipe();
    this.expect(TokenType.Semicolon);
    const update = this.parsePipe();
    let extract: AstNode | null = null;
    if (this.match(TokenType.Semicolon)) {
      extract = this.parsePipe();
    }
    this.expect(TokenType.RParen);
    return { kind: "foreach", expr, pattern, init, update, extract, pos: token.pos };
  }

  // label $NAME | BODY
  private parseLabel(): AstNode {
    const token = this.expect(TokenType.Label);
    const name = this.expect(TokenType.Variable);
    this.expect(TokenType.Pipe);
    const body = this.parsePipe();
    return { kind: "label", name: name.value, body, pos: token.pos };
  }

  // def NAME(PARAMS): BODY; REST
  private parseDef(): AstNode {
    const token = this.expect(TokenType.Def);
    const name = this.expect(TokenType.Ident);
    const params: string[] = [];

    if (this.match(TokenType.LParen)) {
      if (this.peek().type !== TokenType.RParen) {
        params.push(this.expect(TokenType.Ident).value);
        while (this.match(TokenType.Semicolon)) {
          params.push(this.expect(TokenType.Ident).value);
        }
      }
      this.expect(TokenType.RParen);
    }

    this.expect(TokenType.Colon);
    const body = this.parsePipe();
    this.expect(TokenType.Semicolon);
    const next = this.parsePipe();
    return { kind: "def", name: name.value, params, body, next, pos: token.pos };
  }
}

// Re-import lex here to support string interpolation parsing
import { lex } from "./lexer.js";

export function parse(tokens: Token[]): AstNode {
  return new Parser(tokens).parse();
}
