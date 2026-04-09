// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: numbers', () => {
  // line 490: reduce range(65540;65536;-1) as $i ([]; .[$i] = $i)|.[65536:]
  test(`reduce range(65540;65536;-1) as \$i ([]; .[\$i] = \$i)|.[65536:] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`reduce range(65540;65536;-1) as \$i ([]; .[\$i] = \$i)|.[65536:]`, input);
    expect(result).toEqual([JSON.parse(`[null,65537,65538,65539,65540]`)]);
  });

  // line 1872: try ["OK", strftime([])] catch ["KO", .]
  test(`try ["OK", strftime([])] catch ["KO", .] | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try ["OK", strftime([])] catch ["KO", .]`, input);
    expect(result).toEqual([JSON.parse(`["KO","strftime/1 requires a string format"]`)]);
  });

  // line 1876: try ["OK", strflocaltime({})] catch ["KO", .]
  test(`try ["OK", strflocaltime({})] catch ["KO", .] | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try ["OK", strflocaltime({})] catch ["KO", .]`, input);
    expect(result).toEqual([JSON.parse(`["KO","strflocaltime/1 requires a string format"]`)]);
  });

  // line 1880: [strptime("%Y-%m-%dT%H:%M:%SZ")|(.,mktime)]
  test(`[strptime("%Y-%m-%dT%H:%M:%SZ")|(.,mktime)] | "2015-03-05T23:51:47Z"`, () => {
    const input = JSON.parse(`"2015-03-05T23:51:47Z"`);
    const result = jq(`[strptime("%Y-%m-%dT%H:%M:%SZ")|(.,mktime)]`, input);
    expect(result).toEqual([JSON.parse(`[[2015,2,5,23,51,47,4,63],1425599507]`)]);
  });

  // line 1886: last(range(365 * 67)|("1970-03-01T01:02:03Z"|strptime("%Y-%m-%dT%H:%M:%SZ")|mktime) + (86400 * .)|strftime("%Y-%m-%dT%H:%M:%SZ")|strptime("%Y-%m-%dT%H:%M:%SZ"))
  test(`last(range(365 * 67)|("1970-03-01T01:02:03Z"|strptime("%Y-%m-%dT%H:%M:%SZ")|mktime) + (86400 * .)|strftime("%Y-%m-%dT%H:%M:%SZ")|strptime("%Y-%m-%dT%H:%M:%SZ")) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`last(range(365 * 67)|("1970-03-01T01:02:03Z"|strptime("%Y-%m-%dT%H:%M:%SZ")|mktime) + (86400 * .)|strftime("%Y-%m-%dT%H:%M:%SZ")|strptime("%Y-%m-%dT%H:%M:%SZ"))`, input);
    expect(result).toEqual([JSON.parse(`[2037,1,11,1,2,3,3,41]`)]);
  });

  // line 1891: import "a" as foo; import "b" as bar; def fooa: foo::a; [fooa, bar::a, bar::b, foo::a]
  test(`import "a" as foo; import "b" as bar; def fooa: foo::a; [fooa, bar::a, bar::b, foo::a] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`import "a" as foo; import "b" as bar; def fooa: foo::a; [fooa, bar::a, bar::b, foo::a]`, input);
    expect(result).toEqual([JSON.parse(`["a","b","c","a"]`)]);
  });

  // line 1895: import "c" as foo; [foo::a, foo::c]
  test(`import "c" as foo; [foo::a, foo::c] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`import "c" as foo; [foo::a, foo::c]`, input);
    expect(result).toEqual([JSON.parse(`[0,"acmehbah"]`)]);
  });

  // line 1899: include "c"; [a, c]
  test(`include "c"; [a, c] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`include "c"; [a, c]`, input);
    expect(result).toEqual([JSON.parse(`[0,"acmehbah"]`)]);
  });

  // line 1903: import "data" as $e; import "data" as $d; [$d[].this,$e[].that,$d::d[].this,$e::e[].that]|join(";")
  test(`import "data" as \$e; import "data" as \$d; [\$d[].this,\$e[].that,\$d::d[].this,\$e::e[].that]|join(";") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`import "data" as \$e; import "data" as \$d; [\$d[].this,\$e[].that,\$d::d[].this,\$e::e[].that]|join(";")`, input);
    expect(result).toEqual([JSON.parse(`"is a test;is too;is a test;is too"`)]);
  });

  // line 2058: [range(-52;52;1)] as $powers | [$powers[]|pow(2;.)|log2|round] == $powers
  test(`[range(-52;52;1)] as \$powers | [\$powers[]|pow(2;.)|log2|round] == \$powers | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(-52;52;1)] as \$powers | [\$powers[]|pow(2;.)|log2|round] == \$powers`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2080: INDEX(range(5)|[., "foo\(.)"]; .[0])
  test(`INDEX(range(5)|[., "foo\\(.)"]; .[0]) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`INDEX(range(5)|[., "foo\\(.)"]; .[0])`, input);
    expect(result).toEqual([JSON.parse(`{"0":[0,"foo0"],"1":[1,"foo1"],"2":[2,"foo2"],"3":[3,"foo3"],"4":[4,"foo4"]}`)]);
  });

  // line 2084: JOIN({"0":[0,"abc"],"1":[1,"bcd"],"2":[2,"def"],"3":[3,"efg"],"4":[4,"fgh"]}; .[0]|tostring)
  test(`JOIN({"0":[0,"abc"],"1":[1,"bcd"],"2":[2,"def"],"3":[3,"efg"],"4":[4,"fgh"]}; .[0]|tostring) | [[5,"foo"],[3,"bar"],[1,"foobar"]]`, () => {
    const input = JSON.parse(`[[5,"foo"],[3,"bar"],[1,"foobar"]]`);
    const result = jq(`JOIN({"0":[0,"abc"],"1":[1,"bcd"],"2":[2,"def"],"3":[3,"efg"],"4":[4,"fgh"]}; .[0]|tostring)`, input);
    expect(result).toEqual([JSON.parse(`[[[5,"foo"],null],[[3,"bar"],[3,"efg"]],[[1,"foobar"],[1,"bcd"]]]`)]);
  });

  // line 2088: range(5;10)|IN(range(10))
  test(`range(5;10)|IN(range(10)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`range(5;10)|IN(range(10))`, input);
    expect(result).toEqual([JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`true`)]);
  });

  // line 2096: range(5;13)|IN(range(0;10;3))
  test(`range(5;13)|IN(range(0;10;3)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`range(5;13)|IN(range(0;10;3))`, input);
    expect(result).toEqual([JSON.parse(`false`), JSON.parse(`true`), JSON.parse(`false`), JSON.parse(`false`), JSON.parse(`true`), JSON.parse(`false`), JSON.parse(`false`), JSON.parse(`false`)]);
  });

  // line 2107: range(10;12)|IN(range(10))
  test(`range(10;12)|IN(range(10)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`range(10;12)|IN(range(10))`, input);
    expect(result).toEqual([JSON.parse(`false`), JSON.parse(`false`)]);
  });

  // line 2112: IN(range(10;20); range(10))
  test(`IN(range(10;20); range(10)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`IN(range(10;20); range(10))`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 2116: IN(range(5;20); range(10))
  test(`IN(range(5;20); range(10)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`IN(range(5;20); range(10))`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2181: map(. == 1)
  test(`map(. == 1) | [1, 1.0, 1.000, 100e-2, 1e+0, 0.0001e4]`, () => {
    const input = JSON.parse(`[1, 1.0, 1.000, 100e-2, 1e+0, 0.0001e4]`);
    const result = jq(`map(. == 1)`, input);
    expect(result).toEqual([JSON.parse(`[true, true, true, true, true, true]`)]);
  });

  // line 2187: .[0] | tostring | . == if have_decnum then "13911860366432393" else "13911860366432392" end
  test(`.[0] | tostring | . == if have_decnum then "13911860366432393" else "13911860366432392" end | [13911860366432393]`, () => {
    const input = JSON.parse(`[13911860366432393]`);
    const result = jq(`.[0] | tostring | . == if have_decnum then "13911860366432393" else "13911860366432392" end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2191: .x | tojson | . == if have_decnum then "13911860366432393" else "13911860366432392" end
  test(`.x | tojson | . == if have_decnum then "13911860366432393" else "13911860366432392" end | {"x":13911860366432393}`, () => {
    const input = JSON.parse(`{"x":13911860366432393}`);
    const result = jq(`.x | tojson | . == if have_decnum then "13911860366432393" else "13911860366432392" end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2195: (13911860366432393 == 13911860366432392) | . == if have_decnum then false else true end
  test(`(13911860366432393 == 13911860366432392) | . == if have_decnum then false else true end | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`(13911860366432393 == 13911860366432392) | . == if have_decnum then false else true end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2202: . - 10
  test(`. - 10 | 13911860366432393`, () => {
    const input = JSON.parse(`13911860366432393`);
    const result = jq(`. - 10`, input);
    expect(result).toEqual([JSON.parse(`13911860366432382`)]);
  });

  // line 2206: .[0] - 10
  test(`.[0] - 10 | [13911860366432393]`, () => {
    const input = JSON.parse(`[13911860366432393]`);
    const result = jq(`.[0] - 10`, input);
    expect(result).toEqual([JSON.parse(`13911860366432382`)]);
  });

  // line 2210: .x - 10
  test(`.x - 10 | {"x":13911860366432393}`, () => {
    const input = JSON.parse(`{"x":13911860366432393}`);
    const result = jq(`.x - 10`, input);
    expect(result).toEqual([JSON.parse(`13911860366432382`)]);
  });

  // line 2215: -. | tojson == if have_decnum then "-13911860366432393" else "-13911860366432392" end
  test(`-. | tojson == if have_decnum then "-13911860366432393" else "-13911860366432392" end | 13911860366432393`, () => {
    const input = JSON.parse(`13911860366432393`);
    const result = jq(`-. | tojson == if have_decnum then "-13911860366432393" else "-13911860366432392" end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2219: -. | tojson == if have_decnum then "0.12345678901234567890123456789" else "0.12345678901234568" end
  test(`-. | tojson == if have_decnum then "0.12345678901234567890123456789" else "0.12345678901234568" end | -0.12345678901234567890123456789`, () => {
    const input = JSON.parse(`-0.12345678901234567890123456789`);
    const result = jq(`-. | tojson == if have_decnum then "0.12345678901234567890123456789" else "0.12345678901234568" end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2223: [1E+1000,-1E+1000 | tojson] == if have_decnum then ["1E+1000","-1E+1000"] else ["1.7976931348623157e+308","-1.7976931348623157e+308"] end
  test(`[1E+1000,-1E+1000 | tojson] == if have_decnum then ["1E+1000","-1E+1000"] else ["1.7976931348623157e+308","-1.7976931348623157e+308"] end | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1E+1000,-1E+1000 | tojson] == if have_decnum then ["1E+1000","-1E+1000"] else ["1.7976931348623157e+308","-1.7976931348623157e+308"] end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2227: . |= try . catch .
  test(`. |= try . catch . | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`. |= try . catch .`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 2232: .[] as $n | $n+0 | [., tostring, . == $n]
  test(`.[] as \$n | \$n+0 | [., tostring, . == \$n] | [-9007199254740993, -9007199254740992, 9007199254740992, 9007199254740993, 13911860366432393]`, () => {
    const input = JSON.parse(`[-9007199254740993, -9007199254740992, 9007199254740992, 9007199254740993, 13911860366432393]`);
    const result = jq(`.[] as \$n | \$n+0 | [., tostring, . == \$n]`, input);
    expect(result).toEqual([JSON.parse(`[-9007199254740992,"-9007199254740992",true]`), JSON.parse(`[-9007199254740992,"-9007199254740992",true]`), JSON.parse(`[9007199254740992,"9007199254740992",true]`), JSON.parse(`[9007199254740992,"9007199254740992",true]`), JSON.parse(`[13911860366432392,"13911860366432392",true]`)]);
  });

  // line 2241: abs
  test(`abs | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`abs`, input);
    expect(result).toEqual([JSON.parse(`"abc"`)]);
  });

  // line 2245: map(abs)
  test(`map(abs) | [-0, 0, -10, -1.1]`, () => {
    const input = JSON.parse(`[-0, 0, -10, -1.1]`);
    const result = jq(`map(abs)`, input);
    expect(result).toEqual([JSON.parse(`[0,0,10,1.1]`)]);
  });

  // line 2249: map(fabs)
  test(`map(fabs) | [-0, 0, -10, -1.1]`, () => {
    const input = JSON.parse(`[-0, 0, -10, -1.1]`);
    const result = jq(`map(fabs)`, input);
    expect(result).toEqual([JSON.parse(`[0,0,10,1.1]`)]);
  });

  // line 2253: map(abs == length) | unique
  test(`map(abs == length) | unique | [-10, -1.1, -1e-1, 1000000000000000002]`, () => {
    const input = JSON.parse(`[-10, -1.1, -1e-1, 1000000000000000002]`);
    const result = jq(`map(abs == length) | unique`, input);
    expect(result).toEqual([JSON.parse(`[true]`)]);
  });

  // line 2258: map(abs)
  test(`map(abs) | [0.1,1000000000000000002]`, () => {
    const input = JSON.parse(`[0.1,1000000000000000002]`);
    const result = jq(`map(abs)`, input);
    expect(result).toEqual([JSON.parse(`[1e-1, 1000000000000000002]`)]);
  });

  // line 2262: [1E+1000,-1E+1000 | abs | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end
  test(`[1E+1000,-1E+1000 | abs | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1E+1000,-1E+1000 | abs | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2266: [1E+1000,-1E+1000 | length | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end
  test(`[1E+1000,-1E+1000 | length | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[1E+1000,-1E+1000 | length | tojson] | unique == if have_decnum then ["1E+1000"] else ["1.7976931348623157e+308"] end`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2306: fromjson | isnan
  test(`fromjson | isnan | "nan"`, () => {
    const input = JSON.parse(`"nan"`);
    const result = jq(`fromjson | isnan`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2310: tojson | fromjson
  test(`tojson | fromjson | {"a":nan}`, () => {
    const input = JSON.parse(`{"a":nan}`);
    const result = jq(`tojson | fromjson`, input);
    expect(result).toEqual([JSON.parse(`{"a":null}`)]);
  });

  // line 2315: .[] | try (fromjson | isnan) catch .
  test(`.[] | try (fromjson | isnan) catch . | ["NaN","-NaN","NaN1","NaN10","NaN100","NaN1000","NaN10000","NaN100000"]`, () => {
    const input = JSON.parse(`["NaN","-NaN","NaN1","NaN10","NaN100","NaN1000","NaN10000","NaN100000"]`);
    const result = jq(`.[] | try (fromjson | isnan) catch .`, input);
    expect(result).toEqual([JSON.parse(`true`), JSON.parse(`true`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 4 (while parsing 'NaN1')"`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 5 (while parsing 'NaN10')"`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 6 (while parsing 'NaN100')"`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 7 (while parsing 'NaN1000')"`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 8 (while parsing 'NaN10000')"`), JSON.parse(`"Invalid numeric literal at EOF at line 1, column 9 (while parsing 'NaN100000')"`)]);
  });

});
