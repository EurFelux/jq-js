// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: iteration", () => {
  // line 237: .[]
  test(`.[] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`.[]`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`2`), JSON.parse(`3`)]);
  });

  // line 243: 1,1
  test(`1,1 | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`1,1`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`1`)]);
  });

  // line 248: 1,.
  test(`1,. | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`1,.`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`[]`)]);
  });

  // line 253: [.]
  test(`[.] | [2]`, () => {
    const input = JSON.parse(`[2]`);
    const result = jq(`[.]`, input);
    expect(result).toEqual([JSON.parse(`[[2]]`)]);
  });

  // line 257: [[2]]
  test(`[[2]] | [3]`, () => {
    const input = JSON.parse(`[3]`);
    const result = jq(`[[2]]`, input);
    expect(result).toEqual([JSON.parse(`[[2]]`)]);
  });

  // line 261: [{}]
  test(`[{}] | [2]`, () => {
    const input = JSON.parse(`[2]`);
    const result = jq(`[{}]`, input);
    expect(result).toEqual([JSON.parse(`[{}]`)]);
  });

  // line 265: [.[]]
  test(`[.[]] | ["a"]`, () => {
    const input = JSON.parse(`["a"]`);
    const result = jq(`[.[]]`, input);
    expect(result).toEqual([JSON.parse(`["a"]`)]);
  });

  // line 269: [(.,1),((.,.[]),(2,3))]
  test(`[(.,1),((.,.[]),(2,3))] | ["a","b"]`, () => {
    const input = JSON.parse(`["a","b"]`);
    const result = jq(`[(.,1),((.,.[]),(2,3))]`, input);
    expect(result).toEqual([JSON.parse(`[["a","b"],1,["a","b"],"a","b",2,3]`)]);
  });

  // line 273: [([5,5][]),.,.[]]
  test(`[([5,5][]),.,.[]] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[([5,5][]),.,.[]]`, input);
    expect(result).toEqual([JSON.parse(`[5,5,[1,2,3],1,2,3]`)]);
  });

  // line 277: {x: (1,2)},{x:3} | .x
  test(`{x: (1,2)},{x:3} | .x | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{x: (1,2)},{x:3} | .x`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`2`), JSON.parse(`3`)]);
  });

  // line 283: [.[-4,-3,-2,-1,0,1,2,3]]
  test(`[.[-4,-3,-2,-1,0,1,2,3]] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[.[-4,-3,-2,-1,0,1,2,3]]`, input);
    expect(result).toEqual([JSON.parse(`[null,1,2,3,1,2,3,null]`)]);
  });

  // line 287: [range(0;10)]
  test(`[range(0;10)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0;10)]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,3,4,5,6,7,8,9]`)]);
  });

  // line 291: [range(0,1;3,4)]
  test(`[range(0,1;3,4)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0,1;3,4)]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2, 0,1,2,3, 1,2, 1,2,3]`)]);
  });

  // line 295: [range(0;10;3)]
  test(`[range(0;10;3)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0;10;3)]`, input);
    expect(result).toEqual([JSON.parse(`[0,3,6,9]`)]);
  });

  // line 299: [range(0;10;-1)]
  test(`[range(0;10;-1)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0;10;-1)]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 303: [range(0;-5;-1)]
  test(`[range(0;-5;-1)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0;-5;-1)]`, input);
    expect(result).toEqual([JSON.parse(`[0,-1,-2,-3,-4]`)]);
  });

  // line 307: [range(0,1;4,5;1,2)]
  test(`[range(0,1;4,5;1,2)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0,1;4,5;1,2)]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,3,0,2, 0,1,2,3,4,0,2,4, 1,2,3,1,3, 1,2,3,4,1,3]`)]);
  });

  // line 311: [while(.<100; .*2)]
  test(`[while(.<100; .*2)] | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`[while(.<100; .*2)]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,4,8,16,32,64]`)]);
  });

  // line 315: [(label $here | .[] | if .>1 then break $here else . end), "hi!"]
  test(`[(label \$here | .[] | if .>1 then break \$here else . end), "hi!"] | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`[(label \$here | .[] | if .>1 then break \$here else . end), "hi!"]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,"hi!"]`)]);
  });

  // line 319: [(label $here | .[] | if .>1 then break $here else . end), "hi!"]
  test(`[(label \$here | .[] | if .>1 then break \$here else . end), "hi!"] | [0,2,1]`, () => {
    const input = JSON.parse(`[0,2,1]`);
    const result = jq(`[(label \$here | .[] | if .>1 then break \$here else . end), "hi!"]`, input);
    expect(result).toEqual([JSON.parse(`[0,"hi!"]`)]);
  });

  // line 329: [.[]|[.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]]
  test(`[.[]|[.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]] | [1,2,3,4,5]`, () => {
    const input = JSON.parse(`[1,2,3,4,5]`);
    const result = jq(`[.[]|[.,1]|until(.[0] < 1; [.[0] - 1, .[1] * .[0]])|.[1]]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,6,24,120]`)]);
  });

  // line 333: [label $out | foreach .[] as $item ([3, null]; if .[0] < 1 then break $out else [.[0] -1, $item] end; .[1])]
  test(`[label \$out | foreach .[] as \$item ([3, null]; if .[0] < 1 then break \$out else [.[0] -1, \$item] end; .[1])] | [11,22,33,44,55,66,77,88,99]`, () => {
    const input = JSON.parse(`[11,22,33,44,55,66,77,88,99]`);
    const result = jq(
      `[label \$out | foreach .[] as \$item ([3, null]; if .[0] < 1 then break \$out else [.[0] -1, \$item] end; .[1])]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[11,22,33]`)]);
  });

  // line 337: [foreach range(5) as $item (0; $item)]
  test(`[foreach range(5) as \$item (0; \$item)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[foreach range(5) as \$item (0; \$item)]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,3,4]`)]);
  });

  // line 341: [foreach .[] as [$i, $j] (0; . + $i - $j)]
  test(`[foreach .[] as [\$i, \$j] (0; . + \$i - \$j)] | [[2,1], [5,3], [6,4]]`, () => {
    const input = JSON.parse(`[[2,1], [5,3], [6,4]]`);
    const result = jq(`[foreach .[] as [\$i, \$j] (0; . + \$i - \$j)]`, input);
    expect(result).toEqual([JSON.parse(`[1,3,5]`)]);
  });

  // line 345: [foreach .[] as {a:$a} (0; . + $a; -.)]
  test(`[foreach .[] as {a:\$a} (0; . + \$a; -.)] | [{"a":1}, {"b":2}, {"a":3, "b":4}]`, () => {
    const input = JSON.parse(`[{"a":1}, {"b":2}, {"a":3, "b":4}]`);
    const result = jq(`[foreach .[] as {a:\$a} (0; . + \$a; -.)]`, input);
    expect(result).toEqual([JSON.parse(`[-1, -1, -4]`)]);
  });

  // line 349: [-foreach -.[] as $x (0; . + $x)]
  test(`[-foreach -.[] as \$x (0; . + \$x)] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[-foreach -.[] as \$x (0; . + \$x)]`, input);
    expect(result).toEqual([JSON.parse(`[1,3,6]`)]);
  });

  // line 353: [foreach .[] / .[] as $i (0; . + $i)]
  test(`[foreach .[] / .[] as \$i (0; . + \$i)] | [1,2]`, () => {
    const input = JSON.parse(`[1,2]`);
    const result = jq(`[foreach .[] / .[] as \$i (0; . + \$i)]`, input);
    expect(result).toEqual([JSON.parse(`[1,3,3.5,4.5]`)]);
  });

  // line 357: [foreach .[] as $x (0; . + $x) as $x | $x]
  test(`[foreach .[] as \$x (0; . + \$x) as \$x | \$x] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[foreach .[] as \$x (0; . + \$x) as \$x | \$x]`, input);
    expect(result).toEqual([JSON.parse(`[1,3,6]`)]);
  });

  // line 361: [limit(3; .[])]
  test(`[limit(3; .[])] | [11,22,33,44,55,66,77,88,99]`, () => {
    const input = JSON.parse(`[11,22,33,44,55,66,77,88,99]`);
    const result = jq(`[limit(3; .[])]`, input);
    expect(result).toEqual([JSON.parse(`[11,22,33]`)]);
  });

  // line 365: [limit(0; error)]
  test(`[limit(0; error)] | "badness"`, () => {
    const input = JSON.parse(`"badness"`);
    const result = jq(`[limit(0; error)]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 369: [limit(1; 1, error)]
  test(`[limit(1; 1, error)] | "badness"`, () => {
    const input = JSON.parse(`"badness"`);
    const result = jq(`[limit(1; 1, error)]`, input);
    expect(result).toEqual([JSON.parse(`[1]`)]);
  });

  // line 373: try limit(-1; error) catch .
  test(`try limit(-1; error) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try limit(-1; error) catch .`, input);
    expect(result).toEqual([JSON.parse(`"limit doesn't support negative count"`)]);
  });

  // line 377: [skip(3; .[])]
  test(`[skip(3; .[])] | [1,2,3,4,5,6,7,8,9]`, () => {
    const input = JSON.parse(`[1,2,3,4,5,6,7,8,9]`);
    const result = jq(`[skip(3; .[])]`, input);
    expect(result).toEqual([JSON.parse(`[4,5,6,7,8,9]`)]);
  });

  // line 381: [skip(0,2,3,4; .[])]
  test(`[skip(0,2,3,4; .[])] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[skip(0,2,3,4; .[])]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3,3]`)]);
  });

  // line 385: [skip(3; .[])]
  test(`[skip(3; .[])] | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`[skip(3; .[])]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 389: try skip(-1; error) catch .
  test(`try skip(-1; error) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try skip(-1; error) catch .`, input);
    expect(result).toEqual([JSON.parse(`"skip doesn't support negative count"`)]);
  });

  // line 393: nth(1; 0,1,error("foo"))
  test(`nth(1; 0,1,error("foo")) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`nth(1; 0,1,error("foo"))`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 397: [first(range(.)), last(range(.))]
  test(`[first(range(.)), last(range(.))] | 10`, () => {
    const input = JSON.parse(`10`);
    const result = jq(`[first(range(.)), last(range(.))]`, input);
    expect(result).toEqual([JSON.parse(`[0,9]`)]);
  });

  // line 401: [first(range(.)), last(range(.))]
  test(`[first(range(.)), last(range(.))] | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`[first(range(.)), last(range(.))]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 405: [nth(0,5,9,10,15; range(.)), try nth(-1; range(.)) catch .]
  test(`[nth(0,5,9,10,15; range(.)), try nth(-1; range(.)) catch .] | 10`, () => {
    const input = JSON.parse(`10`);
    const result = jq(`[nth(0,5,9,10,15; range(.)), try nth(-1; range(.)) catch .]`, input);
    expect(result).toEqual([JSON.parse(`[0,5,9,"nth doesn't support negative indices"]`)]);
  });

  // line 410: first(1,error("foo"))
  test(`first(1,error("foo")) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`first(1,error("foo"))`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 420: [limit(5,7; range(9))]
  test(`[limit(5,7; range(9))] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[limit(5,7; range(9))]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,3,4,0,1,2,3,4,5,6]`)]);
  });

  // line 425: [nth(5,7; range(9;0;-1))]
  test(`[nth(5,7; range(9;0;-1))] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[nth(5,7; range(9;0;-1))]`, input);
    expect(result).toEqual([JSON.parse(`[4,2]`)]);
  });

  // line 430: [range(0,1,2;4,3,2;2,3)]
  test(`[range(0,1,2;4,3,2;2,3)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(0,1,2;4,3,2;2,3)]`, input);
    expect(result).toEqual([JSON.parse(`[0,2,0,3,0,2,0,0,0,1,3,1,1,1,1,1,2,2,2,2]`)]);
  });

  // line 435: [range(3,5)]
  test(`[range(3,5)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(3,5)]`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2,0,1,2,3,4]`)]);
  });

  // line 440: [(index(",","|"), rindex(",","|")), indices(",","|")]
  test(`[(index(",","|"), rindex(",","|")), indices(",","|")] | "a,b|c,d,e||f,g,h,|,|,i,j"`, () => {
    const input = JSON.parse(`"a,b|c,d,e||f,g,h,|,|,i,j"`);
    const result = jq(`[(index(",","|"), rindex(",","|")), indices(",","|")]`, input);
    expect(result).toEqual([JSON.parse(`[1,3,22,19,[1,5,7,12,14,16,18,20,22],[3,9,10,17,19]]`)]);
  });

  // line 445: join(",","/")
  test(`join(",","/") | ["a","b","c","d"]`, () => {
    const input = JSON.parse(`["a","b","c","d"]`);
    const result = jq(`join(",","/")`, input);
    expect(result).toEqual([JSON.parse(`"a,b,c,d"`), JSON.parse(`"a/b/c/d"`)]);
  });

  // line 450: [.[]|join("a")]
  test(`[.[]|join("a")] | [[],[""],["",""],["","",""]]`, () => {
    const input = JSON.parse(`[[],[""],["",""],["","",""]]`);
    const result = jq(`[.[]|join("a")]`, input);
    expect(result).toEqual([JSON.parse(`["","","a","aa"]`)]);
  });

  // line 455: flatten(3,2,1)
  test(`flatten(3,2,1) | [0, [1], [[2]], [[[3]]]]`, () => {
    const input = JSON.parse(`[0, [1], [[2]], [[[3]]]]`);
    const result = jq(`flatten(3,2,1)`, input);
    expect(result).toEqual([
      JSON.parse(`[0,1,2,3]`),
      JSON.parse(`[0,1,2,[3]]`),
      JSON.parse(`[0,1,[2],[[3]]]`),
    ]);
  });
});
