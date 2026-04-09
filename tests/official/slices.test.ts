// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: slices', () => {
  // line 466: [.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]]
  test(`[.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]] | [0,1,2,3,4,5,6]`, () => {
    const input = JSON.parse(`[0,1,2,3,4,5,6]`);
    const result = jq(`[.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]]`, input);
    expect(result).toEqual([JSON.parse(`[[], [2,3], [0,1,2,3,4], [5,6], [], []]`)]);
  });

  // line 470: [.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]]
  test(`[.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]] | "abcdefghi"`, () => {
    const input = JSON.parse(`"abcdefghi"`);
    const result = jq(`[.[3:2], .[-5:4], .[:-2], .[-2:], .[3:3][1:], .[10:]]`, input);
    expect(result).toEqual([JSON.parse(`["","","abcdefg","hi","",""]`)]);
  });

  // line 474: del(.[2:4],.[0],.[-2:])
  test(`del(.[2:4],.[0],.[-2:]) | [0,1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`[0,1,2,3,4,5,6,7]`);
    const result = jq(`del(.[2:4],.[0],.[-2:])`, input);
    expect(result).toEqual([JSON.parse(`[1,4,5]`)]);
  });

  // line 478: .[2:4] = ([], ["a","b"], ["a","b","c"])
  test(`.[2:4] = ([], ["a","b"], ["a","b","c"]) | [0,1,2,3,4,5,6,7]`, () => {
    const input = JSON.parse(`[0,1,2,3,4,5,6,7]`);
    const result = jq(`.[2:4] = ([], ["a","b"], ["a","b","c"])`, input);
    expect(result).toEqual([JSON.parse(`[0,1,4,5,6,7]`), JSON.parse(`[0,1,"a","b",4,5,6,7]`), JSON.parse(`[0,1,"a","b","c",4,5,6,7]`)]);
  });

});
