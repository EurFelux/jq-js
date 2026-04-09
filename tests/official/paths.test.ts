// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: paths", () => {
  // line 1110: path(.foo[0,1])
  test(`path(.foo[0,1]) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`path(.foo[0,1])`, input);
    expect(result).toEqual([JSON.parse(`["foo", 0]`), JSON.parse(`["foo", 1]`)]);
  });

  // line 1115: path(.[] | select(.>3))
  test(`path(.[] | select(.>3)) | [1,5,3]`, () => {
    const input = JSON.parse(`[1,5,3]`);
    const result = jq(`path(.[] | select(.>3))`, input);
    expect(result).toEqual([JSON.parse(`[1]`)]);
  });

  // line 1119: path(.)
  test(`path(.) | 42`, () => {
    const input = JSON.parse(`42`);
    const result = jq(`path(.)`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1123: try path(.a | map(select(.b == 0))) catch .
  test(`try path(.a | map(select(.b == 0))) catch . | {"a":[{"b":0}]}`, () => {
    const input = JSON.parse(`{"a":[{"b":0}]}`);
    const result = jq(`try path(.a | map(select(.b == 0))) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Invalid path expression with result [{\\"b\\":0}]"`)]);
  });

  // line 1127: try path(.a | map(select(.b == 0)) | .[0]) catch .
  test(`try path(.a | map(select(.b == 0)) | .[0]) catch . | {"a":[{"b":0}]}`, () => {
    const input = JSON.parse(`{"a":[{"b":0}]}`);
    const result = jq(`try path(.a | map(select(.b == 0)) | .[0]) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"Invalid path expression near attempt to access element 0 of [{\\"b\\":0}]"`),
    ]);
  });

  // line 1131: try path(.a | map(select(.b == 0)) | .c) catch .
  test(`try path(.a | map(select(.b == 0)) | .c) catch . | {"a":[{"b":0}]}`, () => {
    const input = JSON.parse(`{"a":[{"b":0}]}`);
    const result = jq(`try path(.a | map(select(.b == 0)) | .c) catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"Invalid path expression near attempt to access element \\"c\\" of [{\\"b\\":0}]"`,
      ),
    ]);
  });

  // line 1135: try path(.a | map(select(.b == 0)) | .[]) catch .
  test(`try path(.a | map(select(.b == 0)) | .[]) catch . | {"a":[{"b":0}]}`, () => {
    const input = JSON.parse(`{"a":[{"b":0}]}`);
    const result = jq(`try path(.a | map(select(.b == 0)) | .[]) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"Invalid path expression near attempt to iterate through [{\\"b\\":0}]"`),
    ]);
  });

  // line 1139: path(.a[path(.b)[0]])
  test(`path(.a[path(.b)[0]]) | {"a":{"b":0}}`, () => {
    const input = JSON.parse(`{"a":{"b":0}}`);
    const result = jq(`path(.a[path(.b)[0]])`, input);
    expect(result).toEqual([JSON.parse(`["a","b"]`)]);
  });

  // line 1143: [paths]
  test(`[paths] | [1,[[],{"a":2}]]`, () => {
    const input = JSON.parse(`[1,[[],{"a":2}]]`);
    const result = jq(`[paths]`, input);
    expect(result).toEqual([JSON.parse(`[[0],[1],[1,0],[1,1],[1,1,"a"]]`)]);
  });

  // line 1147: ["foo",1] as $p | getpath($p), setpath($p; 20), delpaths([$p])
  test(`["foo",1] as \$p | getpath(\$p), setpath(\$p; 20), delpaths([\$p]) | {"bar": 42, "foo": ["a", "b", "c", "d"]}`, () => {
    const input = JSON.parse(`{"bar": 42, "foo": ["a", "b", "c", "d"]}`);
    const result = jq(`["foo",1] as \$p | getpath(\$p), setpath(\$p; 20), delpaths([\$p])`, input);
    expect(result).toEqual([
      JSON.parse(`"b"`),
      JSON.parse(`{"bar": 42, "foo": ["a", 20, "c", "d"]}`),
      JSON.parse(`{"bar": 42, "foo": ["a", "c", "d"]}`),
    ]);
  });

  // line 1153: map(getpath([2])), map(setpath([2]; 42)), map(delpaths([[2]]))
  test(`map(getpath([2])), map(setpath([2]; 42)), map(delpaths([[2]])) | [[0], [0,1], [0,1,2]]`, () => {
    const input = JSON.parse(`[[0], [0,1], [0,1,2]]`);
    const result = jq(`map(getpath([2])), map(setpath([2]; 42)), map(delpaths([[2]]))`, input);
    expect(result).toEqual([
      JSON.parse(`[null, null, 2]`),
      JSON.parse(`[[0,null,42], [0,1,42], [0,1,42]]`),
      JSON.parse(`[[0], [0,1], [0,1]]`),
    ]);
  });

  // line 1159: map(delpaths([[0,"foo"]]))
  test(`map(delpaths([[0,"foo"]])) | [[{"foo":2, "x":1}], [{"bar":2}]]`, () => {
    const input = JSON.parse(`[[{"foo":2, "x":1}], [{"bar":2}]]`);
    const result = jq(`map(delpaths([[0,"foo"]]))`, input);
    expect(result).toEqual([JSON.parse(`[[{"x":1}], [{"bar":2}]]`)]);
  });

  // line 1163: ["foo",1] as $p | getpath($p), setpath($p; 20), delpaths([$p])
  test(`["foo",1] as \$p | getpath(\$p), setpath(\$p; 20), delpaths([\$p]) | {"bar":false}`, () => {
    const input = JSON.parse(`{"bar":false}`);
    const result = jq(`["foo",1] as \$p | getpath(\$p), setpath(\$p; 20), delpaths([\$p])`, input);
    expect(result).toEqual([
      JSON.parse(`null`),
      JSON.parse(`{"bar":false, "foo": [null, 20]}`),
      JSON.parse(`{"bar":false}`),
    ]);
  });

  // line 1169: delpaths([[-200]])
  test(`delpaths([[-200]]) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`delpaths([[-200]])`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 1173: try delpaths(0) catch .
  test(`try delpaths(0) catch . | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`try delpaths(0) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Paths must be specified as an array"`)]);
  });

  // line 1177: del(.), del(empty), del((.foo,.bar,.baz) | .[2,3,0]), del(.foo[0], .bar[0], .foo, .baz.bar[0].x)
  test(`del(.), del(empty), del((.foo,.bar,.baz) | .[2,3,0]), del(.foo[0], .bar[0], .foo, .baz.bar[0].x) | {"foo": [0,1,2,3,4], "bar": [0,1]}`, () => {
    const input = JSON.parse(`{"foo": [0,1,2,3,4], "bar": [0,1]}`);
    const result = jq(
      `del(.), del(empty), del((.foo,.bar,.baz) | .[2,3,0]), del(.foo[0], .bar[0], .foo, .baz.bar[0].x)`,
      input,
    );
    expect(result).toEqual([
      JSON.parse(`null`),
      JSON.parse(`{"foo": [0,1,2,3,4], "bar": [0,1]}`),
      JSON.parse(`{"foo": [1,4], "bar": [1]}`),
      JSON.parse(`{"bar": [1]}`),
    ]);
  });

  // line 1184: del(.[1], .[-6], .[2], .[-3:9])
  test(`del(.[1], .[-6], .[2], .[-3:9]) | [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`, () => {
    const input = JSON.parse(`[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]`);
    const result = jq(`del(.[1], .[-6], .[2], .[-3:9])`, input);
    expect(result).toEqual([JSON.parse(`[0, 3, 5, 6, 9]`)]);
  });

  // line 1188: del(.[nan])
  test(`del(.[nan]) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`del(.[nan])`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 1192: del(.[nan,nan])
  test(`del(.[nan,nan]) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`del(.[nan,nan])`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3]`)]);
  });

  // line 1197: setpath([-1]; 1)
  test(`setpath([-1]; 1) | [0]`, () => {
    const input = JSON.parse(`[0]`);
    const result = jq(`setpath([-1]; 1)`, input);
    expect(result).toEqual([JSON.parse(`[1]`)]);
  });

  // line 1201: pick(.a.b.c)
  test(`pick(.a.b.c) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`pick(.a.b.c)`, input);
    expect(result).toEqual([JSON.parse(`{"a":{"b":{"c":null}}}`)]);
  });

  // line 1205: pick(first)
  test(`pick(first) | [1,2]`, () => {
    const input = JSON.parse(`[1,2]`);
    const result = jq(`pick(first)`, input);
    expect(result).toEqual([JSON.parse(`[1]`)]);
  });

  // line 1209: pick(first|first)
  test(`pick(first|first) | [[10,20],30]`, () => {
    const input = JSON.parse(`[[10,20],30]`);
    const result = jq(`pick(first|first)`, input);
    expect(result).toEqual([JSON.parse(`[[10]]`)]);
  });

  // line 1214: try pick(last) catch .
  test(`try pick(last) catch . | [1,2]`, () => {
    const input = JSON.parse(`[1,2]`);
    const result = jq(`try pick(last) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Out of bounds negative array index"`)]);
  });

  // line 1221: .message = "goodbye"
  test(`.message = "goodbye" | {"message": "hello"}`, () => {
    const input = JSON.parse(`{"message": "hello"}`);
    const result = jq(`.message = "goodbye"`, input);
    expect(result).toEqual([JSON.parse(`{"message": "goodbye"}`)]);
  });

  // line 1225: .foo = .bar
  test(`.foo = .bar | {"bar":42}`, () => {
    const input = JSON.parse(`{"bar":42}`);
    const result = jq(`.foo = .bar`, input);
    expect(result).toEqual([JSON.parse(`{"foo":42, "bar":42}`)]);
  });

  // line 1229: .foo |= .+1
  test(`.foo |= .+1 | {"foo": 42}`, () => {
    const input = JSON.parse(`{"foo": 42}`);
    const result = jq(`.foo |= .+1`, input);
    expect(result).toEqual([JSON.parse(`{"foo": 43}`)]);
  });

  // line 1233: .[] += 2, .[] *= 2, .[] -= 2, .[] /= 2, .[] %=2
  test(`.[] += 2, .[] *= 2, .[] -= 2, .[] /= 2, .[] %=2 | [1,3,5]`, () => {
    const input = JSON.parse(`[1,3,5]`);
    const result = jq(`.[] += 2, .[] *= 2, .[] -= 2, .[] /= 2, .[] %=2`, input);
    expect(result).toEqual([
      JSON.parse(`[3,5,7]`),
      JSON.parse(`[2,6,10]`),
      JSON.parse(`[-1,1,3]`),
      JSON.parse(`[0.5, 1.5, 2.5]`),
      JSON.parse(`[1,1,1]`),
    ]);
  });

  // line 1241: [.[] % 7]
  test(`[.[] % 7] | [-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`[-7,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,7]`);
    const result = jq(`[.[] % 7]`, input);
    expect(result).toEqual([JSON.parse(`[0,-6,-5,-4,-3,-2,-1,0,1,2,3,4,5,6,0]`)]);
  });

  // line 1245: .foo += .foo
  test(`.foo += .foo | {"foo":2}`, () => {
    const input = JSON.parse(`{"foo":2}`);
    const result = jq(`.foo += .foo`, input);
    expect(result).toEqual([JSON.parse(`{"foo":4}`)]);
  });

  // line 1249: .[0].a |= {"old":., "new":(.+1)}
  test(`.[0].a |= {"old":., "new":(.+1)} | [{"a":1,"b":2}]`, () => {
    const input = JSON.parse(`[{"a":1,"b":2}]`);
    const result = jq(`.[0].a |= {"old":., "new":(.+1)}`, input);
    expect(result).toEqual([JSON.parse(`[{"a":{"old":1, "new":2},"b":2}]`)]);
  });

  // line 1253: def inc(x): x |= .+1; inc(.[].a)
  test(`def inc(x): x |= .+1; inc(.[].a) | [{"a":1,"b":2},{"a":2,"b":4},{"a":7,"b":8}]`, () => {
    const input = JSON.parse(`[{"a":1,"b":2},{"a":2,"b":4},{"a":7,"b":8}]`);
    const result = jq(`def inc(x): x |= .+1; inc(.[].a)`, input);
    expect(result).toEqual([JSON.parse(`[{"a":2,"b":2},{"a":3,"b":4},{"a":8,"b":8}]`)]);
  });

  // line 1258: .[] | try (getpath(["a",0,"b"]) |= 5) catch .
  test(`.[] | try (getpath(["a",0,"b"]) |= 5) catch . | [null,{"b":0},{"a":0},{"a":null},{"a":[0,1]},{"a":{"b":1}},{"a":[{}]},{"a":[{"c":3}]}]`, () => {
    const input = JSON.parse(
      `[null,{"b":0},{"a":0},{"a":null},{"a":[0,1]},{"a":{"b":1}},{"a":[{}]},{"a":[{"c":3}]}]`,
    );
    const result = jq(`.[] | try (getpath(["a",0,"b"]) |= 5) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`{"a":[{"b":5}]}`),
      JSON.parse(`{"b":0,"a":[{"b":5}]}`),
      JSON.parse(`"Cannot index number with number (0)"`),
      JSON.parse(`{"a":[{"b":5}]}`),
      JSON.parse(`"Cannot index number with string (\\"b\\")"`),
      JSON.parse(`"Cannot index object with number (0)"`),
      JSON.parse(`{"a":[{"b":5}]}`),
      JSON.parse(`{"a":[{"c":3,"b":5}]}`),
    ]);
  });

  // line 1270: (.[] | select(. >= 2)) |= empty
  test(`(.[] | select(. >= 2)) |= empty | [1,5,3,0,7]`, () => {
    const input = JSON.parse(`[1,5,3,0,7]`);
    const result = jq(`(.[] | select(. >= 2)) |= empty`, input);
    expect(result).toEqual([JSON.parse(`[1,0]`)]);
  });

  // line 1274: .[] |= select(. % 2 == 0)
  test(`.[] |= select(. % 2 == 0) | [0,1,2,3,4,5]`, () => {
    const input = JSON.parse(`[0,1,2,3,4,5]`);
    const result = jq(`.[] |= select(. % 2 == 0)`, input);
    expect(result).toEqual([JSON.parse(`[0,2,4]`)]);
  });

  // line 1278: .foo[1,4,2,3] |= empty
  test(`.foo[1,4,2,3] |= empty | {"foo":[0,1,2,3,4,5]}`, () => {
    const input = JSON.parse(`{"foo":[0,1,2,3,4,5]}`);
    const result = jq(`.foo[1,4,2,3] |= empty`, input);
    expect(result).toEqual([JSON.parse(`{"foo":[0,5]}`)]);
  });

  // line 1282: .[2][3] = 1
  test(`.[2][3] = 1 | [4]`, () => {
    const input = JSON.parse(`[4]`);
    const result = jq(`.[2][3] = 1`, input);
    expect(result).toEqual([JSON.parse(`[4, null, [null, null, null, 1]]`)]);
  });

  // line 1286: .foo[2].bar = 1
  test(`.foo[2].bar = 1 | {"foo":[11], "bar":42}`, () => {
    const input = JSON.parse(`{"foo":[11], "bar":42}`);
    const result = jq(`.foo[2].bar = 1`, input);
    expect(result).toEqual([JSON.parse(`{"foo":[11,null,{"bar":1}], "bar":42}`)]);
  });

  // line 1290: try ((map(select(.a == 1))[].b) = 10) catch .
  test(`try ((map(select(.a == 1))[].b) = 10) catch . | [{"a":0},{"a":1}]`, () => {
    const input = JSON.parse(`[{"a":0},{"a":1}]`);
    const result = jq(`try ((map(select(.a == 1))[].b) = 10) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"Invalid path expression near attempt to iterate through [{\\"a\\":1}]"`),
    ]);
  });

  // line 1294: try ((map(select(.a == 1))[].a) |= .+1) catch .
  test(`try ((map(select(.a == 1))[].a) |= .+1) catch . | [{"a":0},{"a":1}]`, () => {
    const input = JSON.parse(`[{"a":0},{"a":1}]`);
    const result = jq(`try ((map(select(.a == 1))[].a) |= .+1) catch .`, input);
    expect(result).toEqual([
      JSON.parse(`"Invalid path expression near attempt to iterate through [{\\"a\\":1}]"`),
    ]);
  });

  // line 1298: def x: .[1,2]; x=10
  test(`def x: .[1,2]; x=10 | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`def x: .[1,2]; x=10`, input);
    expect(result).toEqual([JSON.parse(`[0,10,10]`)]);
  });

  // line 1302: try (def x: reverse; x=10) catch .
  test(`try (def x: reverse; x=10) catch . | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`try (def x: reverse; x=10) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Invalid path expression with result [2,1,0]"`)]);
  });

  // line 1306: .[] = 1
  test(`.[] = 1 | [1,null,Infinity,-Infinity,NaN,-NaN]`, () => {
    const input = (() => {
      const nan = NaN,
        NaN_ = NaN;
      return [1, null, Infinity, -Infinity, NaN, NaN];
    })();
    const result = jq(`.[] = 1`, input);
    expect(result).toEqual([JSON.parse(`[1,1,1,1,1,1]`)]);
  });

  // line 1314: [.[] | if .foo then "yep" else "nope" end]
  test(`[.[] | if .foo then "yep" else "nope" end] | [{"foo":0},{"foo":1},{"foo":[]},{"foo":true},{"foo":false},{"foo":null},{"foo":"foo"},{}]`, () => {
    const input = JSON.parse(
      `[{"foo":0},{"foo":1},{"foo":[]},{"foo":true},{"foo":false},{"foo":null},{"foo":"foo"},{}]`,
    );
    const result = jq(`[.[] | if .foo then "yep" else "nope" end]`, input);
    expect(result).toEqual([JSON.parse(`["yep","yep","yep","yep","nope","nope","yep","nope"]`)]);
  });

  // line 1318: [.[] | if .baz then "strange" elif .foo then "yep" else "nope" end]
  test(`[.[] | if .baz then "strange" elif .foo then "yep" else "nope" end] | [{"foo":0},{"foo":1},{"foo":[]},{"foo":true},{"foo":false},{"foo":null},{"foo":"foo"},{}]`, () => {
    const input = JSON.parse(
      `[{"foo":0},{"foo":1},{"foo":[]},{"foo":true},{"foo":false},{"foo":null},{"foo":"foo"},{}]`,
    );
    const result = jq(`[.[] | if .baz then "strange" elif .foo then "yep" else "nope" end]`, input);
    expect(result).toEqual([JSON.parse(`["yep","yep","yep","yep","nope","nope","yep","nope"]`)]);
  });

  // line 1322: [if 1,null,2 then 3 else 4 end]
  test(`[if 1,null,2 then 3 else 4 end] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[if 1,null,2 then 3 else 4 end]`, input);
    expect(result).toEqual([JSON.parse(`[3,4,3]`)]);
  });

  // line 1326: [if empty then 3 else 4 end]
  test(`[if empty then 3 else 4 end] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[if empty then 3 else 4 end]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1330: [if 1 then 3,4 else 5 end]
  test(`[if 1 then 3,4 else 5 end] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[if 1 then 3,4 else 5 end]`, input);
    expect(result).toEqual([JSON.parse(`[3,4]`)]);
  });

  // line 1334: [if null then 3 else 5,6 end]
  test(`[if null then 3 else 5,6 end] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[if null then 3 else 5,6 end]`, input);
    expect(result).toEqual([JSON.parse(`[5,6]`)]);
  });

  // line 1338: [if true then 3 end]
  test(`[if true then 3 end] | 7`, () => {
    const input = JSON.parse(`7`);
    const result = jq(`[if true then 3 end]`, input);
    expect(result).toEqual([JSON.parse(`[3]`)]);
  });

  // line 1342: [if false then 3 end]
  test(`[if false then 3 end] | 7`, () => {
    const input = JSON.parse(`7`);
    const result = jq(`[if false then 3 end]`, input);
    expect(result).toEqual([JSON.parse(`[7]`)]);
  });

  // line 1346: [if false then 3 else . end]
  test(`[if false then 3 else . end] | 7`, () => {
    const input = JSON.parse(`7`);
    const result = jq(`[if false then 3 else . end]`, input);
    expect(result).toEqual([JSON.parse(`[7]`)]);
  });

  // line 1350: [if false then 3 elif false then 4 end]
  test(`[if false then 3 elif false then 4 end] | 7`, () => {
    const input = JSON.parse(`7`);
    const result = jq(`[if false then 3 elif false then 4 end]`, input);
    expect(result).toEqual([JSON.parse(`[7]`)]);
  });

  // line 1354: [if false then 3 elif false then 4 else . end]
  test(`[if false then 3 elif false then 4 else . end] | 7`, () => {
    const input = JSON.parse(`7`);
    const result = jq(`[if false then 3 elif false then 4 else . end]`, input);
    expect(result).toEqual([JSON.parse(`[7]`)]);
  });

  // line 1358: [-if true then 1 else 2 end]
  test(`[-if true then 1 else 2 end] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[-if true then 1 else 2 end]`, input);
    expect(result).toEqual([JSON.parse(`[-1]`)]);
  });

  // line 1362: {x: if true then 1 else 2 end}
  test(`{x: if true then 1 else 2 end} | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{x: if true then 1 else 2 end}`, input);
    expect(result).toEqual([JSON.parse(`{"x":1}`)]);
  });

  // line 1366: if true then [.] else . end []
  test(`if true then [.] else . end [] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`if true then [.] else . end []`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 1370: [.[] | [.foo[] // .bar]]
  test(`[.[] | [.foo[] // .bar]] | [{"foo":[1,2], "bar": 42}, {"foo":[1], "bar": null}, {"foo":[null,false,3], "bar": 18}, {"foo":[], "bar":42}, {"foo": [null,false,null], "bar": 41}]`, () => {
    const input = JSON.parse(
      `[{"foo":[1,2], "bar": 42}, {"foo":[1], "bar": null}, {"foo":[null,false,3], "bar": 18}, {"foo":[], "bar":42}, {"foo": [null,false,null], "bar": 41}]`,
    );
    const result = jq(`[.[] | [.foo[] // .bar]]`, input);
    expect(result).toEqual([JSON.parse(`[[1,2], [1], [3], [42], [41]]`)]);
  });

  // line 1374: .[] //= .[0]
  test(`.[] //= .[0] | ["hello",true,false,[false],null]`, () => {
    const input = JSON.parse(`["hello",true,false,[false],null]`);
    const result = jq(`.[] //= .[0]`, input);
    expect(result).toEqual([JSON.parse(`["hello",true,"hello",[false],"hello"]`)]);
  });

  // line 1378: .[] | [.[0] and .[1], .[0] or .[1]]
  test(`.[] | [.[0] and .[1], .[0] or .[1]] | [[true,[]], [false,1], [42,null], [null,false]]`, () => {
    const input = JSON.parse(`[[true,[]], [false,1], [42,null], [null,false]]`);
    const result = jq(`.[] | [.[0] and .[1], .[0] or .[1]]`, input);
    expect(result).toEqual([
      JSON.parse(`[true,true]`),
      JSON.parse(`[false,true]`),
      JSON.parse(`[false,true]`),
      JSON.parse(`[false,false]`),
    ]);
  });

  // line 1385: [.[] | not]
  test(`[.[] | not] | [1,0,false,null,true,"hello"]`, () => {
    const input = JSON.parse(`[1,0,false,null,true,"hello"]`);
    const result = jq(`[.[] | not]`, input);
    expect(result).toEqual([JSON.parse(`[false,false,true,true,false,false]`)]);
  });

  // line 1390: [10 > 0, 10 > 10, 10 > 20, 10 < 0, 10 < 10, 10 < 20]
  test(`[10 > 0, 10 > 10, 10 > 20, 10 < 0, 10 < 10, 10 < 20] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`[10 > 0, 10 > 10, 10 > 20, 10 < 0, 10 < 10, 10 < 20]`, input);
    expect(result).toEqual([JSON.parse(`[true,false,false,false,false,true]`)]);
  });

  // line 1394: [10 >= 0, 10 >= 10, 10 >= 20, 10 <= 0, 10 <= 10, 10 <= 20]
  test(`[10 >= 0, 10 >= 10, 10 >= 20, 10 <= 0, 10 <= 10, 10 <= 20] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`[10 >= 0, 10 >= 10, 10 >= 20, 10 <= 0, 10 <= 10, 10 <= 20]`, input);
    expect(result).toEqual([JSON.parse(`[true,true,false,false,true,true]`)]);
  });

  // line 2485: try ["ok", setpath([1]; 1)] catch ["ko", .]
  test(`try ["ok", setpath([1]; 1)] catch ["ko", .] | {"hi":"hello"}`, () => {
    const input = JSON.parse(`{"hi":"hello"}`);
    const result = jq(`try ["ok", setpath([1]; 1)] catch ["ko", .]`, input);
    expect(result).toEqual([JSON.parse(`["ko","Cannot index object with number (1)"]`)]);
  });

  // line 2489: try fromjson catch .
  test(`try fromjson catch . | "{'a': 123}"`, () => {
    const input = JSON.parse(`"{'a': 123}"`);
    const result = jq(`try fromjson catch .`, input);
    expect(result).toEqual([
      JSON.parse(
        `"Invalid string literal; expected \\", but got ' at line 1, column 5 (while parsing '{'a': 123}')"`,
      ),
    ]);
  });

  // line 2524: try ["OK", setpath([[1]]; 1)] catch ["KO", .]
  test(`try ["OK", setpath([[1]]; 1)] catch ["KO", .] | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`try ["OK", setpath([[1]]; 1)] catch ["KO", .]`, input);
    expect(result).toEqual([JSON.parse(`["KO","Cannot update field at array index of array"]`)]);
  });
});
