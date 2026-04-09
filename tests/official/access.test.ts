// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: access', () => {
  // line 148: .foo
  test(`.foo | {"foo": 42, "bar": 43}`, () => {
    const input = JSON.parse(`{"foo": 42, "bar": 43}`);
    const result = jq(`.foo`, input);
    expect(result).toEqual([JSON.parse(`42`)]);
  });

  // line 152: .foo | .bar
  test(`.foo | .bar | {"foo": {"bar": 42}, "bar": "badvalue"}`, () => {
    const input = JSON.parse(`{"foo": {"bar": 42}, "bar": "badvalue"}`);
    const result = jq(`.foo | .bar`, input);
    expect(result).toEqual([JSON.parse(`42`)]);
  });

  // line 156: .foo.bar
  test(`.foo.bar | {"foo": {"bar": 42}, "bar": "badvalue"}`, () => {
    const input = JSON.parse(`{"foo": {"bar": 42}, "bar": "badvalue"}`);
    const result = jq(`.foo.bar`, input);
    expect(result).toEqual([JSON.parse(`42`)]);
  });

  // line 160: .foo_bar
  test(`.foo_bar | {"foo_bar": 2}`, () => {
    const input = JSON.parse(`{"foo_bar": 2}`);
    const result = jq(`.foo_bar`, input);
    expect(result).toEqual([JSON.parse(`2`)]);
  });

  // line 164: .["foo"].bar
  test(`.["foo"].bar | {"foo": {"bar": 42}, "bar": "badvalue"}`, () => {
    const input = JSON.parse(`{"foo": {"bar": 42}, "bar": "badvalue"}`);
    const result = jq(`.["foo"].bar`, input);
    expect(result).toEqual([JSON.parse(`42`)]);
  });

  // line 168: ."foo"."bar"
  test(`."foo"."bar" | {"foo": {"bar": 20}}`, () => {
    const input = JSON.parse(`{"foo": {"bar": 20}}`);
    const result = jq(`."foo"."bar"`, input);
    expect(result).toEqual([JSON.parse(`20`)]);
  });

  // line 172: .e0, .E1, .E-1, .E+1
  test(`.e0, .E1, .E-1, .E+1 | {"e0": 1, "E1": 2, "E": 3}`, () => {
    const input = JSON.parse(`{"e0": 1, "E1": 2, "E": 3}`);
    const result = jq(`.e0, .E1, .E-1, .E+1`, input);
    expect(result).toEqual([JSON.parse(`1`), JSON.parse(`2`), JSON.parse(`2`), JSON.parse(`4`)]);
  });

  // line 179: [.[]|.foo?]
  test(`[.[]|.foo?] | [1,[2],{"foo":3,"bar":4},{},{"foo":5}]`, () => {
    const input = JSON.parse(`[1,[2],{"foo":3,"bar":4},{},{"foo":5}]`);
    const result = jq(`[.[]|.foo?]`, input);
    expect(result).toEqual([JSON.parse(`[3,null,5]`)]);
  });

  // line 183: [.[]|.foo?.bar?]
  test(`[.[]|.foo?.bar?] | [1,[2],[],{"foo":3},{"foo":{"bar":4}},{}]`, () => {
    const input = JSON.parse(`[1,[2],[],{"foo":3},{"foo":{"bar":4}},{}]`);
    const result = jq(`[.[]|.foo?.bar?]`, input);
    expect(result).toEqual([JSON.parse(`[4,null]`)]);
  });

  // line 187: [..]
  test(`[..] | [1,[[2]],{ "a":[1]}]`, () => {
    const input = JSON.parse(`[1,[[2]],{ "a":[1]}]`);
    const result = jq(`[..]`, input);
    expect(result).toEqual([JSON.parse(`[[1,[[2]],{"a":[1]}],1,[[2]],[2],2,{"a":[1]},[1],1]`)]);
  });

  // line 191: [.[]|.[]?]
  test(`[.[]|.[]?] | [1,null,[],[1,[2,[[3]]]],[{}],[{"a":[1,[2]]}]]`, () => {
    const input = JSON.parse(`[1,null,[],[1,[2,[[3]]]],[{}],[{"a":[1,[2]]}]]`);
    const result = jq(`[.[]|.[]?]`, input);
    expect(result).toEqual([JSON.parse(`[1,[2,[[3]]],{},{"a":[1,[2]]}]`)]);
  });

  // line 195: [.[]|.[1:3]?]
  test(`[.[]|.[1:3]?] | [1,null,true,false,"abcdef",{},{"a":1,"b":2},[],[1,2,3,4,5],[1,2]]`, () => {
    const input = JSON.parse(`[1,null,true,false,"abcdef",{},{"a":1,"b":2},[],[1,2,3,4,5],[1,2]]`);
    const result = jq(`[.[]|.[1:3]?]`, input);
    expect(result).toEqual([JSON.parse(`[null,"bc",[],[2,3],[2]]`)]);
  });

  // line 200: map(try .a[] catch ., try .a.[] catch ., .a[]?, .a.[]?)
  test(`map(try .a[] catch ., try .a.[] catch ., .a[]?, .a.[]?) | [{"a": [1,2]}, {"a": 123}]`, () => {
    const input = JSON.parse(`[{"a": [1,2]}, {"a": 123}]`);
    const result = jq(`map(try .a[] catch ., try .a.[] catch ., .a[]?, .a.[]?)`, input);
    expect(result).toEqual([JSON.parse(`[1,2,1,2,1,2,1,2,"Cannot iterate over number (123)","Cannot iterate over number (123)"]`)]);
  });

  // line 213: try (.foo[-1] = 0) catch .
  test(`try (.foo[-1] = 0) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try (.foo[-1] = 0) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Out of bounds negative array index"`)]);
  });

  // line 217: try (.foo[-2] = 0) catch .
  test(`try (.foo[-2] = 0) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try (.foo[-2] = 0) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Out of bounds negative array index"`)]);
  });

  // line 221: .[-1] = 5
  test(`.[-1] = 5 | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`.[-1] = 5`, input);
    expect(result).toEqual([JSON.parse(`[0,1,5]`)]);
  });

  // line 225: .[-2] = 5
  test(`.[-2] = 5 | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`.[-2] = 5`, input);
    expect(result).toEqual([JSON.parse(`[0,5,2]`)]);
  });

  // line 229: try (.[999999999] = 0) catch .
  test(`try (.[999999999] = 0) catch . | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`try (.[999999999] = 0) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Array index too large"`)]);
  });

});
