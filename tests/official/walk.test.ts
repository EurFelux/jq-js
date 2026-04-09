// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from "vitest";
import { jq } from "../../src/index.js";

describe("jq official: walk", () => {
  // line 2407: walk(.)
  test(`walk(.) | {"x":0}`, () => {
    const input = JSON.parse(`{"x":0}`);
    const result = jq(`walk(.)`, input);
    expect(result).toEqual([JSON.parse(`{"x":0}`)]);
  });

  // line 2411: walk(1)
  test(`walk(1) | {"x":0}`, () => {
    const input = JSON.parse(`{"x":0}`);
    const result = jq(`walk(1)`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });
});
