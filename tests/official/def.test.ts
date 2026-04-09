// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: def', () => {
  // line 784: def f: . + 1; def g: def g: . + 100; f | g | f; (f | g), g
  test(`def f: . + 1; def g: def g: . + 100; f | g | f; (f | g), g | 3.0`, () => {
    const input = JSON.parse(`3.0`);
    const result = jq(`def f: . + 1; def g: def g: . + 100; f | g | f; (f | g), g`, input);
    expect(result).toEqual([JSON.parse(`106.0`), JSON.parse(`105.0`)]);
  });

  // line 789: def f: (1000,2000); f
  test(`def f: (1000,2000); f | 123412345`, () => {
    const input = JSON.parse(`123412345`);
    const result = jq(`def f: (1000,2000); f`, input);
    expect(result).toEqual([JSON.parse(`1000`), JSON.parse(`2000`)]);
  });

  // line 794: def f(a;b;c;d;e;f): [a+1,b,c,d,e,f]; f(.[0];.[1];.[0];.[0];.[0];.[0])
  test(`def f(a;b;c;d;e;f): [a+1,b,c,d,e,f]; f(.[0];.[1];.[0];.[0];.[0];.[0]) | [1,2]`, () => {
    const input = JSON.parse(`[1,2]`);
    const result = jq(`def f(a;b;c;d;e;f): [a+1,b,c,d,e,f]; f(.[0];.[1];.[0];.[0];.[0];.[0])`, input);
    expect(result).toEqual([JSON.parse(`[2,2,1,1,1,1]`)]);
  });

  // line 798: def f: 1; def g: f, def f: 2; def g: 3; f, def f: g; f, g; def f: 4; [f, def f: g; def g: 5; f, g]+[f,g]
  test(`def f: 1; def g: f, def f: 2; def g: 3; f, def f: g; f, g; def f: 4; [f, def f: g; def g: 5; f, g]+[f,g] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`def f: 1; def g: f, def f: 2; def g: 3; f, def f: g; f, g; def f: 4; [f, def f: g; def g: 5; f, g]+[f,g]`, input);
    expect(result).toEqual([JSON.parse(`[4,1,2,3,3,5,4,1,2,3,3]`)]);
  });

  // line 803: def a: 0; . | a
  test(`def a: 0; . | a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`def a: 0; . | a`, input);
    expect(result).toEqual([JSON.parse(`0`)]);
  });

  // line 808: def f(a;b;c;d;e;f;g;h;i;j): [j,i,h,g,f,e,d,c,b,a]; f(.[0];.[1];.[2];.[3];.[4];.[5];.[6];.[7];.[8];.[9])
  test(`def f(a;b;c;d;e;f;g;h;i;j): [j,i,h,g,f,e,d,c,b,a]; f(.[0];.[1];.[2];.[3];.[4];.[5];.[6];.[7];.[8];.[9]) | [0,1,2,3,4,5,6,7,8,9]`, () => {
    const input = JSON.parse(`[0,1,2,3,4,5,6,7,8,9]`);
    const result = jq(`def f(a;b;c;d;e;f;g;h;i;j): [j,i,h,g,f,e,d,c,b,a]; f(.[0];.[1];.[2];.[3];.[4];.[5];.[6];.[7];.[8];.[9])`, input);
    expect(result).toEqual([JSON.parse(`[9,8,7,6,5,4,3,2,1,0]`)]);
  });

  // line 812: ([1,2] + [4,5])
  test(`([1,2] + [4,5]) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`([1,2] + [4,5])`, input);
    expect(result).toEqual([JSON.parse(`[1,2,4,5]`)]);
  });

  // line 816: true
  test(`true | [1]`, () => {
    const input = JSON.parse(`[1]`);
    const result = jq(`true`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 820: null,1,null
  test(`null,1,null | "hello"`, () => {
    const input = JSON.parse(`"hello"`);
    const result = jq(`null,1,null`, input);
    expect(result).toEqual([JSON.parse(`null`), JSON.parse(`1`), JSON.parse(`null`)]);
  });

  // line 826: [1,2,3]
  test(`[1,2,3] | [5,6]`, () => {
    const input = JSON.parse(`[5,6]`);
    const result = jq(`[1,2,3]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 830: [.[]|floor]
  test(`[.[]|floor] | [-1.1,1.1,1.9]`, () => {
    const input = JSON.parse(`[-1.1,1.1,1.9]`);
    const result = jq(`[.[]|floor]`, input);
    expect(result).toEqual([JSON.parse(`[-2, 1, 1]`)]);
  });

  // line 834: [.[]|sqrt]
  test(`[.[]|sqrt] | [4,9]`, () => {
    const input = JSON.parse(`[4,9]`);
    const result = jq(`[.[]|sqrt]`, input);
    expect(result).toEqual([JSON.parse(`[2,3]`)]);
  });

  // line 838: (add / length) as $m | map((. - $m) as $d | $d * $d) | add / length | sqrt
  test(`(add / length) as \$m | map((. - \$m) as \$d | \$d * \$d) | add / length | sqrt | [2,4,4,4,5,5,7,9]`, () => {
    const input = JSON.parse(`[2,4,4,4,5,5,7,9]`);
    const result = jq(`(add / length) as \$m | map((. - \$m) as \$d | \$d * \$d) | add / length | sqrt`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 899: reduce .[] as $x (0; . + $x)
  test(`reduce .[] as \$x (0; . + \$x) | [1,2,4]`, () => {
    const input = JSON.parse(`[1,2,4]`);
    const result = jq(`reduce .[] as \$x (0; . + \$x)`, input);
    expect(result).toEqual([JSON.parse(`7`)]);
  });

  // line 903: reduce .[] as [$i, {j:$j}] (0; . + $i - $j)
  test(`reduce .[] as [\$i, {j:\$j}] (0; . + \$i - \$j) | [[2,{"j":1}], [5,{"j":3}], [6,{"j":4}]]`, () => {
    const input = JSON.parse(`[[2,{"j":1}], [5,{"j":3}], [6,{"j":4}]]`);
    const result = jq(`reduce .[] as [\$i, {j:\$j}] (0; . + \$i - \$j)`, input);
    expect(result).toEqual([JSON.parse(`5`)]);
  });

  // line 907: reduce [[1,2,10], [3,4,10]][] as [$i,$j] (0; . + $i * $j)
  test(`reduce [[1,2,10], [3,4,10]][] as [\$i,\$j] (0; . + \$i * \$j) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`reduce [[1,2,10], [3,4,10]][] as [\$i,\$j] (0; . + \$i * \$j)`, input);
    expect(result).toEqual([JSON.parse(`14`)]);
  });

  // line 911: [-reduce -.[] as $x (0; . + $x)]
  test(`[-reduce -.[] as \$x (0; . + \$x)] | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`[-reduce -.[] as \$x (0; . + \$x)]`, input);
    expect(result).toEqual([JSON.parse(`[6]`)]);
  });

  // line 915: [reduce .[] / .[] as $i (0; . + $i)]
  test(`[reduce .[] / .[] as \$i (0; . + \$i)] | [1,2]`, () => {
    const input = JSON.parse(`[1,2]`);
    const result = jq(`[reduce .[] / .[] as \$i (0; . + \$i)]`, input);
    expect(result).toEqual([JSON.parse(`[4.5]`)]);
  });

  // line 919: reduce .[] as $x (0; . + $x) as $x | $x
  test(`reduce .[] as \$x (0; . + \$x) as \$x | \$x | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`reduce .[] as \$x (0; . + \$x) as \$x | \$x`, input);
    expect(result).toEqual([JSON.parse(`6`)]);
  });

  // line 924: reduce . as $n (.; .)
  test(`reduce . as \$n (.; .) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`reduce . as \$n (.; .)`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

});
