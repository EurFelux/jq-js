// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: regex", () => {
  // line 86: @base64
  test(`@base64 | "foóbar\\n"`, () => {
    const input = JSON.parse(`"foóbar\\n"`);
    const result = jq(`@base64`, input);
    expect(result).toEqual([JSON.parse(`"Zm/Ds2Jhcgo="`)]);
  });

  // line 90: @base64d
  test(`@base64d | "Zm/Ds2Jhcgo="`, () => {
    const input = JSON.parse(`"Zm/Ds2Jhcgo="`);
    const result = jq(`@base64d`, input);
    expect(result).toEqual([JSON.parse(`"foóbar\\n"`)]);
  });

  // line 94: @uri
  test(`@uri | "\\u03bc"`, () => {
    const input = JSON.parse(`"\\u03bc"`);
    const result = jq(`@uri`, input);
    expect(result).toEqual([JSON.parse(`"%CE%BC"`)]);
  });

  // line 98: @urid
  test(`@urid | "%CE%BC"`, () => {
    const input = JSON.parse(`"%CE%BC"`);
    const result = jq(`@urid`, input);
    expect(result).toEqual([JSON.parse(`"\\u03bc"`)]);
  });

  // line 102: @html "<b>\(.)</b>"
  test(`@html "<b>\\(.)</b>" | "<script>hax</script>"`, () => {
    const input = JSON.parse(`"<script>hax</script>"`);
    const result = jq(`@html "<b>\\(.)</b>"`, input);
    expect(result).toEqual([JSON.parse(`"<b>&lt;script&gt;hax&lt;/script&gt;</b>"`)]);
  });

  // line 106: [.[]|tojson|fromjson]
  test(`[.[]|tojson|fromjson] | ["foo", 1, ["a", 1, "b", 2, {"foo":"bar"}]]`, () => {
    const input = JSON.parse(`["foo", 1, ["a", 1, "b", 2, {"foo":"bar"}]]`);
    const result = jq(`[.[]|tojson|fromjson]`, input);
    expect(result).toEqual([JSON.parse(`["foo",1,["a",1,"b",2,{"foo":"bar"}]]`)]);
  });

  // line 847: atan * 4 * 1000000|floor / 1000000
  test(`atan * 4 * 1000000|floor / 1000000 | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`atan * 4 * 1000000|floor / 1000000`, input);
    expect(result).toEqual([JSON.parse(`3.141592`)]);
  });

  // line 851: [(3.141592 / 2) * (range(0;20) / 20)|cos * 1000000|floor / 1000000]
  test(`[(3.141592 / 2) * (range(0;20) / 20)|cos * 1000000|floor / 1000000] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[(3.141592 / 2) * (range(0;20) / 20)|cos * 1000000|floor / 1000000]`, input);
    expect(result).toEqual([
      JSON.parse(
        `[1,0.996917,0.987688,0.972369,0.951056,0.923879,0.891006,0.85264,0.809017,0.760406,0.707106,0.649448,0.587785,0.522498,0.45399,0.382683,0.309017,0.233445,0.156434,0.078459]`,
      ),
    ]);
  });

  // line 855: [(3.141592 / 2) * (range(0;20) / 20)|sin * 1000000|floor / 1000000]
  test(`[(3.141592 / 2) * (range(0;20) / 20)|sin * 1000000|floor / 1000000] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[(3.141592 / 2) * (range(0;20) / 20)|sin * 1000000|floor / 1000000]`, input);
    expect(result).toEqual([
      JSON.parse(
        `[0,0.078459,0.156434,0.233445,0.309016,0.382683,0.45399,0.522498,0.587785,0.649447,0.707106,0.760405,0.809016,0.85264,0.891006,0.923879,0.951056,0.972369,0.987688,0.996917]`,
      ),
    ]);
  });

  // line 860: def f(x): x | x; f([.], . + [42])
  test(`def f(x): x | x; f([.], . + [42]) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`def f(x): x | x; f([.], . + [42])`, input);
    expect(result).toEqual([
      JSON.parse(`[[[1,2,3]]]`),
      JSON.parse(`[[1,2,3],42]`),
      JSON.parse(`[[1,2,3,42]]`),
      JSON.parse(`[1,2,3,42,42]`),
    ]);
  });

  // line 868: def f: .+1; def g: f; def f: .+100; def f(a):a+.+11; [(g|f(20)), f]
  test(`def f: .+1; def g: f; def f: .+100; def f(a):a+.+11; [(g|f(20)), f] | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`def f: .+1; def g: f; def f: .+100; def f(a):a+.+11; [(g|f(20)), f]`, input);
    expect(result).toEqual([JSON.parse(`[33,101]`)]);
  });

  // line 873: def id(x):x; 2000 as $x | def f(x):1 as $x | id([$x, x, x]); def g(x): 100 as $x | f($x,$x+x); g($x)
  test(`def id(x):x; 2000 as \$x | def f(x):1 as \$x | id([\$x, x, x]); def g(x): 100 as \$x | f(\$x,\$x+x); g(\$x) | "more testing"`, () => {
    const input = JSON.parse(`"more testing"`);
    const result = jq(
      `def id(x):x; 2000 as \$x | def f(x):1 as \$x | id([\$x, x, x]); def g(x): 100 as \$x | f(\$x,\$x+x); g(\$x)`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[1,100,2100.0,100,2100.0]`)]);
  });

  // line 878: def x(a;b): a as $a | b as $b | $a + $b; def y($a;$b): $a + $b; def check(a;b): [x(a;b)] == [y(a;b)]; check(.[];.[]*2)
  test(`def x(a;b): a as \$a | b as \$b | \$a + \$b; def y(\$a;\$b): \$a + \$b; def check(a;b): [x(a;b)] == [y(a;b)]; check(.[];.[]*2) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(
      `def x(a;b): a as \$a | b as \$b | \$a + \$b; def y(\$a;\$b): \$a + \$b; def check(a;b): [x(a;b)] == [y(a;b)]; check(.[];.[]*2)`,
      input,
    );
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 884: [[20,10][1,0] as $x | def f: (100,200) as $y | def g: [$x + $y, .]; . + $x | g; f[0] | [f][0][1] | f]
  test(`[[20,10][1,0] as \$x | def f: (100,200) as \$y | def g: [\$x + \$y, .]; . + \$x | g; f[0] | [f][0][1] | f] | 999999999`, () => {
    const input = JSON.parse(`999999999`);
    const result = jq(
      `[[20,10][1,0] as \$x | def f: (100,200) as \$y | def g: [\$x + \$y, .]; . + \$x | g; f[0] | [f][0][1] | f]`,
      input,
    );
    expect(result).toEqual([
      JSON.parse(
        `[[110.0, 130.0], [210.0, 130.0], [110.0, 230.0], [210.0, 230.0], [120.0, 160.0], [220.0, 160.0], [120.0, 260.0], [220.0, 260.0]]`,
      ),
    ]);
  });

  // line 1399: [ 10 == 10, 10 != 10, 10 != 11, 10 == 11]
  test(`[ 10 == 10, 10 != 10, 10 != 11, 10 == 11] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`[ 10 == 10, 10 != 10, 10 != 11, 10 == 11]`, input);
    expect(result).toEqual([JSON.parse(`[true,false,true,false]`)]);
  });

  // line 1403: ["hello" == "hello", "hello" != "hello", "hello" == "world", "hello" != "world" ]
  test(`["hello" == "hello", "hello" != "hello", "hello" == "world", "hello" != "world" ] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(
      `["hello" == "hello", "hello" != "hello", "hello" == "world", "hello" != "world" ]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true,false,false,true]`)]);
  });

  // line 1407: [[1,2,3] == [1,2,3], [1,2,3] != [1,2,3], [1,2,3] == [4,5,6], [1,2,3] != [4,5,6]]
  test(`[[1,2,3] == [1,2,3], [1,2,3] != [1,2,3], [1,2,3] == [4,5,6], [1,2,3] != [4,5,6]] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(
      `[[1,2,3] == [1,2,3], [1,2,3] != [1,2,3], [1,2,3] == [4,5,6], [1,2,3] != [4,5,6]]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true,false,false,true]`)]);
  });

  // line 1411: [{"foo":42} == {"foo":42},{"foo":42} != {"foo":42}, {"foo":42} != {"bar":42}, {"foo":42} == {"bar":42}]
  test(`[{"foo":42} == {"foo":42},{"foo":42} != {"foo":42}, {"foo":42} != {"bar":42}, {"foo":42} == {"bar":42}] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(
      `[{"foo":42} == {"foo":42},{"foo":42} != {"foo":42}, {"foo":42} != {"bar":42}, {"foo":42} == {"bar":42}]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true,false,true,false]`)]);
  });

  // line 1416: [{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":18},"world"]},{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":19},"world"]}]
  test(`[{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":18},"world"]},{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":19},"world"]}] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(
      `[{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":18},"world"]},{"foo":[1,2,{"bar":18},"world"]} == {"foo":[1,2,{"bar":19},"world"]}]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true,false]`)]);
  });

  // line 1421: [("foo" | contains("foo")), ("foobar" | contains("foo")), ("foo" | contains("foobar"))]
  test(`[("foo" | contains("foo")), ("foobar" | contains("foo")), ("foo" | contains("foobar"))] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(
      `[("foo" | contains("foo")), ("foobar" | contains("foo")), ("foo" | contains("foobar"))]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true, true, false]`)]);
  });

  // line 1426: [contains(""), contains("\u0000")]
  test(`[contains(""), contains("\\u0000")] | "\\u0000"`, () => {
    const input = JSON.parse(`"\\u0000"`);
    const result = jq(`[contains(""), contains("\\u0000")]`, input);
    expect(result).toEqual([JSON.parse(`[true, true]`)]);
  });

  // line 1430: [contains(""), contains("a"), contains("ab"), contains("c"), contains("d")]
  test(`[contains(""), contains("a"), contains("ab"), contains("c"), contains("d")] | "ab\\u0000cd"`, () => {
    const input = JSON.parse(`"ab\\u0000cd"`);
    const result = jq(
      `[contains(""), contains("a"), contains("ab"), contains("c"), contains("d")]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true, true, true, true, true]`)]);
  });

  // line 1434: [contains("cd"), contains("b\u0000"), contains("ab\u0000")]
  test(`[contains("cd"), contains("b\\u0000"), contains("ab\\u0000")] | "ab\\u0000cd"`, () => {
    const input = JSON.parse(`"ab\\u0000cd"`);
    const result = jq(`[contains("cd"), contains("b\\u0000"), contains("ab\\u0000")]`, input);
    expect(result).toEqual([JSON.parse(`[true, true, true]`)]);
  });

  // line 1438: [contains("b\u0000c"), contains("b\u0000cd"), contains("b\u0000cd")]
  test(`[contains("b\\u0000c"), contains("b\\u0000cd"), contains("b\\u0000cd")] | "ab\\u0000cd"`, () => {
    const input = JSON.parse(`"ab\\u0000cd"`);
    const result = jq(
      `[contains("b\\u0000c"), contains("b\\u0000cd"), contains("b\\u0000cd")]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[true, true, true]`)]);
  });

  // line 1442: [contains("@"), contains("\u0000@"), contains("\u0000what")]
  test(`[contains("@"), contains("\\u0000@"), contains("\\u0000what")] | "ab\\u0000cd"`, () => {
    const input = JSON.parse(`"ab\\u0000cd"`);
    const result = jq(`[contains("@"), contains("\\u0000@"), contains("\\u0000what")]`, input);
    expect(result).toEqual([JSON.parse(`[false, false, false]`)]);
  });

  // line 1859: try strftime("%Y-%m-%dT%H:%M:%SZ") catch .
  test(`try strftime("%Y-%m-%dT%H:%M:%SZ") catch . | ["a",1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`["a",1,2,3,4,5,6,7]`);
    const result = jq(`try strftime("%Y-%m-%dT%H:%M:%SZ") catch .`, input);
    expect(result).toEqual([JSON.parse(`"strftime/1 requires parsed datetime inputs"`)]);
  });

  // line 1863: try strflocaltime("%Y-%m-%dT%H:%M:%SZ") catch .
  test(`try strflocaltime("%Y-%m-%dT%H:%M:%SZ") catch . | ["a",1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`["a",1,2,3,4,5,6,7]`);
    const result = jq(`try strflocaltime("%Y-%m-%dT%H:%M:%SZ") catch .`, input);
    expect(result).toEqual([JSON.parse(`"strflocaltime/1 requires parsed datetime inputs"`)]);
  });

  // line 1867: try mktime catch .
  test(`try mktime catch . | ["a",1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`["a",1,2,3,4,5,6,7]`);
    const result = jq(`try mktime catch .`, input);
    expect(result).toEqual([JSON.parse(`"mktime requires parsed datetime inputs"`)]);
  });

  // line 1908: import "data" as $a; import "data" as $b; def f: {$a, $b}; f
  test(`import "data" as \$a; import "data" as \$b; def f: {\$a, \$b}; f | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`import "data" as \$a; import "data" as \$b; def f: {\$a, \$b}; f`, input);
    expect(result).toEqual([
      JSON.parse(
        `{"a":[{"this":"is a test","that":"is too"}],"b":[{"this":"is a test","that":"is too"}]}`,
      ),
    ]);
  });

  // line 1912: include "shadow1"; e
  test(`include "shadow1"; e | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`include "shadow1"; e`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 1916: include "shadow1"; include "shadow2"; e
  test(`include "shadow1"; include "shadow2"; e | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`include "shadow1"; include "shadow2"; e`, input);
    expect(result).toEqual([JSON.parse(`3`)]);
  });

  // line 1920: import "shadow1" as f; import "shadow2" as f; import "shadow1" as e; [e::e, f::e]
  test(`import "shadow1" as f; import "shadow2" as f; import "shadow1" as e; [e::e, f::e] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `import "shadow1" as f; import "shadow2" as f; import "shadow1" as e; [e::e, f::e]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`[2,3]`)]);
  });

  // line 1960: modulemeta
  test(`modulemeta | "c"`, () => {
    const input = JSON.parse(`"c"`);
    const result = jq(`modulemeta`, input);
    expect(result).toEqual([
      JSON.parse(
        `{"whatever":null,"deps":[{"as":"foo","is_data":false,"relpath":"a"},{"search":"./","as":"d","is_data":false,"relpath":"d"},{"search":"./","as":"d2","is_data":false,"relpath":"d"},{"search":"./../lib/jq","as":"e","is_data":false,"relpath":"e"},{"search":"./../lib/jq","as":"f","is_data":false,"relpath":"f"},{"as":"d","is_data":true,"relpath":"data"}],"defs":["a/0","c/0"]}`,
      ),
    ]);
  });

  // line 1964: modulemeta | .deps | length
  test(`modulemeta | .deps | length | "c"`, () => {
    const input = JSON.parse(`"c"`);
    const result = jq(`modulemeta | .deps | length`, input);
    expect(result).toEqual([JSON.parse(`6`)]);
  });

  // line 1968: modulemeta | .defs | length
  test(`modulemeta | .defs | length | "c"`, () => {
    const input = JSON.parse(`"c"`);
    const result = jq(`modulemeta | .defs | length`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 1972: %%FAIL IGNORE MSG
  test(`%%FAIL IGNORE MSG | import "syntaxerror" as e; .`, () => {
    const input = JSON.parse(`import "syntaxerror" as e; .`);
    const result = jq(`%%FAIL IGNORE MSG`, input);
    expect(result).toEqual([
      JSON.parse(
        `jq: error: syntax error, unexpected ';', expecting end of file at tests/modules/syntaxerror/syntaxerror.jq, line 1, column 4:`,
      ),
      JSON.parse(`    wat;`),
      JSON.parse(`       ^`),
    ]);
  });

  // line 1984: import "test_bind_order" as check; check::check
  test(`import "test_bind_order" as check; check::check | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`import "test_bind_order" as check; check::check`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1988: try -. catch .
  test(`try -. catch . | "very-long-long-long-long-string"`, () => {
    const input = JSON.parse(`"very-long-long-long-long-string"`);
    const result = jq(`try -. catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"string (\\"very-long-long-long-long...\\") cannot be negated"`),
    ]);
  });

  // line 1992: try (.-.) catch .
  test(`try (.-.) catch . | "very-long-long-long-long-string"`, () => {
    const input = JSON.parse(`"very-long-long-long-long-string"`);
    const result = jq(`try (.-.) catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"string (\\"very-long-long-long-long...\\") and string (\\"very-long-long-long-long...\\") cannot be subtracted"`,
      ),
    ]);
  });

  // line 1996: "x" * range(0; 12; 2) + "☆" * 8 | try -. catch .
  test(`"x" * range(0; 12; 2) + "☆" * 8 | try -. catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"x" * range(0; 12; 2) + "☆" * 8 | try -. catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"string (\\"☆☆☆☆☆☆☆☆\\") cannot be negated"`),
      JSON.parse(`"string (\\"xx☆☆☆☆☆☆☆☆\\") cannot be negated"`),
      JSON.parse(`"string (\\"xxxx☆☆☆☆☆☆...\\") cannot be negated"`),
      JSON.parse(`"string (\\"xxxxxx☆☆☆☆☆☆...\\") cannot be negated"`),
      JSON.parse(`"string (\\"xxxxxxxx☆☆☆☆☆...\\") cannot be negated"`),
      JSON.parse(`"string (\\"xxxxxxxxxx☆☆☆☆...\\") cannot be negated"`),
    ]);
  });

  // line 2005: try (. + "x") catch . == if have_decnum then "number (12345678901234567890123456...) and string (\"x\") cannot be added" else "number (12345678901234568000000000...) and string (\"x\") cannot be added" end
  test(`try (. + "x") catch . == if have_decnum then "number (12345678901234567890123456...) and string (\\"x\\") cannot be added" else "number (12345678901234568000000000...) and string (\\"x\\") cannot be added" end | 123456789012345678901234567890`, () => {
    const input = JSON.parse(`123456789012345678901234567890`);
    const result = jq(
      `try (. + "x") catch . == if have_decnum then "number (12345678901234567890123456...) and string (\\"x\\") cannot be added" else "number (12345678901234568000000000...) and string (\\"x\\") cannot be added" end`,
      input,
    );
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2009: join(",")
  test(`join(",") | ["1",2,true,false,3.4]`, () => {
    const input = JSON.parse(`["1",2,true,false,3.4]`);
    const result = jq(`join(",")`, input);
    expect(result).toEqual([JSON.parse(`"1,2,true,false,3.4"`)]);
  });

  // line 2013: .[] | join(",")
  test(`.[] | join(",") | [[], [null], [null,null], [null,null,null]]`, () => {
    const input = JSON.parse(`[[], [null], [null,null], [null,null,null]]`);
    const result = jq(`.[] | join(",")`, input);
    expect(result).toEqual([
      JSON.parse(`""`),
      JSON.parse(`""`),
      JSON.parse(`","`),
      JSON.parse(`",,"`),
    ]);
  });

  // line 2020: .[] | join(",")
  test(`.[] | join(",") | [["a",null], [null,"a"]]`, () => {
    const input = JSON.parse(`[["a",null], [null,"a"]]`);
    const result = jq(`.[] | join(",")`, input);
    expect(result).toEqual([JSON.parse(`"a,"`), JSON.parse(`",a"`)]);
  });

  // line 2025: try join(",") catch .
  test(`try join(",") catch . | ["1","2",{"a":{"b":{"c":33}}}]`, () => {
    const input = JSON.parse(`["1","2",{"a":{"b":{"c":33}}}]`);
    const result = jq(`try join(",") catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"string (\\"1,2,\\") and object ({\\"a\\":{\\"b\\":{\\"c\\":33}}}) cannot be added"`,
      ),
    ]);
  });

  // line 2029: try join(",") catch .
  test(`try join(",") catch . | ["1","2",[3,4,5]]`, () => {
    const input = JSON.parse(`["1","2",[3,4,5]]`);
    const result = jq(`try join(",") catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"string (\\"1,2,\\") and array ([3,4,5]) cannot be added"`),
    ]);
  });

  // line 2033: {if:0,and:1,or:2,then:3,else:4,elif:5,end:6,as:7,def:8,reduce:9,foreach:10,try:11,catch:12,label:13,import:14,include:15,module:16}
  test(`{if:0,and:1,or:2,then:3,else:4,elif:5,end:6,as:7,def:8,reduce:9,foreach:10,try:11,catch:12,label:13,import:14,include:15,module:16} | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `{if:0,and:1,or:2,then:3,else:4,elif:5,end:6,as:7,def:8,reduce:9,foreach:10,try:11,catch:12,label:13,import:14,include:15,module:16}`,
      input,
    );
    expect(result).toEqual([
      JSON.parse(
        `{"if":0,"and":1,"or":2,"then":3,"else":4,"elif":5,"end":6,"as":7,"def":8,"reduce":9,"foreach":10,"try":11,"catch":12,"label":13,"import":14,"include":15,"module":16}`,
      ),
    ]);
  });

  // line 2037: try (1/.) catch .
  test(`try (1/.) catch . | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try (1/.) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"number (1) and number (0) cannot be divided because the divisor is zero"`),
    ]);
  });

  // line 2041: try (1/0) catch .
  test(`try (1/0) catch . | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try (1/0) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"number (1) and number (0) cannot be divided because the divisor is zero"`),
    ]);
  });

  // line 2045: try (0/0) catch .
  test(`try (0/0) catch . | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try (0/0) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"number (0) and number (0) cannot be divided because the divisor is zero"`),
    ]);
  });

  // line 2049: try (1%.) catch .
  test(`try (1%.) catch . | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try (1%.) catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"number (1) and number (0) cannot be divided (remainder) because the divisor is zero"`,
      ),
    ]);
  });

  // line 2053: try (1%0) catch .
  test(`try (1%0) catch . | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`try (1%0) catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"number (1) and number (0) cannot be divided (remainder) because the divisor is zero"`,
      ),
    ]);
  });

  // line 2121: (.a as $x | .b) = "b"
  test(`(.a as \$x | .b) = "b" | {"a":null,"b":null}`, () => {
    const input = JSON.parse(`{"a":null,"b":null}`);
    const result = jq(`(.a as \$x | .b) = "b"`, input);
    expect(result).toEqual([JSON.parse(`{"a":null,"b":"b"}`)]);
  });

  // line 2126: (.. | select(type == "object" and has("b") and (.b | type) == "array")|.b) |= .[0]
  test(`(.. | select(type == "object" and has("b") and (.b | type) == "array")|.b) |= .[0] | {"a": {"b": [1, {"b": 3}]}}`, () => {
    const input = JSON.parse(`{"a": {"b": [1, {"b": 3}]}}`);
    const result = jq(
      `(.. | select(type == "object" and has("b") and (.b | type) == "array")|.b) |= .[0]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`{"a": {"b": 1}}`)]);
  });

  // line 2130: isempty(empty)
  test(`isempty(empty) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`isempty(empty)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2134: isempty(range(3))
  test(`isempty(range(3)) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`isempty(range(3))`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 2138: isempty(1,error("foo"))
  test(`isempty(1,error("foo")) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`isempty(1,error("foo"))`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 2143: index("")
  test(`index("") | ""`, () => {
    const input = JSON.parse(`""`);
    const result = jq(`index("")`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 2148: builtins|length > 10
  test(`builtins|length > 10 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`builtins|length > 10`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2152: "-1"|IN(builtins[] / "/"|.[1])
  test(`"-1"|IN(builtins[] / "/"|.[1]) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"-1"|IN(builtins[] / "/"|.[1])`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 2156: all(builtins[] / "/"; .[1]|tonumber >= 0)
  test(`all(builtins[] / "/"; .[1]|tonumber >= 0) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`all(builtins[] / "/"; .[1]|tonumber >= 0)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2160: builtins|any(.[:1] == "_")
  test(`builtins|any(.[:1] == "_") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`builtins|any(.[:1] == "_")`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 2328: try input catch .
  test(`try input catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try input catch .`, input);
    expect(result).toEqual([JSON.parse(`"break"`)]);
  });

  // line 2332: debug
  test(`debug | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`debug`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 2394: implode|explode
  test(`implode|explode | [-1,0,1,2,3,1114111,1114112,55295,55296,57343,57344,1.1,1.9]`, () => {
    const input = JSON.parse(`[-1,0,1,2,3,1114111,1114112,55295,55296,57343,57344,1.1,1.9]`);
    const result = jq(`implode|explode`, input);
    expect(result).toEqual([
      JSON.parse(`[65533,0,1,2,3,1114111,65533,55295,65533,65533,57344,1,1]`),
    ]);
  });

  // line 2398: map(try implode catch .)
  test(`map(try implode catch .) | [123,["a"],[nan]]`, () => {
    const input = JSON.parse(`[123,["a"],[nan]]`);
    const result = jq(`map(try implode catch .)`, input);
    expect(result).toEqual([
      JSON.parse(
        `["implode input must be an array","string (\\"a\\") can't be imploded, unicode codepoint needs to be numeric","number (null) can't be imploded, unicode codepoint needs to be numeric"]`,
      ),
    ]);
  });

  // line 2402: try 0[implode] catch .
  test(`try 0[implode] catch . | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`try 0[implode] catch .`, input);
    expect(result).toEqual([JSON.parse(`"Cannot index number with string (\\"\\")"`)]);
  });

  // line 2416: [walk(.,1)]
  test(`[walk(.,1)] | {"x":0}`, () => {
    const input = JSON.parse(`{"x":0}`);
    const result = jq(`[walk(.,1)]`, input);
    expect(result).toEqual([JSON.parse(`[{"x":0},1]`)]);
  });

  // line 2421: walk(select(IN({}, []) | not))
  test(`walk(select(IN({}, []) | not)) | {"a":1,"b":[]}`, () => {
    const input = JSON.parse(`{"a":1,"b":[]}`);
    const result = jq(`walk(select(IN({}, []) | not))`, input);
    expect(result).toEqual([JSON.parse(`{"a":1}`)]);
  });

  // line 2426: [range(10)] | .[1.2:3.5]
  test(`[range(10)] | .[1.2:3.5] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(10)] | .[1.2:3.5]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 2430: [range(10)] | .[1.5:3.5]
  test(`[range(10)] | .[1.5:3.5] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(10)] | .[1.5:3.5]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 2434: [range(10)] | .[1.7:3.5]
  test(`[range(10)] | .[1.7:3.5] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(10)] | .[1.7:3.5]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 2438: [range(10)] | .[1.7:4294967295]
  test(`[range(10)] | .[1.7:4294967295] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(10)] | .[1.7:4294967295]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3,4,5,6,7,8,9]`)]);
  });

  // line 2442: [range(10)] | .[1.7:-4294967296]
  test(`[range(10)] | .[1.7:-4294967296] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(10)] | .[1.7:-4294967296]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 2446: [[range(10)] | .[1.1,1.5,1.7]]
  test(`[[range(10)] | .[1.1,1.5,1.7]] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[range(10)] | .[1.1,1.5,1.7]]`, input);
    expect(result).toEqual([JSON.parse(`[1,1,1]`)]);
  });

  // line 2450: [range(5)] | .[1.1] = 5
  test(`[range(5)] | .[1.1] = 5 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(5)] | .[1.1] = 5`, input);
    expect(result).toEqual([JSON.parse(`[0,5,2,3,4]`)]);
  });

  // line 2454: [range(3)] | .[nan:1]
  test(`[range(3)] | .[nan:1] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(3)] | .[nan:1]`, input);
    expect(result).toEqual([JSON.parse(`[0]`)]);
  });

  // line 2458: [range(3)] | .[1:nan]
  test(`[range(3)] | .[1:nan] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(3)] | .[1:nan]`, input);
    expect(result).toEqual([JSON.parse(`[1,2]`)]);
  });

  // line 2462: [range(3)] | .[nan]
  test(`[range(3)] | .[nan] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[range(3)] | .[nan]`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 2466: try ([range(3)] | .[nan] = 9) catch .
  test(`try ([range(3)] | .[nan] = 9) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try ([range(3)] | .[nan] = 9) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Cannot set array element at NaN index"`)]);
  });

  // line 2470: try ("foobar" | .[1.5:3.5] = "xyz") catch .
  test(`try ("foobar" | .[1.5:3.5] = "xyz") catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try ("foobar" | .[1.5:3.5] = "xyz") catch .`, input);
    expect(result).toEqual([JSON.parse(`"Cannot update string slices"`)]);
  });

  // line 2474: try ([range(10)] | .[1.5:3.5] = ["xyz"]) catch .
  test(`try ([range(10)] | .[1.5:3.5] = ["xyz"]) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try ([range(10)] | .[1.5:3.5] = ["xyz"]) catch .`, input);
    expect(result).toEqual([JSON.parse(`[0,"xyz",4,5,6,7,8,9]`)]);
  });

  // line 2478: try ("foobar" | .[1.5]) catch .
  test(`try ("foobar" | .[1.5]) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try ("foobar" | .[1.5]) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Cannot index string with number (1.5)"`)]);
  });

  // line 2529: foreach .[] as $x (0, 1; . + $x)
  test(`foreach .[] as \$x (0, 1; . + \$x) | [1, 2]`, () => {
    const input = JSON.parse(`[1, 2]`);
    const result = jq(`foreach .[] as \$x (0, 1; . + \$x)`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`3`), JSON.parse(`2`), JSON.parse(`4`)]);
  });

  // line 2549: reduce range(9999) as $_ ([];[.]) | tojson | fromjson | flatten
  test(`reduce range(9999) as \$_ ([];[.]) | tojson | fromjson | flatten | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`reduce range(9999) as \$_ ([];[.]) | tojson | fromjson | flatten`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 2554: reduce range(10000) as $_ ([];[.]) | tojson | try (fromjson) catch . | (contains("<skipped: too deep>") | not) and contains("Exceeds depth limit for parsing")
  test(`reduce range(10000) as \$_ ([];[.]) | tojson | try (fromjson) catch . | (contains("<skipped: too deep>") | not) and contains("Exceeds depth limit for parsing") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `reduce range(10000) as \$_ ([];[.]) | tojson | try (fromjson) catch . | (contains("<skipped: too deep>") | not) and contains("Exceeds depth limit for parsing")`,
      input,
    );
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 2559: reduce range(10001) as $_ ([];[.]) | tojson | contains("<skipped: too deep>")
  test(`reduce range(10001) as \$_ ([];[.]) | tojson | contains("<skipped: too deep>") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `reduce range(10001) as \$_ ([];[.]) | tojson | contains("<skipped: too deep>")`,
      input,
    );
    expect(result).toEqual([JSON.parse(`true`)]);
  });
});
