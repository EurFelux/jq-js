// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: format", () => {
  // line 929: . as {$a, b: [$c, {$d}]} | [$a, $c, $d]
  test(`. as {\$a, b: [\$c, {\$d}]} | [\$a, \$c, \$d] | {"a":1, "b":[2,{"d":3}]}`, () => {
    const input = JSON.parse(`{"a":1, "b":[2,{"d":3}]}`);
    const result = jq(`. as {\$a, b: [\$c, {\$d}]} | [\$a, \$c, \$d]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 933: . as {$a, $b:[$c, $d]}| [$a, $b, $c, $d]
  test(`. as {\$a, \$b:[\$c, \$d]}| [\$a, \$b, \$c, \$d] | {"a":1, "b":[2,{"d":3}]}`, () => {
    const input = JSON.parse(`{"a":1, "b":[2,{"d":3}]}`);
    const result = jq(`. as {\$a, \$b:[\$c, \$d]}| [\$a, \$b, \$c, \$d]`, input);
    expect(result).toEqual([JSON.parse(`[1,[2,{"d":3}],2,{"d":3}]`)]);
  });

  // line 938: .[] | . as {$a, b: [$c, {$d}]} ?// [$a, {$b}, $e] ?// $f | [$a, $b, $c, $d, $e, $f]
  test(`.[] | . as {\$a, b: [\$c, {\$d}]} ?// [\$a, {\$b}, \$e] ?// \$f | [\$a, \$b, \$c, \$d, \$e, \$f] | [{"a":1, "b":[2,{"d":3}]}, [4, {"b":5, "c":6}, 7, 8, 9], "foo"]`, () => {
    const input = JSON.parse(`[{"a":1, "b":[2,{"d":3}]}, [4, {"b":5, "c":6}, 7, 8, 9], "foo"]`);
    const result = jq(
      `.[] | . as {\$a, b: [\$c, {\$d}]} ?// [\$a, {\$b}, \$e] ?// \$f | [\$a, \$b, \$c, \$d, \$e, \$f]`,
      input,
    );
    expect(result).toEqual([
      JSON.parse(`[1, null, 2, 3, null, null]`),
      JSON.parse(`[4, 5, null, null, 7, null]`),
      JSON.parse(`[null, null, null, null, null, "foo"]`),
    ]);
  });
});
