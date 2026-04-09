export class JqLexError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(`Lex error at position ${pos}: ${message}`);
    this.name = "JqLexError";
  }
}

export class JqParseError extends Error {
  constructor(
    message: string,
    public pos: number,
  ) {
    super(`Parse error at position ${pos}: ${message}`);
    this.name = "JqParseError";
  }
}

export class JqRuntimeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JqRuntimeError";
  }
}
