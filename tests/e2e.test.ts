import { describe, expect, test } from 'vitest';
import { jq } from '../src/index.js';

describe('jq-js e2e', () => {
  // Identity
  test.each([
    ['.', 42, [42]],
    ['.', 'hello', ['hello']],
    ['.', null, [null]],
    ['.', { a: 1 }, [{ a: 1 }]],
    ['.', [1, 2, 3], [[1, 2, 3]]],
  ])('identity: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Field access
  test.each([
    ['.a', { a: 1 }, [1]],
    ['.a', { a: null }, [null]],
    ['.a', { b: 1 }, [null]],
    ['.a.b', { a: { b: 2 } }, [2]],
    ['.a.b.c', { a: { b: { c: 3 } } }, [3]],
  ])('field access: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Array index
  test.each([
    ['.[0]', [1, 2, 3], [1]],
    ['.[1]', [1, 2, 3], [2]],
    ['.[-1]', [1, 2, 3], [3]],
    ['.[-2]', [1, 2, 3], [2]],
  ])('array index: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Array slice
  test.each([
    ['.[1:3]', [0, 1, 2, 3, 4], [[1, 2]]],
    ['.[2:]', [0, 1, 2, 3, 4], [[2, 3, 4]]],
    ['.[:2]', [0, 1, 2, 3, 4], [[0, 1]]],
    ['.[-2:]', [0, 1, 2, 3, 4], [[3, 4]]],
  ])('array slice: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Iterate
  test.each([
    ['.[]', [1, 2, 3], [1, 2, 3]],
    ['.[]', { a: 1, b: 2 }, [1, 2]],
  ])('iterate: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Pipe
  test.each([
    ['.a | .b', { a: { b: 1 } }, [1]],
    ['.[] | .x', [{ x: 1 }, { x: 2 }], [1, 2]],
  ])('pipe: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Comma
  test.each([
    ['.a, .b', { a: 1, b: 2 }, [1, 2]],
    ['.a, .b, .c', { a: 1, b: 2, c: 3 }, [1, 2, 3]],
  ])('comma: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Arithmetic
  test.each([
    ['.a + .b', { a: 1, b: 2 }, [3]],
    ['.a - .b', { a: 5, b: 3 }, [2]],
    ['.a * .b', { a: 3, b: 4 }, [12]],
    ['.a / .b', { a: 10, b: 2 }, [5]],
    ['.a % .b', { a: 7, b: 3 }, [1]],
    // String concatenation
    ['.a + .b', { a: 'hello', b: ' world' }, ['hello world']],
    // Array concatenation
    ['.a + .b', { a: [1], b: [2] }, [[1, 2]]],
    // Object merge
    ['.a + .b', { a: { x: 1 }, b: { y: 2 } }, [{ x: 1, y: 2 }]],
  ])('arithmetic: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Comparison
  test.each([
    ['.a == .b', { a: 1, b: 1 }, [true]],
    ['.a == .b', { a: 1, b: 2 }, [false]],
    ['.a != .b', { a: 1, b: 2 }, [true]],
    ['.a < .b', { a: 1, b: 2 }, [true]],
    ['.a > .b', { a: 1, b: 2 }, [false]],
    ['.a <= .b', { a: 1, b: 1 }, [true]],
    ['.a >= .b', { a: 2, b: 1 }, [true]],
  ])('comparison: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Boolean logic
  test.each([
    ['true and true', null, [true]],
    ['true and false', null, [false]],
    ['false or true', null, [true]],
    ['false or false', null, [false]],
    ['true | not', null, [false]],
    ['false | not', null, [true]],
    ['null | not', null, [true]],
  ])('logic: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Conditionals
  test.each([
    ['if true then "yes" else "no" end', null, ['yes']],
    ['if false then "yes" else "no" end', null, ['no']],
    ['if null then "yes" else "no" end', null, ['no']],
    ['if .a then "yes" else "no" end', { a: true }, ['yes']],
    ['if .x > 1 then "big" elif .x == 1 then "one" else "small" end', { x: 1 }, ['one']],
  ])('condition: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Array construction
  test.each([
    ['[.[] | . * 2]', [1, 2, 3], [[2, 4, 6]]],
    ['[.a, .b]', { a: 1, b: 2 }, [[1, 2]]],
    ['[]', null, [[]]],
  ])('array construct: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Object construction
  test.each([
    ['{a: .x, b: .y}', { x: 1, y: 2 }, [{ a: 1, b: 2 }]],
    ['{x}', { x: 1, y: 2 }, [{ x: 1 }]],
  ])('object construct: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // Builtins
  describe('builtins', () => {
    test('length', () => {
      expect(jq('length', [1, 2, 3])).toEqual([3]);
      expect(jq('length', 'hello')).toEqual([5]);
      expect(jq('length', { a: 1, b: 2 })).toEqual([2]);
      expect(jq('length', null)).toEqual([0]);
    });

    test('keys', () => {
      expect(jq('keys', { b: 1, a: 2 })).toEqual([['a', 'b']]);
      expect(jq('keys', [10, 20, 30])).toEqual([[0, 1, 2]]);
    });

    test('values', () => {
      expect(jq('values', { a: 1, b: 2 })).toEqual([[1, 2]]);
    });

    test('type', () => {
      expect(jq('type', null)).toEqual(['null']);
      expect(jq('type', 42)).toEqual(['number']);
      expect(jq('type', 'hi')).toEqual(['string']);
      expect(jq('type', true)).toEqual(['boolean']);
      expect(jq('type', [1])).toEqual(['array']);
      expect(jq('type', { a: 1 })).toEqual(['object']);
    });

    test('has', () => {
      expect(jq('has("a")', { a: 1 })).toEqual([true]);
      expect(jq('has("b")', { a: 1 })).toEqual([false]);
      expect(jq('has(0)', [1, 2])).toEqual([true]);
    });

    test('select', () => {
      expect(jq('[.[] | select(. > 2)]', [1, 2, 3, 4, 5])).toEqual([[3, 4, 5]]);
    });

    test('map', () => {
      expect(jq('map(. * 2)', [1, 2, 3])).toEqual([[2, 4, 6]]);
    });

    test('empty', () => {
      expect(jq('empty', 42)).toEqual([]);
    });

    test('add', () => {
      expect(jq('add', [1, 2, 3])).toEqual([6]);
      expect(jq('add', ['a', 'b', 'c'])).toEqual(['abc']);
      expect(jq('add', [])).toEqual([null]);
    });

    test('any/all', () => {
      expect(jq('any', [false, true])).toEqual([true]);
      expect(jq('any', [false, false])).toEqual([false]);
      expect(jq('all', [true, true])).toEqual([true]);
      expect(jq('all', [true, false])).toEqual([false]);
    });

    test('flatten', () => {
      expect(jq('flatten', [[1, [2]], [3]])).toEqual([[1, 2, 3]]);
      expect(jq('flatten(1)', [[1, [2]], [3]])).toEqual([[1, [2], 3]]);
    });

    test('range', () => {
      expect(jq('[range(3)]', null)).toEqual([[0, 1, 2]]);
      expect(jq('[range(1; 4)]', null)).toEqual([[1, 2, 3]]);
      expect(jq('[range(0; 10; 3)]', null)).toEqual([[0, 3, 6, 9]]);
    });

    test('tostring/tonumber', () => {
      expect(jq('tostring', 42)).toEqual(['42']);
      expect(jq('tostring', 'hi')).toEqual(['hi']);
      expect(jq('tonumber', '42')).toEqual([42]);
      expect(jq('tonumber', 42)).toEqual([42]);
    });

    test('ascii_downcase/ascii_upcase', () => {
      expect(jq('ascii_downcase', 'Hello')).toEqual(['hello']);
      expect(jq('ascii_upcase', 'Hello')).toEqual(['HELLO']);
    });

    test('split/join', () => {
      expect(jq('split(",")', 'a,b,c')).toEqual([['a', 'b', 'c']]);
      expect(jq('join(",")', ['a', 'b', 'c'])).toEqual(['a,b,c']);
    });

    test('ltrimstr/rtrimstr', () => {
      expect(jq('ltrimstr("he")', 'hello')).toEqual(['llo']);
      expect(jq('rtrimstr("lo")', 'hello')).toEqual(['hel']);
    });

    test('test', () => {
      expect(jq('test("foo")', 'foobar')).toEqual([true]);
      expect(jq('test("^bar")', 'foobar')).toEqual([false]);
    });

    test('contains', () => {
      expect(jq('contains("bar")', 'foobar')).toEqual([true]);
      expect(jq('contains([2, 0])', [2, 0, 1])).toEqual([true]);
    });

    test('recurse (..)', () => {
      expect(jq('[.. | numbers]', { a: { b: 1 }, c: 2 })).toEqual([[1, 2]]);
    });

    test('sort', () => {
      expect(jq('sort', [3, 1, 2])).toEqual([[1, 2, 3]]);
    });

    test('sort_by', () => {
      expect(jq('sort_by(.a)', [{ a: 3 }, { a: 1 }, { a: 2 }])).toEqual([[{ a: 1 }, { a: 2 }, { a: 3 }]]);
    });

    test('reverse', () => {
      expect(jq('reverse', [1, 2, 3])).toEqual([[3, 2, 1]]);
    });

    test('unique', () => {
      expect(jq('unique', [1, 2, 1, 3, 2])).toEqual([[1, 2, 3]]);
    });

    test('group_by', () => {
      expect(jq('group_by(.a)', [{ a: 1 }, { a: 2 }, { a: 1 }])).toEqual([[[{ a: 1 }, { a: 1 }], [{ a: 2 }]]]);
    });

    test('min/max', () => {
      expect(jq('min', [3, 1, 2])).toEqual([1]);
      expect(jq('max', [3, 1, 2])).toEqual([3]);
    });

    test('to_entries/from_entries', () => {
      expect(jq('to_entries', { a: 1, b: 2 })).toEqual([[{ key: 'a', value: 1 }, { key: 'b', value: 2 }]]);
      expect(jq('from_entries', [{ key: 'a', value: 1 }])).toEqual([{ a: 1 }]);
    });

    test('with_entries', () => {
      expect(jq('with_entries(select(.value > 1))', { a: 1, b: 2, c: 3 })).toEqual([{ b: 2, c: 3 }]);
    });

    test('map_values', () => {
      expect(jq('map_values(. + 1)', { a: 1, b: 2 })).toEqual([{ a: 2, b: 3 }]);
    });
  });

  // Try-catch
  test.each([
    ['try .a', null, []],
    ['try .a catch "err"', null, ['err']],
    ['.a?', null, []],
  ])('try-catch: jq(%j, %j) = %j', (filter, input, expected) => {
    expect(jq(filter, input)).toEqual(expected);
  });

  // String interpolation
  test('string interpolation', () => {
    expect(jq('"Hello \\(.name)"', { name: 'world' })).toEqual(['Hello world']);
    expect(jq('"\\(.a) + \\(.b) = \\(.a + .b)"', { a: 1, b: 2 })).toEqual(['1 + 2 = 3']);
  });

  // Recursive descent
  test('recursive descent', () => {
    expect(jq('[.. | .a? | select(. != null)]', { a: { b: 1 }, c: { a: 2 } })).toEqual([[{ b: 1 }, 2]]);
  });

  // Negation
  test('negation', () => {
    expect(jq('-(1 + 2)', null)).toEqual([-3]);
  });

  // Optional field access
  test('optional on non-object', () => {
    expect(jq('.a?', 42)).toEqual([]);
    expect(jq('.a?', null)).toEqual([]);
  });
});
