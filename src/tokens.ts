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

  // Alternative
  Alternative,
  TryAlternative,

  // Assignment/Update operators
  Assign,
  UpdatePipe,
  PlusAssign,
  MinusAssign,
  MultiplyAssign,
  DivideAssign,
  ModuloAssign,
  AltAssign,

  // Keywords (additional)
  As,
  Def,
  Reduce,
  Foreach,
  Label,
  Break,
  Import,
  Include,

  // Format
  Format,

  // Special
  Recurse,
  Ident,
  Variable,
  EOF,
}

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}
