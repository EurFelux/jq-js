import type { AstNode, ObjectEntry } from './ast.js';
import { JqParseError } from './errors.js';
import { type Token, TokenType } from './tokens.js';

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

  // pipe = comma ("|" comma)*
  private parsePipe(): AstNode {
    let left = this.parseComma();
    while (this.match(TokenType.Pipe)) {
      const right = this.parseComma();
      left = { kind: 'pipe', left, right, pos: left.pos };
    }
    return left;
  }

  // comma = alternative ("," alternative)*
  private parseComma(): AstNode {
    let left = this.parseAlternative();
    while (this.match(TokenType.Comma)) {
      const right = this.parseAlternative();
      left = { kind: 'comma', left, right, pos: left.pos };
    }
    return left;
  }

  // alternative = logic ("//" logic)*
  private parseAlternative(): AstNode {
    let left = this.parseLogic();
    while (this.match(TokenType.Alternative)) {
      const right = this.parseLogic();
      left = { kind: 'alternative', left, right, pos: left.pos };
    }
    return left;
  }

  // logic = comparison (("and" | "or") comparison)*
  private parseLogic(): AstNode {
    let left = this.parseComparison();
    while (this.peek().type === TokenType.And || this.peek().type === TokenType.Or) {
      const op = this.advance().value as 'and' | 'or';
      const right = this.parseComparison();
      left = { kind: 'logic', op, left, right, pos: left.pos };
    }
    return left;
  }

  // comparison = addition (("==" | "!=" | "<" | ">" | "<=" | ">=") addition)?
  private parseComparison(): AstNode {
    let left = this.parseAddition();
    const t = this.peek().type;
    if (
      t === TokenType.Eq || t === TokenType.Neq ||
      t === TokenType.Lt || t === TokenType.Gt ||
      t === TokenType.Lte || t === TokenType.Gte
    ) {
      const op = this.advance().value as '==' | '!=' | '<' | '>' | '<=' | '>=';
      const right = this.parseAddition();
      left = { kind: 'compare', op, left, right, pos: left.pos };
    }
    return left;
  }

  // addition = multiplication (("+" | "-") multiplication)*
  private parseAddition(): AstNode {
    let left = this.parseMultiplication();
    while (this.peek().type === TokenType.Plus || this.peek().type === TokenType.Minus) {
      const op = this.advance().value as '+' | '-';
      const right = this.parseMultiplication();
      left = { kind: 'arith', op, left, right, pos: left.pos };
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
      const op = this.advance().value as '*' | '/' | '%';
      const right = this.parseUnary();
      left = { kind: 'arith', op, left, right, pos: left.pos };
    }
    return left;
  }

  // unary = "-" unary | postfix
  private parseUnary(): AstNode {
    if (this.peek().type === TokenType.Minus) {
      const token = this.advance();
      const expr = this.parseUnary();
      return { kind: 'negate', expr, pos: token.pos };
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
            kind: 'pipe',
            left,
            right: { kind: 'field', name: name.value, pos: name.pos },
            pos: left.pos,
          };
        } else {
          throw new JqParseError('Expected field name after "."', this.peek().pos);
        }
      } else if (this.peek().type === TokenType.LBracket) {
        left = this.parseBracketPostfix(left);
      } else if (this.peek().type === TokenType.Question) {
        const token = this.advance();
        left = { kind: 'optional', expr: left, pos: token.pos };
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
      return { kind: 'pipe', left, right: { kind: 'iterate', pos: bracketPos }, pos: left.pos };
    }

    // Check for slice: [from:to]
    if (this.peek().type === TokenType.Colon) {
      this.advance();
      const to = this.peek().type === TokenType.RBracket ? null : this.parsePipe();
      this.expect(TokenType.RBracket);
      return {
        kind: 'pipe',
        left,
        right: { kind: 'slice', from: null, to, pos: bracketPos },
        pos: left.pos,
      };
    }

    const indexExpr = this.parsePipe();

    // Check if it's a slice [from:to]
    if (this.match(TokenType.Colon)) {
      const to = this.peek().type === TokenType.RBracket ? null : this.parsePipe();
      this.expect(TokenType.RBracket);
      return {
        kind: 'pipe',
        left,
        right: { kind: 'slice', from: indexExpr, to, pos: bracketPos },
        pos: left.pos,
      };
    }

    this.expect(TokenType.RBracket);
    return {
      kind: 'pipe',
      left,
      right: { kind: 'index', index: indexExpr, pos: bracketPos },
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
          return { kind: 'field', name: name.value, pos: token.pos };
        }
        // Check for .[
        if (this.peek().type === TokenType.LBracket) {
          const identity: AstNode = { kind: 'identity', pos: token.pos };
          return this.parseBracketPostfix(identity);
        }
        return { kind: 'identity', pos: token.pos };
      }

      case TokenType.Recurse:
        this.advance();
        return { kind: 'recurse', pos: token.pos };

      case TokenType.Number:
        this.advance();
        return { kind: 'literal', value: Number(token.value), pos: token.pos };

      case TokenType.String:
        this.advance();
        return this.parseStringValue(token);

      case TokenType.True:
        this.advance();
        return { kind: 'literal', value: true, pos: token.pos };

      case TokenType.False:
        this.advance();
        return { kind: 'literal', value: false, pos: token.pos };

      case TokenType.Null:
        this.advance();
        return { kind: 'literal', value: null, pos: token.pos };

      case TokenType.Not: {
        this.advance();
        return { kind: 'not', expr: { kind: 'identity', pos: token.pos }, pos: token.pos };
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
          return { kind: 'array', expr: null, pos: token.pos };
        }
        const expr = this.parsePipe();
        this.expect(TokenType.RBracket);
        return { kind: 'array', expr, pos: token.pos };
      }

      case TokenType.LBrace:
        return this.parseObject();

      case TokenType.If:
        return this.parseCondition();

      case TokenType.Try:
        return this.parseTry();

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
    if (token.value.includes('\\(')) {
      const parts: (string | AstNode)[] = [];
      let current = '';
      let j = 0;
      const val = token.value;

      while (j < val.length) {
        if (val[j] === '\\' && val[j + 1] === '(') {
          if (current) {
            parts.push(current);
            current = '';
          }
          j += 2; // skip \(
          let depth = 1;
          let interpExpr = '';
          while (j < val.length && depth > 0) {
            if (val[j] === '(') depth++;
            else if (val[j] === ')') {
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
      return { kind: 'string_interpolation', parts, pos: token.pos };
    }

    return { kind: 'literal', value: token.value, pos: token.pos };
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
    return { kind: 'object', entries, pos: token.pos };
  }

  private parseObjectEntry(): ObjectEntry {
    // {name} shorthand — equivalent to {name: .name}
    if (this.peek().type === TokenType.Ident && this.tokens[this.pos + 1]?.type !== TokenType.Colon) {
      const name = this.advance();
      return {
        key: { kind: 'literal', value: name.value, pos: name.pos },
        value: null,
      };
    }

    // key: value
    let key: AstNode;
    if (this.peek().type === TokenType.Ident) {
      const name = this.advance();
      key = { kind: 'literal', value: name.value, pos: name.pos };
    } else if (this.peek().type === TokenType.String) {
      const str = this.advance();
      key = this.parseStringValue(str);
    } else if (this.peek().type === TokenType.LParen) {
      this.advance();
      key = this.parsePipe();
      this.expect(TokenType.RParen);
    } else {
      throw new JqParseError('Expected object key', this.peek().pos);
    }

    this.expect(TokenType.Colon);
    const value = this.parseLogic();
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
    return { kind: 'condition', condition, then, elifs, else_, pos: token.pos };
  }

  private parseTry(): AstNode {
    const token = this.expect(TokenType.Try);
    const expr = this.parsePostfix();
    let catch_: AstNode | null = null;
    if (this.match(TokenType.Catch)) {
      catch_ = this.parsePostfix();
    }
    return { kind: 'try', expr, catch_, pos: token.pos };
  }

  private parseFuncOrIdent(): AstNode {
    const name = this.expect(TokenType.Ident);

    // not is a special postfix operator in jq
    if (name.value === 'not') {
      return { kind: 'not', expr: { kind: 'identity', pos: name.pos }, pos: name.pos };
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
      return { kind: 'func', name: name.value, args, pos: name.pos };
    }

    // Zero-arg function call (like length, keys, etc.)
    return { kind: 'func', name: name.value, args: [], pos: name.pos };
  }
}

// Re-import lex here to support string interpolation parsing
import { lex } from './lexer.js';

export function parse(tokens: Token[]): AstNode {
  return new Parser(tokens).parse();
}
