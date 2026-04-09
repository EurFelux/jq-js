// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: values', () => {
  // line 8: true
  test(`true | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`true`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 12: false
  test(`false | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`false`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 16: null
  test(`null | 42`, () => {
    const input = JSON.parse(`42`);
    const result = jq(`null`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 20: 1
  test(`1 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`1`, input);
    expect(result).toEqual([JSON.parse(`1`)]);
  });

  // line 25: -1
  test(`-1 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`-1`, input);
    expect(result).toEqual([JSON.parse(`-1`)]);
  });

  // line 29: # FIXME: much more number testing needed
  test(`# FIXME: much more number testing needed | `, () => {
    const input = JSON.parse(``);
    const result = jq(`# FIXME: much more number testing needed`, input);
    expect(result).toEqual([JSON.parse(`{}`), JSON.parse(`null`), JSON.parse(`{}`)]);
  });

  // line 35: []
  test(`[] | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 39: {x:-1},{x:-.},{x:-.|abs}
  test(`{x:-1},{x:-.},{x:-.|abs} | 1`, () => {
    const input = JSON.parse(`1`);
    const result = jq(`{x:-1},{x:-.},{x:-.|abs}`, input);
    expect(result).toEqual([JSON.parse(`{"x":-1}`), JSON.parse(`{"x":-1}`), JSON.parse(`{"x":1}`)]);
  });

  // line 48: .
  test(`. | ﻿"byte order mark"`, () => {
    const input = JSON.parse(`﻿"byte order mark"`);
    const result = jq(`.`, input);
    expect(result).toEqual([JSON.parse(`"byte order mark"`)]);
  });

});
