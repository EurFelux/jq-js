// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: objects", () => {
  // line 114: {a: 1}
  test(`{a: 1} | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{a: 1}`, input);
    expect(result).toEqual([JSON.parse(`{"a":1}`)]);
  });

  // line 118: {a,b,(.d):.a,e:.b}
  test(`{a,b,(.d):.a,e:.b} | {"a":1, "b":2, "c":3, "d":"c"}`, () => {
    const input = JSON.parse(`{"a":1, "b":2, "c":3, "d":"c"}`);
    const result = jq(`{a,b,(.d):.a,e:.b}`, input);
    expect(result).toEqual([JSON.parse(`{"a":1, "b":2, "c":1, "e":2}`)]);
  });

  // line 122: {"a",b,"a$\(1+1)"}
  test(`{"a",b,"a\$\\(1+1)"} | {"a":1, "b":2, "c":3, "a\$2":4}`, () => {
    const input = JSON.parse(`{"a":1, "b":2, "c":3, "a\$2":4}`);
    const result = jq(`{"a",b,"a\$\\(1+1)"}`, input);
    expect(result).toEqual([JSON.parse(`{"a":1, "b":2, "a\$2":4}`)]);
  });

  // line 2295: { a, $__loc__, c }
  test(`{ a, \$__loc__, c } | {"a":[1,2,3],"b":"foo","c":{"hi":"hey"}}`, () => {
    const input = JSON.parse(`{"a":[1,2,3],"b":"foo","c":{"hi":"hey"}}`);
    const result = jq(`{ a, \$__loc__, c }`, input);
    expect(result).toEqual([
      JSON.parse(`{"a":[1,2,3],"__loc__":{"file":"<top-level>","line":1},"c":{"hi":"hey"}}`),
    ]);
  });

  // line 2299: 1 as $x | "2" as $y | "3" as $z | { $x, as, $y: 4, ($z): 5, if: 6, foo: 7 }
  test(`1 as \$x | "2" as \$y | "3" as \$z | { \$x, as, \$y: 4, (\$z): 5, if: 6, foo: 7 } | {"as":8}`, () => {
    const input = JSON.parse(`{"as":8}`);
    const result = jq(
      `1 as \$x | "2" as \$y | "3" as \$z | { \$x, as, \$y: 4, (\$z): 5, if: 6, foo: 7 }`,
      input,
    );
    expect(result).toEqual([JSON.parse(`{"x":1,"as":8,"2":4,"3":5,"if":6,"foo":7}`)]);
  });
});
