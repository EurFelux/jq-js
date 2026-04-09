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
  | StringInterpolationNode;

export interface IdentityNode {
  kind: 'identity';
  pos: number;
}

export interface FieldAccessNode {
  kind: 'field';
  name: string;
  pos: number;
}

export interface IndexNode {
  kind: 'index';
  index: AstNode;
  pos: number;
}

export interface SliceNode {
  kind: 'slice';
  from: AstNode | null;
  to: AstNode | null;
  pos: number;
}

export interface IterateNode {
  kind: 'iterate';
  pos: number;
}

export interface PipeNode {
  kind: 'pipe';
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface LiteralNode {
  kind: 'literal';
  value: string | number | boolean | null;
  pos: number;
}

export interface ArrayConstructNode {
  kind: 'array';
  expr: AstNode | null;
  pos: number;
}

export interface ObjectConstructNode {
  kind: 'object';
  entries: ObjectEntry[];
  pos: number;
}

export interface ObjectEntry {
  key: AstNode;
  value: AstNode | null; // null means {foo} shorthand for {foo: .foo}
}

export interface ConditionNode {
  kind: 'condition';
  condition: AstNode;
  then: AstNode;
  elifs: { condition: AstNode; then: AstNode }[];
  else_: AstNode | null;
  pos: number;
}

export interface FuncCallNode {
  kind: 'func';
  name: string;
  args: AstNode[];
  pos: number;
}

export interface TryNode {
  kind: 'try';
  expr: AstNode;
  catch_: AstNode | null;
  pos: number;
}

export interface ArithOpNode {
  kind: 'arith';
  op: '+' | '-' | '*' | '/' | '%';
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface CompareOpNode {
  kind: 'compare';
  op: '==' | '!=' | '<' | '>' | '<=' | '>=';
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface LogicOpNode {
  kind: 'logic';
  op: 'and' | 'or';
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface NotNode {
  kind: 'not';
  expr: AstNode;
  pos: number;
}

export interface NegateNode {
  kind: 'negate';
  expr: AstNode;
  pos: number;
}

export interface RecurseNode {
  kind: 'recurse';
  pos: number;
}

export interface CommaNode {
  kind: 'comma';
  left: AstNode;
  right: AstNode;
  pos: number;
}

export interface OptionalNode {
  kind: 'optional';
  expr: AstNode;
  pos: number;
}

export interface StringInterpolationNode {
  kind: 'string_interpolation';
  parts: (string | AstNode)[];
  pos: number;
}
