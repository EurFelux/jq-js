// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: recursion", () => {
  // line 889: def fac: if . == 1 then 1 else . * (. - 1 | fac) end; [.[] | fac]
  test(`def fac: if . == 1 then 1 else . * (. - 1 | fac) end; [.[] | fac] | [1,2,3,4]`, () => {
    const input = JSON.parse(`[1,2,3,4]`);
    const result = jq(`def fac: if . == 1 then 1 else . * (. - 1 | fac) end; [.[] | fac]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,6,24]`)]);
  });

  // line 1742: {"k": {"a": 1, "b": 2}} * .
  test(`{"k": {"a": 1, "b": 2}} * . | {"k": {"a": 0,"c": 3}}`, () => {
    const input = JSON.parse(`{"k": {"a": 0,"c": 3}}`);
    const result = jq(`{"k": {"a": 1, "b": 2}} * .`, input);
    expect(result).toEqual([JSON.parse(`{"k": {"a": 0, "b": 2, "c": 3}}`)]);
  });

  // line 1746: {"k": {"a": 1, "b": 2}, "hello": {"x": 1}} * .
  test(`{"k": {"a": 1, "b": 2}, "hello": {"x": 1}} * . | {"k": {"a": 0,"c": 3}, "hello": 1}`, () => {
    const input = JSON.parse(`{"k": {"a": 0,"c": 3}, "hello": 1}`);
    const result = jq(`{"k": {"a": 1, "b": 2}, "hello": {"x": 1}} * .`, input);
    expect(result).toEqual([JSON.parse(`{"k": {"a": 0, "b": 2, "c": 3}, "hello": 1}`)]);
  });

  // line 1750: {"k": {"a": 1, "b": 2}, "hello": 1} * .
  test(`{"k": {"a": 1, "b": 2}, "hello": 1} * . | {"k": {"a": 0,"c": 3}, "hello": {"x": 1}}`, () => {
    const input = JSON.parse(`{"k": {"a": 0,"c": 3}, "hello": {"x": 1}}`);
    const result = jq(`{"k": {"a": 1, "b": 2}, "hello": 1} * .`, input);
    expect(result).toEqual([JSON.parse(`{"k": {"a": 0, "b": 2, "c": 3}, "hello": {"x": 1}}`)]);
  });

  // line 1754: {"a": {"b": 1}, "c": {"d": 2}, "e": 5} * .
  test(`{"a": {"b": 1}, "c": {"d": 2}, "e": 5} * . | {"a": {"b": 2}, "c": {"d": 3, "f": 9}}`, () => {
    const input = JSON.parse(`{"a": {"b": 2}, "c": {"d": 3, "f": 9}}`);
    const result = jq(`{"a": {"b": 1}, "c": {"d": 2}, "e": 5} * .`, input);
    expect(result).toEqual([JSON.parse(`{"a": {"b": 2}, "c": {"d": 3, "f": 9}, "e": 5}`)]);
  });

  // line 1758: [.[]|arrays]
  test(`[.[]|arrays] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|arrays]`, input);
    expect(result).toEqual([JSON.parse(`[[],[3,[]]]`)]);
  });

  // line 1762: [.[]|objects]
  test(`[.[]|objects] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|objects]`, input);
    expect(result).toEqual([JSON.parse(`[{}]`)]);
  });

  // line 1766: [.[]|iterables]
  test(`[.[]|iterables] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|iterables]`, input);
    expect(result).toEqual([JSON.parse(`[[],[3,[]],{}]`)]);
  });

  // line 1770: [.[]|scalars]
  test(`[.[]|scalars] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|scalars]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,"foo",true,false,null]`)]);
  });

  // line 1774: [.[]|values]
  test(`[.[]|values] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|values]`, input);
    expect(result).toEqual([JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false]`)]);
  });

  // line 1778: [.[]|booleans]
  test(`[.[]|booleans] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|booleans]`, input);
    expect(result).toEqual([JSON.parse(`[true,false]`)]);
  });

  // line 1782: [.[]|nulls]
  test(`[.[]|nulls] | [1,2,"foo",[],[3,[]],{},true,false,null]`, () => {
    const input = JSON.parse(`[1,2,"foo",[],[3,[]],{},true,false,null]`);
    const result = jq(`[.[]|nulls]`, input);
    expect(result).toEqual([JSON.parse(`[null]`)]);
  });

  // line 1786: flatten
  test(`flatten | [0, [1], [[2]], [[[3]]]]`, () => {
    const input = JSON.parse(`[0, [1], [[2]], [[[3]]]]`);
    const result = jq(`flatten`, input);
    expect(result).toEqual([JSON.parse(`[0, 1, 2, 3]`)]);
  });

  // line 1790: flatten(0)
  test(`flatten(0) | [0, [1], [[2]], [[[3]]]]`, () => {
    const input = JSON.parse(`[0, [1], [[2]], [[[3]]]]`);
    const result = jq(`flatten(0)`, input);
    expect(result).toEqual([JSON.parse(`[0, [1], [[2]], [[[3]]]]`)]);
  });

  // line 1794: flatten(2)
  test(`flatten(2) | [0, [1], [[2]], [[[3]]]]`, () => {
    const input = JSON.parse(`[0, [1], [[2]], [[[3]]]]`);
    const result = jq(`flatten(2)`, input);
    expect(result).toEqual([JSON.parse(`[0, 1, 2, [3]]`)]);
  });

  // line 1798: flatten(2)
  test(`flatten(2) | [0, [1, [2]], [1, [[3], 2]]]`, () => {
    const input = JSON.parse(`[0, [1, [2]], [1, [[3], 2]]]`);
    const result = jq(`flatten(2)`, input);
    expect(result).toEqual([JSON.parse(`[0, 1, 2, 1, [3], 2]`)]);
  });

  // line 1802: try flatten(-1) catch .
  test(`try flatten(-1) catch . | [0, [1], [[2]], [[[3]]]]`, () => {
    const input = JSON.parse(`[0, [1], [[2]], [[[3]]]]`);
    const result = jq(`try flatten(-1) catch .`, input);
    expect(result).toEqual([JSON.parse(`"flatten depth must not be negative"`)]);
  });

  // line 1806: transpose
  test(`transpose | [[1], [2,3]]`, () => {
    const input = JSON.parse(`[[1], [2,3]]`);
    const result = jq(`transpose`, input);
    expect(result).toEqual([JSON.parse(`[[1,2],[null,3]]`)]);
  });

  // line 1810: transpose
  test(`transpose | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`transpose`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1814: ascii_upcase
  test(`ascii_upcase | "useful but not for é"`, () => {
    const input = JSON.parse(`"useful but not for é"`);
    const result = jq(`ascii_upcase`, input);
    expect(result).toEqual([JSON.parse(`"USEFUL BUT NOT FOR é"`)]);
  });

  // line 1818: bsearch(0,1,2,3,4)
  test(`bsearch(0,1,2,3,4) | [1,2,3]`, () => {
    const input = JSON.parse(`[1,2,3]`);
    const result = jq(`bsearch(0,1,2,3,4)`, input);
    expect(result).toEqual([
      JSON.parse(`-1`),
      JSON.parse(`0`),
      JSON.parse(`1`),
      JSON.parse(`2`),
      JSON.parse(`-4`),
    ]);
  });

  // line 1826: bsearch({x:1})
  test(`bsearch({x:1}) | [{ "x": 0 },{ "x": 1 },{ "x": 2 }]`, () => {
    const input = JSON.parse(`[{ "x": 0 },{ "x": 1 },{ "x": 2 }]`);
    const result = jq(`bsearch({x:1})`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 1830: try ["OK", bsearch(0)] catch ["KO",.]
  test(`try ["OK", bsearch(0)] catch ["KO",.] | "aa"`, () => {
    const input = JSON.parse(`"aa"`);
    const result = jq(`try ["OK", bsearch(0)] catch ["KO",.]`, input);
    expect(result).toEqual([JSON.parse(`["KO","string (\\"aa\\") cannot be searched from"]`)]);
  });

  // line 1834: strftime("%Y-%m-%dT%H:%M:%SZ")
  test(`strftime("%Y-%m-%dT%H:%M:%SZ") | [2015,2,5,23,51,47,4,63]`, () => {
    const input = JSON.parse(`[2015,2,5,23,51,47,4,63]`);
    const result = jq(`strftime("%Y-%m-%dT%H:%M:%SZ")`, input);
    expect(result).toEqual([JSON.parse(`"2015-03-05T23:51:47Z"`)]);
  });

  // line 1838: strftime("%A, %B %d, %Y")
  test(`strftime("%A, %B %d, %Y") | 1435677542.822351`, () => {
    const input = JSON.parse(`1435677542.822351`);
    const result = jq(`strftime("%A, %B %d, %Y")`, input);
    expect(result).toEqual([JSON.parse(`"Tuesday, June 30, 2015"`)]);
  });

  // line 1842: strftime("%Y-%m-%dT%H:%M:%SZ")
  test(`strftime("%Y-%m-%dT%H:%M:%SZ") | [2024,2,15]`, () => {
    const input = JSON.parse(`[2024,2,15]`);
    const result = jq(`strftime("%Y-%m-%dT%H:%M:%SZ")`, input);
    expect(result).toEqual([JSON.parse(`"2024-03-15T00:00:00Z"`)]);
  });

  // line 1846: mktime
  test(`mktime | [2024,8,21]`, () => {
    const input = JSON.parse(`[2024,8,21]`);
    const result = jq(`mktime`, input);
    expect(result).toEqual([JSON.parse(`1726876800`)]);
  });

  // line 1850: gmtime
  test(`gmtime | 1425599507`, () => {
    const input = JSON.parse(`1425599507`);
    const result = jq(`gmtime`, input);
    expect(result).toEqual([JSON.parse(`[2015,2,5,23,51,47,4,63]`)]);
  });

  // line 1854: gmtime[5]
  test(`gmtime[5] | 1425599507.25`, () => {
    const input = JSON.parse(`1425599507.25`);
    const result = jq(`gmtime[5]`, input);
    expect(result).toEqual([JSON.parse(`47.25`)]);
  });
});
