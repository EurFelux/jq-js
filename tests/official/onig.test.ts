// Auto-generated from jq's onig test suite
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';
describe('jq official: regex', () => {
  // line 4
  test(`[match("( )*"; "g")] | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`[match("( )*"; "g")]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset":0,"length":0,"string":"","captures":[{"offset":-1,"string":null,"length":0,"name":null}]},{"offset":1,"length":0,"string":"","captures":[{"offset":-1,"string":null,"length":0,"name":null}]},{"offset":2,"length":0,"string":"","captures":[{"offset":-1,"string":null,"length":0,"name":null}]},{"offset":3,"length":0,"string":"","captures":[{"offset":-1,"string":null,"length":0,"name":null}]}]`)]);
  });

  // line 8
  test(`[match("( )*"; "gn")] | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`[match("( )*"; "gn")]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 12
  test(`[match(""; "g")] | "ab"`, () => {
    const input = JSON.parse(`"ab"`);
    const result = jq(`[match(""; "g")]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset":0,"length":0,"string":"","captures":[]},{"offset":1,"length":0,"string":"","captures":[]},{"offset":2,"length":0,"string":"","captures":[]}]`)]);
  });

  // line 16
  test(`[match("a"; "gi")] | "āáàä"`, () => {
    const input = JSON.parse(`"āáàä"`);
    const result = jq(`[match("a"; "gi")]`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 20
  test(`[match(["(bar)"])] | "foo bar"`, () => {
    const input = JSON.parse(`"foo bar"`);
    const result = jq(`[match(["(bar)"])]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset": 4, "length": 3, "string": "bar", "captures":[{"offset": 4, "length": 3, "string": "bar", "name": null}]}]`)]);
  });

  // line 25
  test(`[match("bar")] | "ā bar with a combining codepoint U+0304"`, () => {
    const input = JSON.parse(`"ā bar with a combining codepoint U+0304"`);
    const result = jq(`[match("bar")]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset": 3, "length": 3, "string": "bar", "captures":[]}]`)]);
  });

  // line 30
  test(`[match("bār")] | "a bār"`, () => {
    const input = JSON.parse(`"a bār"`);
    const result = jq(`[match("bār")]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset": 2, "length": 4, "string": "bār", "captures":[]}]`)]);
  });

  // line 34
  test(`[match(".+?\\\\b")] | "ā two-codepoint grapheme"`, () => {
    const input = JSON.parse(`"ā two-codepoint grapheme"`);
    const result = jq(`[match(".+?\\\\b")]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset": 0, "length": 2, "string": "ā", "captures":[]}]`)]);
  });

  // line 38
  test(`[match(["foo (?<bar123>bar)? foo", "ig"])] | "foo bar foo foo  foo"`, () => {
    const input = JSON.parse(`"foo bar foo foo  foo"`);
    const result = jq(`[match(["foo (?<bar123>bar)? foo", "ig"])]`, input);
    expect(result).toEqual([JSON.parse(`[{"offset": 0, "length": 11, "string": "foo bar foo", "captures":[{"offset": 4, "length": 3, "string": "bar", "name": "bar123"}]},{"offset":12, "length": 8, "string": "foo  foo", "captures":[{"offset": -1, "length": 0, "string": null, "name": "bar123"}]}]`)]);
  });

  // line 45
  test(`"a","b","c" | capture("(?<x>a)?b?") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"a","b","c" | capture("(?<x>a)?b?")`, input);
    expect(result).toEqual([JSON.parse(`{"x":"a"}`), JSON.parse(`{"x":null}`), JSON.parse(`{"x":null}`)]);
  });

  // line 51
  test(`"a","b","c" | match("(?<x>a)?b?") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"a","b","c" | match("(?<x>a)?b?")`, input);
    expect(result).toEqual([JSON.parse(`{"offset":0,"length":1,"string":"a","captures":[{"offset":0,"length":1,"string":"a","name":"x"}]}`), JSON.parse(`{"offset":0,"length":1,"string":"b","captures":[{"offset":-1,"string":null,"length":0,"name":"x"}]}`), JSON.parse(`{"offset":0,"length":0,"string":"","captures":[{"offset":-1,"string":null,"length":0,"name":"x"}]}`)]);
  });

  // line 58
  test(`"a","b","c" | capture("(?<x>a?)?b?") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"a","b","c" | capture("(?<x>a?)?b?")`, input);
    expect(result).toEqual([JSON.parse(`{"x":"a"}`), JSON.parse(`{"x":""}`), JSON.parse(`{"x":""}`)]);
  });

  // line 64
  test(`"a","b","c" | match("(?<x>a?)?b?") | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"a","b","c" | match("(?<x>a?)?b?")`, input);
    expect(result).toEqual([JSON.parse(`{"offset":0,"length":1,"string":"a","captures":[{"offset":0,"length":1,"string":"a","name":"x"}]}`), JSON.parse(`{"offset":0,"length":1,"string":"b","captures":[{"offset":0,"string":"","length":0,"name":"x"}]}`), JSON.parse(`{"offset":0,"length":0,"string":"","captures":[{"offset":0,"string":"","length":0,"name":"x"}]}`)]);
  });

  // line 69
  test(`[test("( )*"; "gn")] | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`[test("( )*"; "gn")]`, input);
    expect(result).toEqual([JSON.parse(`[false]`)]);
  });

  // line 73
  test(`[test("ā")] | "ā"`, () => {
    const input = JSON.parse(`"ā"`);
    const result = jq(`[test("ā")]`, input);
    expect(result).toEqual([JSON.parse(`[true]`)]);
  });

  // line 77
  test(`capture("(?<a>[a-z]+)-(?<n>[0-9]+)") | "xyzzy-14"`, () => {
    const input = JSON.parse(`"xyzzy-14"`);
    const result = jq(`capture("(?<a>[a-z]+)-(?<n>[0-9]+)")`, input);
    expect(result).toEqual([JSON.parse(`{"a":"xyzzy","n":"14"}`)]);
  });

  // line 86
  test(`[.[] | sub(", "; ":")] | ["a,b, c, d, e,f", ", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f", ", a,b, c, d, e,f, "]`);
    const result = jq(`[.[] | sub(", "; ":")]`, input);
    expect(result).toEqual([JSON.parse(`["a,b:c, d, e,f",":a,b, c, d, e,f, "]`)]);
  });

  // line 90
  test(`sub("^(?<head>.)"; "Head=\\(.head) Tail=") | "abcdef"`, () => {
    const input = JSON.parse(`"abcdef"`);
    const result = jq(`sub("^(?<head>.)"; "Head=\\(.head) Tail=")`, input);
    expect(result).toEqual([JSON.parse(`"Head=a Tail=bcdef"`)]);
  });

  // line 94
  test(`[.[] | gsub(", "; ":")] | ["a,b, c, d, e,f",", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f",", a,b, c, d, e,f, "]`);
    const result = jq(`[.[] | gsub(", "; ":")]`, input);
    expect(result).toEqual([JSON.parse(`["a,b:c:d:e,f",":a,b:c:d:e,f:"]`)]);
  });

  // line 98
  test(`gsub("(?<d>\\\\d)"; ":\\(.d);") | "a1b2"`, () => {
    const input = JSON.parse(`"a1b2"`);
    const result = jq(`gsub("(?<d>\\\\d)"; ":\\(.d);")`, input);
    expect(result).toEqual([JSON.parse(`"a:1;b:2;"`)]);
  });

  // line 102
  test(`gsub("a";"b") | "aaaaa"`, () => {
    const input = JSON.parse(`"aaaaa"`);
    const result = jq(`gsub("a";"b")`, input);
    expect(result).toEqual([JSON.parse(`"bbbbb"`)]);
  });

  // line 106
  test(`gsub("(.*)"; ""; "x") | ""`, () => {
    const input = JSON.parse(`""`);
    const result = jq(`gsub("(.*)"; ""; "x")`, input);
    expect(result).toEqual([JSON.parse(`""`)]);
  });

  // line 110
  test(`gsub(""; "a"; "g") | ""`, () => {
    const input = JSON.parse(`""`);
    const result = jq(`gsub(""; "a"; "g")`, input);
    expect(result).toEqual([JSON.parse(`"a"`)]);
  });

  // line 114
  test(`gsub("^"; ""; "g") | "a"`, () => {
    const input = JSON.parse(`"a"`);
    const result = jq(`gsub("^"; ""; "g")`, input);
    expect(result).toEqual([JSON.parse(`"a"`)]);
  });

  // line 118
  test(`gsub(""; "a"; "g") | "a"`, () => {
    const input = JSON.parse(`"a"`);
    const result = jq(`gsub(""; "a"; "g")`, input);
    expect(result).toEqual([JSON.parse(`"aaa"`)]);
  });

  // line 122
  test(`gsub("\$"; "a"; "g") | "a"`, () => {
    const input = JSON.parse(`"a"`);
    const result = jq(`gsub("\$"; "a"; "g")`, input);
    expect(result).toEqual([JSON.parse(`"aa"`)]);
  });

  // line 126
  test(`gsub("^"; "a") | ""`, () => {
    const input = JSON.parse(`""`);
    const result = jq(`gsub("^"; "a")`, input);
    expect(result).toEqual([JSON.parse(`"a"`)]);
  });

  // line 130
  test(`gsub("(?=u)"; "u") | "qux"`, () => {
    const input = JSON.parse(`"qux"`);
    const result = jq(`gsub("(?=u)"; "u")`, input);
    expect(result).toEqual([JSON.parse(`"quux"`)]);
  });

  // line 134
  test(`gsub("^.*a"; "b") | "aaa"`, () => {
    const input = JSON.parse(`"aaa"`);
    const result = jq(`gsub("^.*a"; "b")`, input);
    expect(result).toEqual([JSON.parse(`"b"`)]);
  });

  // line 138
  test(`gsub("^.*?a"; "b") | "aaa"`, () => {
    const input = JSON.parse(`"aaa"`);
    const result = jq(`gsub("^.*?a"; "b")`, input);
    expect(result).toEqual([JSON.parse(`"baa"`)]);
  });

  // line 143
  test(`[gsub("a"; "b", "c")] | "a"`, () => {
    const input = JSON.parse(`"a"`);
    const result = jq(`[gsub("a"; "b", "c")]`, input);
    expect(result).toEqual([JSON.parse(`["b","c"]`)]);
  });

  // line 147
  test(`[.[] | scan(", ")] | ["a,b, c, d, e,f",", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f",", a,b, c, d, e,f, "]`);
    const result = jq(`[.[] | scan(", ")]`, input);
    expect(result).toEqual([JSON.parse(`[", ",", ",", ",", ",", ",", ",", ",", "]`)]);
  });

  // line 151
  test(`[.[]|[[sub(", *";":")], [gsub(", *";":")], [scan(", *")]]] | ["a,b, c, d, e,f",", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f",", a,b, c, d, e,f, "]`);
    const result = jq(`[.[]|[[sub(", *";":")], [gsub(", *";":")], [scan(", *")]]]`, input);
    expect(result).toEqual([JSON.parse(`[[["a:b, c, d, e,f"],["a:b:c:d:e:f"],[",",", ",", ",", ",","]],[[":a,b, c, d, e,f, "],[":a:b:c:d:e:f:"],[", ",",",", ",", ",", ",",",", "]]]`)]);
  });

  // line 155
  test(`[.[]|[[sub(", +";":")], [gsub(", +";":")], [scan(", +")]]] | ["a,b, c, d, e,f",", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f",", a,b, c, d, e,f, "]`);
    const result = jq(`[.[]|[[sub(", +";":")], [gsub(", +";":")], [scan(", +")]]]`, input);
    expect(result).toEqual([JSON.parse(`[[["a,b:c, d, e,f"],["a,b:c:d:e,f"],[", ",", ",", "]],[[":a,b, c, d, e,f, "],[":a,b:c:d:e,f:"],[", ",", ",", ",", ",", "]]]`)]);
  });

  // line 159
  test(`[.[] | scan("b+"; "i")] | ["","bBb","abcABBBCabbbc"]`, () => {
    const input = JSON.parse(`["","bBb","abcABBBCabbbc"]`);
    const result = jq(`[.[] | scan("b+"; "i")]`, input);
    expect(result).toEqual([JSON.parse(`["bBb","b","BBB","bbb"]`)]);
  });

  // line 164
  test(`gsub("(?<x>.)[^a]*"; "+\\(.x)-") | "Abcabc"`, () => {
    const input = JSON.parse(`"Abcabc"`);
    const result = jq(`gsub("(?<x>.)[^a]*"; "+\\(.x)-")`, input);
    expect(result).toEqual([JSON.parse(`"+A-+a-"`)]);
  });

  // line 168
  test(`gsub("(?<x>.)(?<y>[0-9])"; "\\(.x|ascii_downcase)\\(.y)") | "A1 B2 CD"`, () => {
    const input = JSON.parse(`"A1 B2 CD"`);
    const result = jq(`gsub("(?<x>.)(?<y>[0-9])"; "\\(.x|ascii_downcase)\\(.y)")`, input);
    expect(result).toEqual([JSON.parse(`"a1 b2 CD"`)]);
  });

  // line 172
  test(`gsub("\\\\b(?<x>.)"; "\\(.x|ascii_downcase)") | "ABC DEF"`, () => {
    const input = JSON.parse(`"ABC DEF"`);
    const result = jq(`gsub("\\\\b(?<x>.)"; "\\(.x|ascii_downcase)")`, input);
    expect(result).toEqual([JSON.parse(`"aBC dEF"`)]);
  });

  // line 176
  test(`gsub("[^a-z]*(?<x>[a-z]*)"; "Z\\(.x)") | "123foo456bar"`, () => {
    const input = JSON.parse(`"123foo456bar"`);
    const result = jq(`gsub("[^a-z]*(?<x>[a-z]*)"; "Z\\(.x)")`, input);
    expect(result).toEqual([JSON.parse(`"ZfooZbarZ"`)]);
  });

  // line 181
  test(`sub("(?<x>.)"; "\\(.x)!") | "’"`, () => {
    const input = JSON.parse(`"’"`);
    const result = jq(`sub("(?<x>.)"; "\\(.x)!")`, input);
    expect(result).toEqual([JSON.parse(`"’!"`)]);
  });

  // line 185
  test(`[sub("a"; "b", "c")] | "a"`, () => {
    const input = JSON.parse(`"a"`);
    const result = jq(`[sub("a"; "b", "c")]`, input);
    expect(result).toEqual([JSON.parse(`["b","c"]`)]);
  });

  // line 189
  test(`[sub("(?<a>.)"; "\\(.a|ascii_upcase)", "\\(.a|ascii_downcase)", "c")] | "aB"`, () => {
    const input = JSON.parse(`"aB"`);
    const result = jq(`[sub("(?<a>.)"; "\\(.a|ascii_upcase)", "\\(.a|ascii_downcase)", "c")]`, input);
    expect(result).toEqual([JSON.parse(`["AB","aB","cB"]`)]);
  });

  // line 193
  test(`[gsub("(?<a>.)"; "\\(.a|ascii_upcase)", "\\(.a|ascii_downcase)", "c")] | "aB"`, () => {
    const input = JSON.parse(`"aB"`);
    const result = jq(`[gsub("(?<a>.)"; "\\(.a|ascii_upcase)", "\\(.a|ascii_downcase)", "c")]`, input);
    expect(result).toEqual([JSON.parse(`["AB","ab","cc"]`)]);
  });

  // line 198
  test(`[splits("")] | "ab"`, () => {
    const input = JSON.parse(`"ab"`);
    const result = jq(`[splits("")]`, input);
    expect(result).toEqual([JSON.parse(`["","a","b",""]`)]);
  });

  // line 202
  test(`[splits("c")] | "ab"`, () => {
    const input = JSON.parse(`"ab"`);
    const result = jq(`[splits("c")]`, input);
    expect(result).toEqual([JSON.parse(`["ab"]`)]);
  });

  // line 206
  test(`[splits("a+"; "i")] | "abAABBabA"`, () => {
    const input = JSON.parse(`"abAABBabA"`);
    const result = jq(`[splits("a+"; "i")]`, input);
    expect(result).toEqual([JSON.parse(`["","b","BB","b",""]`)]);
  });

  // line 210
  test(`[splits("b+"; "i")] | "abAABBabA"`, () => {
    const input = JSON.parse(`"abAABBabA"`);
    const result = jq(`[splits("b+"; "i")]`, input);
    expect(result).toEqual([JSON.parse(`["a","AA","a","A"]`)]);
  });

});