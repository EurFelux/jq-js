// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: errors", () => {
  // line 205: try ["OK", (.[] | error)] catch ["KO", .]
  test(`try ["OK", (.[] | error)] catch ["KO", .] | {"a":["b"],"c":["d"]}`, () => {
    const input = JSON.parse(`{"a":["b"],"c":["d"]}`);
    const result = jq(`try ["OK", (.[] | error)] catch ["KO", .]`, input);
    expect(result).toEqual([JSON.parse(`["KO",["b"]]`)]);
  });

  // line 1448: [.[]|try if . == 0 then error("foo") elif . == 1 then .a elif . == 2 then empty else . end catch .]
  test(`[.[]|try if . == 0 then error("foo") elif . == 1 then .a elif . == 2 then empty else . end catch .] | [0,1,2,3]`, () => {
    const input = JSON.parse(`[0,1,2,3]`);
    const result = jq(
      `[.[]|try if . == 0 then error("foo") elif . == 1 then .a elif . == 2 then empty else . end catch .]`,
      input,
    );
    expect(result).toEqual([JSON.parse(`["foo","Cannot index number with string (\\"a\\")",3]`)]);
  });

  // line 1452: [.[]|(.a, .a)?]
  test(`[.[]|(.a, .a)?] | [null,true,{"a":1}]`, () => {
    const input = JSON.parse(`[null,true,{"a":1}]`);
    const result = jq(`[.[]|(.a, .a)?]`, input);
    expect(result).toEqual([JSON.parse(`[null,null,1,1]`)]);
  });

  // line 1456: [[.[]|[.a,.a]]?]
  test(`[[.[]|[.a,.a]]?] | [null,true,{"a":1}]`, () => {
    const input = JSON.parse(`[null,true,{"a":1}]`);
    const result = jq(`[[.[]|[.a,.a]]?]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1460: [if error then 1 else 2 end?]
  test(`[if error then 1 else 2 end?] | "foo"`, () => {
    const input = JSON.parse(`"foo"`);
    const result = jq(`[if error then 1 else 2 end?]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1464: try error(0) // 1
  test(`try error(0) // 1 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try error(0) // 1`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 1468: 1, try error(2), 3
  test(`1, try error(2), 3 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1, try error(2), 3`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`3`)]);
  });

  // line 1473: 1 + try 2 catch 3 + 4
  test(`1 + try 2 catch 3 + 4 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1 + try 2 catch 3 + 4`, input);
    expect(result).toEqual([JSON.parse(`7`)]);
  });

  // line 1477: [-try .]
  test(`[-try .] | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`[-try .]`, input);
    expect(result).toEqual([JSON.parse(`[-1]`)]);
  });

  // line 1481: try -.? catch .
  test(`try -.? catch . | "foo"`, () => {
    const input = JSON.parse(`"foo"`);
    const result = jq(`try -.? catch .`, input);
    expect(result).toEqual([JSON.parse(`"string (\\"foo\\") cannot be negated"`)]);
  });

  // line 1485: {x: try 1, y: try error catch 2, z: if true then 3 end}
  test(`{x: try 1, y: try error catch 2, z: if true then 3 end} | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{x: try 1, y: try error catch 2, z: if true then 3 end}`, input);
    expect(result).toEqual([JSON.parse(`{"x":1,"y":2,"z":3}`)]);
  });

  // line 1489: {x: 1 + 2, y: false or true, z: null // 3}
  test(`{x: 1 + 2, y: false or true, z: null // 3} | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{x: 1 + 2, y: false or true, z: null // 3}`, input);
    expect(result).toEqual([JSON.parse(`{"x":3,"y":true,"z":3}`)]);
  });

  // line 1493: .[] | try error catch .
  test(`.[] | try error catch . | [1,null,2]`, () => {
    const input = JSON.parse(`[1,null,2]`);
    const result = jq(`.[] | try error catch .`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`null`), JSON.parse(`2`)]);
  });

  // line 1499: try error("\($__loc__)") catch .
  test(`try error("\\(\$__loc__)") catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try error("\\(\$__loc__)") catch .`, input);
    expect(result).toEqual([JSON.parse(`"{\\"file\\":\\"<top-level>\\",\\"line\\":1}"`)]);
  });

  // line 2337: "foo" | try ((try . catch "caught too much") | error) catch "caught just right"
  test(`"foo" | try ((try . catch "caught too much") | error) catch "caught just right" | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `"foo" | try ((try . catch "caught too much") | error) catch "caught just right"`,
      input,
    );
    expect(result).toEqual([JSON.parse(`"caught just right"`)]);
  });

  // line 2341: .[]|(try (if .=="hi" then . else error end) catch empty) | "\(.) there!"
  test(`.[]|(try (if .=="hi" then . else error end) catch empty) | "\\(.) there!" | ["hi","ho"]`, () => {
    const input = JSON.parse(`["hi","ho"]`);
    const result = jq(
      `.[]|(try (if .=="hi" then . else error end) catch empty) | "\\(.) there!"`,
      input,
    );
    expect(result).toEqual([JSON.parse(`"hi there!"`)]);
  });

  // line 2345: try (["hi","ho"]|.[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\(.) there!" end) catch "caught outside \(.)"
  test(`try (["hi","ho"]|.[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\\(.) there!" end) catch "caught outside \\(.)" | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(
      `try (["hi","ho"]|.[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\\(.) there!" end) catch "caught outside \\(.)"`,
      input,
    );
    expect(result).toEqual([JSON.parse(`"hi there!"`), JSON.parse(`"caught outside ho"`)]);
  });

  // line 2350: .[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\(.) there!" end
  test(`.[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\\(.) there!" end | ["hi","ho"]`, () => {
    const input = JSON.parse(`["hi","ho"]`);
    const result = jq(
      `.[]|(try . catch (if .=="ho" then "BROKEN"|error else empty end)) | if .=="ho" then error else "\\(.) there!" end`,
      input,
    );
    expect(result).toEqual([JSON.parse(`"hi there!"`)]);
  });

  // line 2354: try (try error catch "inner catch \(.)") catch "outer catch \(.)"
  test(`try (try error catch "inner catch \\(.)") catch "outer catch \\(.)" | "foo"`, () => {
    const input = JSON.parse(`"foo"`);
    const result = jq(`try (try error catch "inner catch \\(.)") catch "outer catch \\(.)"`, input);
    expect(result).toEqual([JSON.parse(`"inner catch foo"`)]);
  });

  // line 2358: try ((try error catch "inner catch \(.)")|error) catch "outer catch \(.)"
  test(`try ((try error catch "inner catch \\(.)")|error) catch "outer catch \\(.)" | "foo"`, () => {
    const input = JSON.parse(`"foo"`);
    const result = jq(
      `try ((try error catch "inner catch \\(.)")|error) catch "outer catch \\(.)"`,
      input,
    );
    expect(result).toEqual([JSON.parse(`"outer catch inner catch foo"`)]);
  });

  // line 2363: first(.?,.?)
  test(`first(.?,.?) | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`first(.?,.?)`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 2368: {foo: "bar"} | .foo |= .?
  test(`{foo: "bar"} | .foo |= .? | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`{foo: "bar"} | .foo |= .?`, input);
    expect(result).toEqual([JSON.parse(`{"foo": "bar"}`)]);
  });

  // line 2373: . |= try 2
  test(`. |= try 2 | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`. |= try 2`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 2377: . |= try 2 catch 3
  test(`. |= try 2 catch 3 | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`. |= try 2 catch 3`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 2381: .[] |= try tonumber
  test(`.[] |= try tonumber | ["1", "2a", "3", " 4", "5 ", "6.7", ".89", "-876", "+5.43", 21]`, () => {
    const input = JSON.parse(`["1", "2a", "3", " 4", "5 ", "6.7", ".89", "-876", "+5.43", 21]`);
    const result = jq(`.[] |= try tonumber`, input);
    expect(result).toEqual([JSON.parse(`[1, 3, 6.7, 0.89, -876, 5.43, 21]`)]);
  });

  // line 2386: any(keys[]|tostring?;true)
  test(`any(keys[]|tostring?;true) | {"a":"1","b":"2","c":"3"}`, () => {
    const input = JSON.parse(`{"a":"1","b":"2","c":"3"}`);
    const result = jq(`any(keys[]|tostring?;true)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });
});
