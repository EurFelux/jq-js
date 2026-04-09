export type AstNode =
  | IdentityNode
  | FieldAccessNode
  | IndexNode
  | SliceNode
  | IterateNode
  | PipeNode
  | LiteralNode
  | ArrayConstructNode
  | ObjectConstructNode
  | ConditionNode
  | FuncCallNode
  | TryNode
  | ArithOpNode
  | CompareOpNode
  | LogicOpNode
  | NotNode
  | NegateNode
  | RecurseNode
  | CommaNode
  | OptionalNode
  | AlternativeNode
  | TryAlternativeNode
  | VarRefNode
  | AsNode
  | ReduceNode
  | ForeachNode
  | LabelNode
  | BreakNode
  | DefNode
  | UpdateNode
  | AssignNode
  | StringInterpolationNode
  | FormatNode
  | ImportNode
  | IncludeNode;

export interface IdentityNode {
  kind: "identity";
  pos: number;
}

export interface FieldAccessNode {
  kind: "field";
  name: string;
  pos: number;
}

export interface IndexNode {
  kind: "index";
  index: AstNode;
  pos: number;
}

export interface SliceNode {
  kind: "slice";
  from: AstNode | null;
  to: AstNode | null;
  pos: number;
}

export interface IterateNode {
  kind: "iterate";
  pos: number;
}

export interface PipeNode {
  kind: "pipe";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface LiteralNode {
  kind: "literal";
  value: string | number | boolean | null;
  pos: number;
}

export interface ArrayConstructNode {
  kind: "array";
  expr: AstNode | null;
  pos: number;
}

export interface ObjectConstructNode {
  kind: "object";
  entries: ObjectEntry[];
  pos: number;
}

export interface ObjectEntry {
  key: AstNode;
  value: AstNode | null; // null means {foo} shorthand for {foo: .foo}
}

export interface ConditionNode {
  kind: "condition";
  condition: AstNode;
  then: AstNode;
  elifs: { condition: AstNode; then: AstNode }[];
  else_: AstNode | null;
  pos: number;
}

export interface FuncCallNode {
  kind: "func";
  name: string;
  args: AstNode[];
  pos: number;
}

export interface TryNode {
  kind: "try";
  expr: AstNode;
  catch_: AstNode | null;
  pos: number;
}

export interface ArithOpNode {
  kind: "arith";
  op: "+" | "-" | "*" | "/" | "%";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface CompareOpNode {
  kind: "compare";
  op: "==" | "!=" | "<" | ">" | "<=" | ">=";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface LogicOpNode {
  kind: "logic";
  op: "and" | "or";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface NotNode {
  kind: "not";
  expr: AstNode;
  pos: number;
}

export interface NegateNode {
  kind: "negate";
  expr: AstNode;
  pos: number;
}

export interface RecurseNode {
  kind: "recurse";
  pos: number;
}

export interface CommaNode {
  kind: "comma";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface OptionalNode {
  kind: "optional";
  expr: AstNode;
  pos: number;
}

export interface AlternativeNode {
  kind: "alternative";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface TryAlternativeNode {
  kind: "try_alternative";
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface VarRefNode {
  kind: "var_ref";
  name: string; // includes $ prefix
  pos: number;
}

export type BindingPattern =
  | { type: "variable"; name: string }
  | { type: "array"; elements: BindingPattern[] }
  | { type: "object"; entries: { key: AstNode; pattern: BindingPattern }[] };

export interface AsNode {
  kind: "as";
  expr: AstNode;
  pattern: BindingPattern;
  alternativePatterns: BindingPattern[];
  body: AstNode;
  pos: number;
}

export interface ReduceNode {
  kind: "reduce";
  expr: AstNode;
  pattern: BindingPattern;
  init: AstNode;
  update: AstNode;
  pos: number;
}

export interface ForeachNode {
  kind: "foreach";
  expr: AstNode;
  pattern: BindingPattern;
  init: AstNode;
  update: AstNode;
  extract: AstNode | null;
  pos: number;
}

export interface LabelNode {
  kind: "label";
  name: string;
  body: AstNode;
  pos: number;
}

export interface BreakNode {
  kind: "break";
  name: string;
  pos: number;
}

export interface DefNode {
  kind: "def";
  name: string;
  params: string[];
  body: AstNode;
  next: AstNode;
  pos: number;
}

export interface UpdateNode {
  kind: "update";
  path: AstNode;
  op: "|=" | "+=" | "-=" | "*=" | "/=" | "%=" | "//=";
  body: AstNode;
  pos: number;
}

export interface AssignNode {
  kind: "assign";
  path: AstNode;
  value: AstNode;
  pos: number;
}

export interface ImportNode {
  kind: "import";
  path: string;
  alias: string;
  metadata: AstNode | null;
  next: AstNode;
  pos: number;
}

export interface IncludeNode {
  kind: "include";
  path: string;
  metadata: AstNode | null;
  next: AstNode;
  pos: number;
}

export interface StringInterpolationNode {
  kind: "string_interpolation";
  parts: (string | AstNode)[];
  pos: number;
}

export interface FormatNode {
  kind: "format";
  name: string; // e.g. "base64", "html"
  str: AstNode | null; // for @base64 "string interpolation \(.x)" usage
  pos: number;
}
