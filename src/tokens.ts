export enum TokenType {
  // Literals
  Number,
  String,

  // Punctuation
  Dot,
  Pipe,
  LBracket,
  RBracket,
  LParen,
  RParen,
  Comma,
  Colon,
  LBrace,
  RBrace,
  Question,
  Semicolon,

  // Operators
  Plus,
  Minus,
  Multiply,
  Divide,
  Modulo,
  Eq,
  Neq,
  Lt,
  Gt,
  Lte,
  Gte,

  // Keywords
  And,
  Or,
  Not,
  If,
  Then,
  Elif,
  Else,
  End,
  True,
  False,
  Null,
  Try,
  Catch,

  // Special
  Recurse,
  Ident,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}
