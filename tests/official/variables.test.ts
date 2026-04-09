// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: variables', () => {
  // line 498: 1 as $x | 2 as $y | [$x,$y,$x]
  test(`1 as \$x | 2 as \$y | [\$x,\$y,\$x] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 as \$x | 2 as \$y | [\$x,\$y,\$x]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,1]`)]);
  });

  // line 502: [1,2,3][] as $x | [[4,5,6,7][$x]]
  test(`[1,2,3][] as \$x | [[4,5,6,7][\$x]] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1,2,3][] as \$x | [[4,5,6,7][\$x]]`, input);
    expect(result).toEqual([JSON.parse(`[5]`), JSON.parse(`[6]`), JSON.parse(`[7]`)]);
  });

  // line 508: 42 as $x | . | . | . + 432 | $x + 1
  test(`42 as \$x | . | . | . + 432 | \$x + 1 | 34324`, () => {
    const input = JSON.parse(`34324`);
    const result = jq(`42 as \$x | . | . | . + 432 | \$x + 1`, input);
    expect(result).toEqual([JSON.parse(`43`)]);
  });

  // line 512: 1 + 2 as $x | -$x
  test(`1 + 2 as \$x | -\$x | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 + 2 as \$x | -\$x`, input);
    expect(result).toEqual([JSON.parse(`-3`)]);
  });

  // line 516: "x" as $x | "a"+"y" as $y | $x+","+$y
  test(`"x" as \$x | "a"+"y" as \$y | \$x+","+\$y | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"x" as \$x | "a"+"y" as \$y | \$x+","+\$y`, input);
    expect(result).toEqual([JSON.parse(`"x,ay"`)]);
  });

  // line 520: 1 as $x | [$x,$x,$x as $x | $x]
  test(`1 as \$x | [\$x,\$x,\$x as \$x | \$x] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 as \$x | [\$x,\$x,\$x as \$x | \$x]`, input);
    expect(result).toEqual([JSON.parse(`[1,1,1]`)]);
  });

  // line 524: [1, {c:3, d:4}] as [$a, {c:$b, b:$c}] | $a, $b, $c
  test(`[1, {c:3, d:4}] as [\$a, {c:\$b, b:\$c}] | \$a, \$b, \$c | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1, {c:3, d:4}] as [\$a, {c:\$b, b:\$c}] | \$a, \$b, \$c`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`3`), JSON.parse(`null`)]);
  });

  // line 530: . as {as: $kw, "str": $str, ("e"+"x"+"p"): $exp} | [$kw, $str, $exp]
  test(`. as {as: \$kw, "str": \$str, ("e"+"x"+"p"): \$exp} | [\$kw, \$str, \$exp] | {"as": 1, "str": 2, "exp": 3}`, () => {
    const input = JSON.parse(`{"as": 1, "str": 2, "exp": 3}`);
    const result = jq(`. as {as: \$kw, "str": \$str, ("e"+"x"+"p"): \$exp} | [\$kw, \$str, \$exp]`, input);
    expect(result).toEqual([JSON.parse(`[1, 2, 3]`)]);
  });

  // line 534: .[] as [$a, $b] | [$b, $a]
  test(`.[] as [\$a, \$b] | [\$b, \$a] | [[1], [1, 2, 3]]`, () => {
    const input = JSON.parse(`[[1], [1, 2, 3]]`);
    const result = jq(`.[] as [\$a, \$b] | [\$b, \$a]`, input);
    expect(result).toEqual([JSON.parse(`[null, 1]`), JSON.parse(`[2, 1]`)]);
  });

  // line 539: . as $i | . as [$i] | $i
  test(`. as \$i | . as [\$i] | \$i | [0]`, () => {
    const input = JSON.parse(`[0]`);
    const result = jq(`. as \$i | . as [\$i] | \$i`, input);
    expect(result).toEqual([JSON.parse(`0`)]);
  });

  // line 543: . as [$i] | . as $i | $i
  test(`. as [\$i] | . as \$i | \$i | [0]`, () => {
    const input = JSON.parse(`[0]`);
    const result = jq(`. as [\$i] | . as \$i | \$i`, input);
    expect(result).toEqual([JSON.parse(`[0]`)]);
  });

  // line 2272: 123 as $label | $label
  test(`123 as \$label | \$label | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`123 as \$label | \$label`, input);
    expect(result).toEqual([JSON.parse(`123`)]);
  });

  // line 2276: [ label $if | range(10) | ., (select(. == 5) | break $if) ]
  test(`[ label \$if | range(10) | ., (select(. == 5) | break \$if) ] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[ label \$if | range(10) | ., (select(. == 5) | break \$if) ]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,3,4,5]`)]);
  });

  // line 2280: reduce .[] as $then (4 as $else | $else; . as $elif | . + $then * $elif)
  test(`reduce .[] as \$then (4 as \$else | \$else; . as \$elif | . + \$then * \$elif) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`reduce .[] as \$then (4 as \$else | \$else; . as \$elif | . + \$then * \$elif)`, input);
    expect(result).toEqual([JSON.parse(`96`)]);
  });

  // line 2284: 1 as $foreach | 2 as $and | 3 as $or | { $foreach, $and, $or, a }
  test(`1 as \$foreach | 2 as \$and | 3 as \$or | { \$foreach, \$and, \$or, a } | {"a":4,"b":5}`, () => {
    const input = JSON.parse(`{"a":4,"b":5}`);
    const result = jq(`1 as \$foreach | 2 as \$and | 3 as \$or | { \$foreach, \$and, \$or, a }`, input);
    expect(result).toEqual([JSON.parse(`{"foreach":1,"and":2,"or":3,"a":4}`)]);
  });

  // line 2288: [ foreach .[] as $try (1 as $catch | $catch - 1; . + $try; .) ]
  test(`[ foreach .[] as \$try (1 as \$catch | \$catch - 1; . + \$try; .) ] | [10,9,8,7]`, () => {
    const input = JSON.parse(`[10,9,8,7]`);
    const result = jq(`[ foreach .[] as \$try (1 as \$catch | \$catch - 1; . + \$try; .) ]`, input);
    expect(result).toEqual([JSON.parse(`[10,19,27,34]`)]);
  });

});
