// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: builtins', () => {
  // line 577: 1+1
  test(`1+1 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1+1`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 581: 1+1
  test(`1+1 | "wtasdf"`, () => {
    const input = JSON.parse(`"wtasdf"`);
    const result = jq(`1+1`, input);
    expect(result).toEqual([JSON.parse(`2.0`)]);
  });

  // line 585: 2-1
  test(`2-1 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`2-1`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 589: 2-(-1)
  test(`2-(-1) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`2-(-1)`, input);
    expect(result).toEqual([JSON.parse(`3`)]);
  });

  // line 593: 1e+0+0.001e3
  test(`1e+0+0.001e3 | "I wonder what this will be?"`, () => {
    const input = JSON.parse(`"I wonder what this will be?"`);
    const result = jq(`1e+0+0.001e3`, input);
    expect(result).toEqual([JSON.parse(`20e-1`)]);
  });

  // line 597: .+4
  test(`.+4 | 15`, () => {
    const input = JSON.parse(`15`);
    const result = jq(`.+4`, input);
    expect(result).toEqual([JSON.parse(`19.0`)]);
  });

  // line 601: .+null
  test(`.+null | {"a":42}`, () => {
    const input = JSON.parse(`{"a":42}`);
    const result = jq(`.+null`, input);
    expect(result).toEqual([JSON.parse(`{"a":42}`)]);
  });

  // line 605: null+.
  test(`null+. | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`null+.`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 609: .a+.b
  test(`.a+.b | {"a":42}`, () => {
    const input = JSON.parse(`{"a":42}`);
    const result = jq(`.a+.b`, input);
    expect(result).toEqual([JSON.parse(`42`)]);
  });

  // line 613: [1,2,3] + [.]
  test(`[1,2,3] + [.] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1,2,3] + [.]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3,null]`)]);
  });

  // line 617: {"a":1} + {"b":2} + {"c":3}
  test(`{"a":1} + {"b":2} + {"c":3} | "asdfasdf"`, () => {
    const input = JSON.parse(`"asdfasdf"`);
    const result = jq(`{"a":1} + {"b":2} + {"c":3}`, input);
    expect(result).toEqual([JSON.parse(`{"a":1, "b":2, "c":3}`)]);
  });

  // line 621: "asdf" + "jkl;" + . + . + .
  test(`"asdf" + "jkl;" + . + . + . | "some string"`, () => {
    const input = JSON.parse(`"some string"`);
    const result = jq(`"asdf" + "jkl;" + . + . + .`, input);
    expect(result).toEqual([JSON.parse(`"asdfjkl;some stringsome stringsome string"`)]);
  });

  // line 625: "\u0000\u0020\u0000" + .
  test(`"\\u0000\\u0020\\u0000" + . | "\\u0000\\u0020\\u0000"`, () => {
    const input = JSON.parse(`"\\u0000\\u0020\\u0000"`);
    const result = jq(`"\\u0000\\u0020\\u0000" + .`, input);
    expect(result).toEqual([JSON.parse(`"\\u0000 \\u0000\\u0000 \\u0000"`)]);
  });

  // line 629: 42 - .
  test(`42 - . | 11`, () => {
    const input = JSON.parse(`11`);
    const result = jq(`42 - .`, input);
    expect(result).toEqual([JSON.parse(`31`)]);
  });

  // line 633: [1,2,3,4,1] - [.,3]
  test(`[1,2,3,4,1] - [.,3] | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`[1,2,3,4,1] - [.,3]`, input);
    expect(result).toEqual([JSON.parse(`[2,4]`)]);
  });

  // line 637: [-1 as $x | 1,$x]
  test(`[-1 as \$x | 1,\$x] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[-1 as \$x | 1,\$x]`, input);
    expect(result).toEqual([JSON.parse(`[1,-1]`)]);
  });

  // line 641: [10 * 20, 20 / .]
  test(`[10 * 20, 20 / .] | 4`, () => {
    const input = JSON.parse(`4`);
    const result = jq(`[10 * 20, 20 / .]`, input);
    expect(result).toEqual([JSON.parse(`[200, 5]`)]);
  });

  // line 645: 1 + 2 * 2 + 10 / 2
  test(`1 + 2 * 2 + 10 / 2 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 + 2 * 2 + 10 / 2`, input);
    expect(result).toEqual([JSON.parse(`10`)]);
  });

  // line 649: [16 / 4 / 2, 16 / 4 * 2, 16 - 4 - 2, 16 - 4 + 2]
  test(`[16 / 4 / 2, 16 / 4 * 2, 16 - 4 - 2, 16 - 4 + 2] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[16 / 4 / 2, 16 / 4 * 2, 16 - 4 - 2, 16 - 4 + 2]`, input);
    expect(result).toEqual([JSON.parse(`[2, 8, 10, 14]`)]);
  });

  // line 653: 1e-19 + 1e-20 - 5e-21
  test(`1e-19 + 1e-20 - 5e-21 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1e-19 + 1e-20 - 5e-21`, input);
    expect(result).toEqual([JSON.parse(`1.05e-19`)]);
  });

  // line 657: 1 / 1e-17
  test(`1 / 1e-17 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 / 1e-17`, input);
    expect(result).toEqual([JSON.parse(`1e+17`)]);
  });

  // line 661: 9E999999999, 9999999999E999999990, 1E-999999999, 0.000000001E-999999990
  test(`9E999999999, 9999999999E999999990, 1E-999999999, 0.000000001E-999999990 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`9E999999999, 9999999999E999999990, 1E-999999999, 0.000000001E-999999990`, input);
    expect(result).toEqual([JSON.parse(`9E+999999999`), JSON.parse(`9.999999999E+999999999`), JSON.parse(`1E-999999999`), JSON.parse(`1E-999999999`)]);
  });

  // line 668: 5E500000000 > 5E-5000000000, 10000E500000000 > 10000E-5000000000
  test(`5E500000000 > 5E-5000000000, 10000E500000000 > 10000E-5000000000 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`5E500000000 > 5E-5000000000, 10000E500000000 > 10000E-5000000000`, input);
    expect(result).toEqual([JSON.parse(`true`), JSON.parse(`true`)]);
  });

  // line 674: (1e999999999, 10e999999999) > (1e-1147483646, 0.1e-1147483646)
  test(`(1e999999999, 10e999999999) > (1e-1147483646, 0.1e-1147483646) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`(1e999999999, 10e999999999) > (1e-1147483646, 0.1e-1147483646)`, input);
    expect(result).toEqual([JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`true`)]);
  });

  // line 681: 25 % 7
  test(`25 % 7 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`25 % 7`, input);
    expect(result).toEqual([JSON.parse(`4`)]);
  });

  // line 685: 49732 % 472
  test(`49732 % 472 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`49732 % 472`, input);
    expect(result).toEqual([JSON.parse(`172`)]);
  });

  // line 689: [(infinite, -infinite) % (1, -1, infinite)]
  test(`[(infinite, -infinite) % (1, -1, infinite)] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[(infinite, -infinite) % (1, -1, infinite)]`, input);
    expect(result).toEqual([JSON.parse(`[0,0,0,0,0,-1]`)]);
  });

  // line 693: [nan % 1, 1 % nan | isnan]
  test(`[nan % 1, 1 % nan | isnan] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[nan % 1, 1 % nan | isnan]`, input);
    expect(result).toEqual([JSON.parse(`[true,true]`)]);
  });

  // line 697: 1 + tonumber + ("10" | tonumber)
  test(`1 + tonumber + ("10" | tonumber) | 4`, () => {
    const input = JSON.parse(`4`);
    const result = jq(`1 + tonumber + ("10" | tonumber)`, input);
    expect(result).toEqual([JSON.parse(`15`)]);
  });

  // line 701: "123\u0000456" | try tonumber catch .
  test(`"123\\u0000456" | try tonumber catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"123\\u0000456" | try tonumber catch .`, input);
    expect(result).toEqual([JSON.parse(`"string (\\"123\\\\u0000456\\") cannot be parsed as a number"`)]);
  });

  // line 705: map(toboolean)
  test(`map(toboolean) | ["false","true",false,true]`, () => {
    const input = JSON.parse(`["false","true",false,true]`);
    const result = jq(`map(toboolean)`, input);
    expect(result).toEqual([JSON.parse(`[false,true,false,true]`)]);
  });

  // line 709: .[] | try toboolean catch .
  test(`.[] | try toboolean catch . | [null,0,"tru","truee","fals","falsee",[],{}]`, () => {
    const input = JSON.parse(`[null,0,"tru","truee","fals","falsee",[],{}]`);
    const result = jq(`.[] | try toboolean catch .`, input);
    expect(result).toEqual([JSON.parse(`"null (null) cannot be parsed as a boolean"`), JSON.parse(`"number (0) cannot be parsed as a boolean"`), JSON.parse(`"string (\\"tru\\") cannot be parsed as a boolean"`), JSON.parse(`"string (\\"truee\\") cannot be parsed as a boolean"`), JSON.parse(`"string (\\"fals\\") cannot be parsed as a boolean"`), JSON.parse(`"string (\\"falsee\\") cannot be parsed as a boolean"`), JSON.parse(`"array ([]) cannot be parsed as a boolean"`), JSON.parse(`"object ({}) cannot be parsed as a boolean"`)]);
  });

  // line 720: "true\u0000x", "false\u0000" | try toboolean catch .
  test(`"true\\u0000x", "false\\u0000" | try toboolean catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"true\\u0000x", "false\\u0000" | try toboolean catch .`, input);
    expect(result).toEqual([JSON.parse(`"string (\\"true\\\\u0000x\\") cannot be parsed as a boolean"`), JSON.parse(`"string (\\"false\\\\u0000\\") cannot be parsed as a boolean"`)]);
  });

  // line 725: [{"a":42},.object,10,.num,false,true,null,"b",[1,4]] | .[] as $x | [$x == .[]]
  test(`[{"a":42},.object,10,.num,false,true,null,"b",[1,4]] | .[] as \$x | [\$x == .[]] | {"object": {"a":42}, "num":10.0}`, () => {
    const input = JSON.parse(`{"object": {"a":42}, "num":10.0}`);
    const result = jq(`[{"a":42},.object,10,.num,false,true,null,"b",[1,4]] | .[] as \$x | [\$x == .[]]`, input);
    expect(result).toEqual([JSON.parse(`[true,  true,  false, false, false, false, false, false, false]`), JSON.parse(`[true,  true,  false, false, false, false, false, false, false]`), JSON.parse(`[false, false, true,  true,  false, false, false, false, false]`), JSON.parse(`[false, false, true,  true,  false, false, false, false, false]`), JSON.parse(`[false, false, false, false, true,  false, false, false, false]`), JSON.parse(`[false, false, false, false, false, true,  false, false, false]`), JSON.parse(`[false, false, false, false, false, false, true,  false, false]`), JSON.parse(`[false, false, false, false, false, false, false, true,  false]`), JSON.parse(`[false, false, false, false, false, false, false, false, true ]`)]);
  });

  // line 737: [.[] | length]
  test(`[.[] | length] | [[], {}, [1,2], {"a":42}, "asdf", "\\u03bc"]`, () => {
    const input = JSON.parse(`[[], {}, [1,2], {"a":42}, "asdf", "\\u03bc"]`);
    const result = jq(`[.[] | length]`, input);
    expect(result).toEqual([JSON.parse(`[0, 0, 2, 1, 4, 1]`)]);
  });

  // line 741: utf8bytelength
  test(`utf8bytelength | "asdf\\u03bc"`, () => {
    const input = JSON.parse(`"asdf\\u03bc"`);
    const result = jq(`utf8bytelength`, input);
    expect(result).toEqual([JSON.parse(`6`)]);
  });

  // line 745: [.[] | try utf8bytelength catch .]
  test(`[.[] | try utf8bytelength catch .] | [[], {}, [1,2], 55, true, false]`, () => {
    const input = JSON.parse(`[[], {}, [1,2], 55, true, false]`);
    const result = jq(`[.[] | try utf8bytelength catch .]`, input);
    expect(result).toEqual([JSON.parse(`["array ([]) only strings have UTF-8 byte length","object ({}) only strings have UTF-8 byte length","array ([1,2]) only strings have UTF-8 byte length","number (55) only strings have UTF-8 byte length","boolean (true) only strings have UTF-8 byte length","boolean (false) only strings have UTF-8 byte length"]`)]);
  });

  // line 750: map(keys)
  test(`map(keys) | [{}, {"abcd":1,"abc":2,"abcde":3}, {"x":1, "z": 3, "y":2}]`, () => {
    const input = JSON.parse(`[{}, {"abcd":1,"abc":2,"abcde":3}, {"x":1, "z": 3, "y":2}]`);
    const result = jq(`map(keys)`, input);
    expect(result).toEqual([JSON.parse(`[[], ["abc","abcd","abcde"], ["x","y","z"]]`)]);
  });

  // line 754: [1,2,empty,3,empty,4]
  test(`[1,2,empty,3,empty,4] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1,2,empty,3,empty,4]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3,4]`)]);
  });

  // line 758: map(add)
  test(`map(add) | [[], [1,2,3], ["a","b","c"], [[3],[4,5],[6]], [{"a":1}, {"b":2}, {"a":3}]]`, () => {
    const input = JSON.parse(`[[], [1,2,3], ["a","b","c"], [[3],[4,5],[6]], [{"a":1}, {"b":2}, {"a":3}]]`);
    const result = jq(`map(add)`, input);
    expect(result).toEqual([JSON.parse(`[null, 6, "abc", [3,4,5,6], {"a":3, "b": 2}]`)]);
  });

  // line 762: map_values(.+1)
  test(`map_values(.+1) | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`map_values(.+1)`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 766: [add(null), add(range(range(10))), add(empty), add(10,range(10))]
  test(`[add(null), add(range(range(10))), add(empty), add(10,range(10))] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[add(null), add(range(range(10))), add(empty), add(10,range(10))]`, input);
    expect(result).toEqual([JSON.parse(`[null,120,null,55]`)]);
  });

  // line 771: .sum = add(.arr[])
  test(`.sum = add(.arr[]) | {"arr":[]}`, () => {
    const input = JSON.parse(`{"arr":[]}`);
    const result = jq(`.sum = add(.arr[])`, input);
    expect(result).toEqual([JSON.parse(`{"arr":[],"sum":null}`)]);
  });

  // line 775: add({(.[]):1}) | keys
  test(`add({(.[]):1}) | keys | ["a","a","b","a","d","b","d","a","d"]`, () => {
    const input = JSON.parse(`["a","a","b","a","d","b","d","a","d"]`);
    const result = jq(`add({(.[]):1}) | keys`, input);
    expect(result).toEqual([JSON.parse(`["a","b","d"]`)]);
  });

});
