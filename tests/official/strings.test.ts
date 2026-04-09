// Auto-generated from jq's test suite (ref-jq/tests/jq.test)
// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)
// See: https://github.com/jqlang/jq/blob/master/COPYING

import { describe, expect, test } from 'vitest';
import { jq } from '../../src/index.js';

describe('jq official: strings', () => {
  // line 53: # FIXME: more tests needed for weird unicode stuff (e.g. utf16 pairs)
  test(`# FIXME: more tests needed for weird unicode stuff (e.g. utf16 pairs) | "Aa\\r\\n\\t\\b\\f\\u03bc"`, () => {
    const input = JSON.parse(`"Aa\\r\\n\\t\\b\\f\\u03bc"`);
    const result = jq(`# FIXME: more tests needed for weird unicode stuff (e.g. utf16 pairs)`, input);
    expect(result).toEqual([JSON.parse(`null`), JSON.parse(`"Aa\\u000d\\u000a\\u0009\\u0008\\u000c\\u03bc"`)]);
  });

  // line 58: .
  test(`. | "Aa\\r\\n\\t\\b\\f\\u03bc"`, () => {
    const input = JSON.parse(`"Aa\\r\\n\\t\\b\\f\\u03bc"`);
    const result = jq(`.`, input);
    expect(result).toEqual([JSON.parse(`"Aa\\u000d\\u000a\\u0009\\u0008\\u000c\\u03bc"`)]);
  });

  // line 68: "inter\("pol" + "ation")"
  test(`"inter\\("pol" + "ation")" | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`"inter\\("pol" + "ation")"`, input);
    expect(result).toEqual([JSON.parse(`"interpolation"`)]);
  });

  // line 72: @text,@json,([1,.]|@csv,@tsv),@html,(@uri|.,@urid),@sh,(@base64|.,@base64d)
  test(`@text,@json,([1,.]|@csv,@tsv),@html,(@uri|.,@urid),@sh,(@base64|.,@base64d) | "!()<>&'\\"\\t"`, () => {
    const input = JSON.parse(`"!()<>&'\\"\\t"`);
    const result = jq(`@text,@json,([1,.]|@csv,@tsv),@html,(@uri|.,@urid),@sh,(@base64|.,@base64d)`, input);
    expect(result).toEqual([JSON.parse(`"!()<>&'\\"\\t"`), JSON.parse(`"\\"!()<>&'\\\\\\"\\\\t\\""`), JSON.parse(`"1,\\"!()<>&'\\"\\"\\t\\""`), JSON.parse(`"1\\t!()<>&'\\"\\\\t"`), JSON.parse(`"!()&lt;&gt;&amp;&apos;&quot;\\t"`), JSON.parse(`"%21%28%29%3C%3E%26%27%22%09"`), JSON.parse(`"!()<>&'\\"\\t"`), JSON.parse(`"'!()<>&'\\\\''\\"\\t'"`), JSON.parse(`"ISgpPD4mJyIJ"`), JSON.parse(`"!()<>&'\\"\\t"`)]);
  });

  // line 961: .[] | . as {a:$a} ?// {a:$a} ?// $a | $a
  test(`.[] | . as {a:\$a} ?// {a:\$a} ?// \$a | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] | . as {a:\$a} ?// {a:\$a} ?// \$a | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 968: .[] as {a:$a} ?// {a:$a} ?// $a | $a
  test(`.[] as {a:\$a} ?// {a:\$a} ?// \$a | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] as {a:\$a} ?// {a:\$a} ?// \$a | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 975: [[3],[4],[5],6][] | . as {a:$a} ?// {a:$a} ?// $a | $a
  test(`[[3],[4],[5],6][] | . as {a:\$a} ?// {a:\$a} ?// \$a | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6][] | . as {a:\$a} ?// {a:\$a} ?// \$a | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 982: [[3],[4],[5],6] | .[] as {a:$a} ?// {a:$a} ?// $a | $a
  test(`[[3],[4],[5],6] | .[] as {a:\$a} ?// {a:\$a} ?// \$a | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6] | .[] as {a:\$a} ?// {a:\$a} ?// \$a | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 989: .[] | . as {a:$a} ?// $a ?// {a:$a} | $a
  test(`.[] | . as {a:\$a} ?// \$a ?// {a:\$a} | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] | . as {a:\$a} ?// \$a ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 996: .[] as {a:$a} ?// $a ?// {a:$a} | $a
  test(`.[] as {a:\$a} ?// \$a ?// {a:\$a} | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] as {a:\$a} ?// \$a ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1003: [[3],[4],[5],6][] | . as {a:$a} ?// $a ?// {a:$a} | $a
  test(`[[3],[4],[5],6][] | . as {a:\$a} ?// \$a ?// {a:\$a} | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6][] | . as {a:\$a} ?// \$a ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1010: [[3],[4],[5],6] | .[] as {a:$a} ?// $a ?// {a:$a} | $a
  test(`[[3],[4],[5],6] | .[] as {a:\$a} ?// \$a ?// {a:\$a} | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6] | .[] as {a:\$a} ?// \$a ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1017: .[] | . as $a ?// {a:$a} ?// {a:$a} | $a
  test(`.[] | . as \$a ?// {a:\$a} ?// {a:\$a} | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] | . as \$a ?// {a:\$a} ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1024: .[] as $a ?// {a:$a} ?// {a:$a} | $a
  test(`.[] as \$a ?// {a:\$a} ?// {a:\$a} | \$a | [[3],[4],[5],6]`, () => {
    const input = JSON.parse(`[[3],[4],[5],6]`);
    const result = jq(`.[] as \$a ?// {a:\$a} ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1031: [[3],[4],[5],6][] | . as $a ?// {a:$a} ?// {a:$a} | $a
  test(`[[3],[4],[5],6][] | . as \$a ?// {a:\$a} ?// {a:\$a} | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6][] | . as \$a ?// {a:\$a} ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1038: [[3],[4],[5],6] | .[] as $a ?// {a:$a} ?// {a:$a} | $a
  test(`[[3],[4],[5],6] | .[] as \$a ?// {a:\$a} ?// {a:\$a} | \$a | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[[3],[4],[5],6] | .[] as \$a ?// {a:\$a} ?// {a:\$a} | \$a`, input);
    expect(result).toEqual([JSON.parse(`[3]`), JSON.parse(`[4]`), JSON.parse(`[5]`), JSON.parse(`6`)]);
  });

  // line 1045: . as $dot|any($dot[];not)
  test(`. as \$dot|any(\$dot[];not) | [1,2,3,4,true,false,1,2,3,4,5]`, () => {
    const input = JSON.parse(`[1,2,3,4,true,false,1,2,3,4,5]`);
    const result = jq(`. as \$dot|any(\$dot[];not)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1049: . as $dot|any($dot[];not)
  test(`. as \$dot|any(\$dot[];not) | [1,2,3,4,true]`, () => {
    const input = JSON.parse(`[1,2,3,4,true]`);
    const result = jq(`. as \$dot|any(\$dot[];not)`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1053: . as $dot|all($dot[];.)
  test(`. as \$dot|all(\$dot[];.) | [1,2,3,4,true,false,1,2,3,4,5]`, () => {
    const input = JSON.parse(`[1,2,3,4,true,false,1,2,3,4,5]`);
    const result = jq(`. as \$dot|all(\$dot[];.)`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1057: . as $dot|all($dot[];.)
  test(`. as \$dot|all(\$dot[];.) | [1,2,3,4,true]`, () => {
    const input = JSON.parse(`[1,2,3,4,true]`);
    const result = jq(`. as \$dot|all(\$dot[];.)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1062: any(true, error; .)
  test(`any(true, error; .) | "badness"`, () => {
    const input = JSON.parse(`"badness"`);
    const result = jq(`any(true, error; .)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1066: all(false, error; .)
  test(`all(false, error; .) | "badness"`, () => {
    const input = JSON.parse(`"badness"`);
    const result = jq(`all(false, error; .)`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1070: any(not)
  test(`any(not) | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`any(not)`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1074: all(not)
  test(`all(not) | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`all(not)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1078: any(not)
  test(`any(not) | [false]`, () => {
    const input = JSON.parse(`[false]`);
    const result = jq(`any(not)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1082: all(not)
  test(`all(not) | [false]`, () => {
    const input = JSON.parse(`[false]`);
    const result = jq(`all(not)`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1086: [any,all]
  test(`[any,all] | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`[any,all]`, input);
    expect(result).toEqual([JSON.parse(`[false,true]`)]);
  });

  // line 1090: [any,all]
  test(`[any,all] | [true]`, () => {
    const input = JSON.parse(`[true]`);
    const result = jq(`[any,all]`, input);
    expect(result).toEqual([JSON.parse(`[true,true]`)]);
  });

  // line 1094: [any,all]
  test(`[any,all] | [false]`, () => {
    const input = JSON.parse(`[false]`);
    const result = jq(`[any,all]`, input);
    expect(result).toEqual([JSON.parse(`[false,false]`)]);
  });

  // line 1098: [any,all]
  test(`[any,all] | [true,false]`, () => {
    const input = JSON.parse(`[true,false]`);
    const result = jq(`[any,all]`, input);
    expect(result).toEqual([JSON.parse(`[true,false]`)]);
  });

  // line 1102: [any,all]
  test(`[any,all] | [null,null,true]`, () => {
    const input = JSON.parse(`[null,null,true]`);
    const result = jq(`[any,all]`, input);
    expect(result).toEqual([JSON.parse(`[true,false]`)]);
  });

  // line 1504: [.[]|startswith("foo")]
  test(`[.[]|startswith("foo")] | ["fo", "foo", "barfoo", "foobar", "barfoob"]`, () => {
    const input = JSON.parse(`["fo", "foo", "barfoo", "foobar", "barfoob"]`);
    const result = jq(`[.[]|startswith("foo")]`, input);
    expect(result).toEqual([JSON.parse(`[false, true, false, true, false]`)]);
  });

  // line 1508: [.[]|endswith("foo")]
  test(`[.[]|endswith("foo")] | ["fo", "foo", "barfoo", "foobar", "barfoob"]`, () => {
    const input = JSON.parse(`["fo", "foo", "barfoo", "foobar", "barfoob"]`);
    const result = jq(`[.[]|endswith("foo")]`, input);
    expect(result).toEqual([JSON.parse(`[false, true, true, false, false]`)]);
  });

  // line 1512: [.[] | split(", ")]
  test(`[.[] | split(", ")] | ["a,b, c, d, e,f",", a,b, c, d, e,f, "]`, () => {
    const input = JSON.parse(`["a,b, c, d, e,f",", a,b, c, d, e,f, "]`);
    const result = jq(`[.[] | split(", ")]`, input);
    expect(result).toEqual([JSON.parse(`[["a,b","c","d","e,f"],["","a,b","c","d","e,f",""]]`)]);
  });

  // line 1516: split("")
  test(`split("") | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`split("")`, input);
    expect(result).toEqual([JSON.parse(`["a","b","c"]`)]);
  });

  // line 1520: [.[]|ltrimstr("foo")]
  test(`[.[]|ltrimstr("foo")] | ["fo", "foo", "barfoo", "foobar", "afoo"]`, () => {
    const input = JSON.parse(`["fo", "foo", "barfoo", "foobar", "afoo"]`);
    const result = jq(`[.[]|ltrimstr("foo")]`, input);
    expect(result).toEqual([JSON.parse(`["fo","","barfoo","bar","afoo"]`)]);
  });

  // line 1524: [.[]|rtrimstr("foo")]
  test(`[.[]|rtrimstr("foo")] | ["fo", "foo", "barfoo", "foobar", "foob"]`, () => {
    const input = JSON.parse(`["fo", "foo", "barfoo", "foobar", "foob"]`);
    const result = jq(`[.[]|rtrimstr("foo")]`, input);
    expect(result).toEqual([JSON.parse(`["fo","","bar","foobar","foob"]`)]);
  });

  // line 1528: [.[]|trimstr("foo")]
  test(`[.[]|trimstr("foo")] | ["fo", "foo", "barfoo", "foobarfoo", "foob"]`, () => {
    const input = JSON.parse(`["fo", "foo", "barfoo", "foobarfoo", "foob"]`);
    const result = jq(`[.[]|trimstr("foo")]`, input);
    expect(result).toEqual([JSON.parse(`["fo","","bar","bar","b"]`)]);
  });

  // line 1532: [.[]|ltrimstr("")]
  test(`[.[]|ltrimstr("")] | ["a", "xx", ""]`, () => {
    const input = JSON.parse(`["a", "xx", ""]`);
    const result = jq(`[.[]|ltrimstr("")]`, input);
    expect(result).toEqual([JSON.parse(`["a", "xx", ""]`)]);
  });

  // line 1536: [.[]|rtrimstr("")]
  test(`[.[]|rtrimstr("")] | ["a", "xx", ""]`, () => {
    const input = JSON.parse(`["a", "xx", ""]`);
    const result = jq(`[.[]|rtrimstr("")]`, input);
    expect(result).toEqual([JSON.parse(`["a", "xx", ""]`)]);
  });

  // line 1540: [.[]|trimstr("")]
  test(`[.[]|trimstr("")] | ["a", "xx", ""]`, () => {
    const input = JSON.parse(`["a", "xx", ""]`);
    const result = jq(`[.[]|trimstr("")]`, input);
    expect(result).toEqual([JSON.parse(`["a", "xx", ""]`)]);
  });

  // line 1544: [(index(","), rindex(",")), indices(",")]
  test(`[(index(","), rindex(",")), indices(",")] | "a,bc,def,ghij,klmno"`, () => {
    const input = JSON.parse(`"a,bc,def,ghij,klmno"`);
    const result = jq(`[(index(","), rindex(",")), indices(",")]`, input);
    expect(result).toEqual([JSON.parse(`[1,13,[1,4,8,13]]`)]);
  });

  // line 1548: [ index("aba"), rindex("aba"), indices("aba") ]
  test(`[ index("aba"), rindex("aba"), indices("aba") ] | "xababababax"`, () => {
    const input = JSON.parse(`"xababababax"`);
    const result = jq(`[ index("aba"), rindex("aba"), indices("aba") ]`, input);
    expect(result).toEqual([JSON.parse(`[1,7,[1,3,5,7]]`)]);
  });

  // line 1554: map(trim), map(ltrim), map(rtrim)
  test(`map(trim), map(ltrim), map(rtrim) | [" \\n\\t\\r\\f\\u000b", "","  ", "a", " a ", "abc", "  abc  ", "  abc", "abc  "]`, () => {
    const input = JSON.parse(`[" \\n\\t\\r\\f\\u000b", "","  ", "a", " a ", "abc", "  abc  ", "  abc", "abc  "]`);
    const result = jq(`map(trim), map(ltrim), map(rtrim)`, input);
    expect(result).toEqual([JSON.parse(`["", "", "", "a", "a", "abc", "abc", "abc", "abc"]`), JSON.parse(`["", "", "", "a", "a ", "abc", "abc  ", "abc", "abc  "]`), JSON.parse(`["", "", "", "a", " a", "abc", "  abc", "  abc", "abc"]`)]);
  });

  // line 1560: trim, ltrim, rtrim
  test(`trim, ltrim, rtrim | "\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000abc\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000"`, () => {
    const input = JSON.parse(`"\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000abc\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000"`);
    const result = jq(`trim, ltrim, rtrim`, input);
    expect(result).toEqual([JSON.parse(`"abc"`), JSON.parse(`"abc\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000"`), JSON.parse(`"\\u0009\\u000A\\u000B\\u000C\\u000D\\u0020\\u0085\\u00A0\\u1680\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u2028\\u2029\\u202F\\u205F\\u3000abc"`)]);
  });

  // line 1566: try trim catch ., try ltrim catch ., try rtrim catch .
  test(`try trim catch ., try ltrim catch ., try rtrim catch . | 123`, () => {
    const input = JSON.parse(`123`);
    const result = jq(`try trim catch ., try ltrim catch ., try rtrim catch .`, input);
    expect(result).toEqual([JSON.parse(`"trim input must be a string"`), JSON.parse(`"trim input must be a string"`), JSON.parse(`"trim input must be a string"`)]);
  });

  // line 1572: indices(1)
  test(`indices(1) | [0,1,1,2,3,4,1,5]`, () => {
    const input = JSON.parse(`[0,1,1,2,3,4,1,5]`);
    const result = jq(`indices(1)`, input);
    expect(result).toEqual([JSON.parse(`[1,2,6]`)]);
  });

  // line 1576: indices([1,2])
  test(`indices([1,2]) | [0,1,2,3,1,4,2,5,1,2,6,7]`, () => {
    const input = JSON.parse(`[0,1,2,3,1,4,2,5,1,2,6,7]`);
    const result = jq(`indices([1,2])`, input);
    expect(result).toEqual([JSON.parse(`[1,8]`)]);
  });

  // line 1580: indices([1,2])
  test(`indices([1,2]) | [1]`, () => {
    const input = JSON.parse(`[1]`);
    const result = jq(`indices([1,2])`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1584: indices(", ")
  test(`indices(", ") | "a,b, cd,e, fgh, ijkl"`, () => {
    const input = JSON.parse(`"a,b, cd,e, fgh, ijkl"`);
    const result = jq(`indices(", ")`, input);
    expect(result).toEqual([JSON.parse(`[3,9,14]`)]);
  });

  // line 1588: index("!")
  test(`index("!") | "здравствуй мир!"`, () => {
    const input = JSON.parse(`"здравствуй мир!"`);
    const result = jq(`index("!")`, input);
    expect(result).toEqual([JSON.parse(`14`)]);
  });

  // line 1592: .[:rindex("x")]
  test(`.[:rindex("x")] | "正xyz"`, () => {
    const input = JSON.parse(`"正xyz"`);
    const result = jq(`.[:rindex("x")]`, input);
    expect(result).toEqual([JSON.parse(`"正"`)]);
  });

  // line 1596: indices("o")
  test(`indices("o") | "🇬🇧oo"`, () => {
    const input = JSON.parse(`"🇬🇧oo"`);
    const result = jq(`indices("o")`, input);
    expect(result).toEqual([JSON.parse(`[2,3]`)]);
  });

  // line 1600: indices("o")
  test(`indices("o") | "ƒoo"`, () => {
    const input = JSON.parse(`"ƒoo"`);
    const result = jq(`indices("o")`, input);
    expect(result).toEqual([JSON.parse(`[1,2]`)]);
  });

  // line 1604: [.[]|split(",")]
  test(`[.[]|split(",")] | ["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`, () => {
    const input = JSON.parse(`["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`);
    const result = jq(`[.[]|split(",")]`, input);
    expect(result).toEqual([JSON.parse(`[["a"," bc"," def"," ghij"," jklmn"," a","b"," c","d"," e","f"],["a","b","c","d"," e","f","g","h"]]`)]);
  });

  // line 1608: [.[]|split(", ")]
  test(`[.[]|split(", ")] | ["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`, () => {
    const input = JSON.parse(`["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`);
    const result = jq(`[.[]|split(", ")]`, input);
    expect(result).toEqual([JSON.parse(`[["a","bc","def","ghij","jklmn","a,b","c,d","e,f"],["a,b,c,d","e,f,g,h"]]`)]);
  });

  // line 1612: [.[] * 3]
  test(`[.[] * 3] | ["a", "ab", "abc"]`, () => {
    const input = JSON.parse(`["a", "ab", "abc"]`);
    const result = jq(`[.[] * 3]`, input);
    expect(result).toEqual([JSON.parse(`["aaa", "ababab", "abcabcabc"]`)]);
  });

  // line 1616: [.[] * "abc"]
  test(`[.[] * "abc"] | [-1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 3.7, 10.0]`, () => {
    const input = JSON.parse(`[-1.0, -0.5, 0.0, 0.5, 1.0, 1.5, 3.7, 10.0]`);
    const result = jq(`[.[] * "abc"]`, input);
    expect(result).toEqual([JSON.parse(`[null,null,"","","abc","abc","abcabcabc","abcabcabcabcabcabcabcabcabcabc"]`)]);
  });

  // line 1620: [. * (nan,-nan)]
  test(`[. * (nan,-nan)] | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`[. * (nan,-nan)]`, input);
    expect(result).toEqual([JSON.parse(`[null,null]`)]);
  });

  // line 1624: . * 100000 | [.[:10],.[-10:]]
  test(`. * 100000 | [.[:10],.[-10:]] | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`. * 100000 | [.[:10],.[-10:]]`, input);
    expect(result).toEqual([JSON.parse(`["abcabcabca","cabcabcabc"]`)]);
  });

  // line 1628: . * 1000000000
  test(`. * 1000000000 | ""`, () => {
    const input = JSON.parse(`""`);
    const result = jq(`. * 1000000000`, input);
    expect(result).toEqual([JSON.parse(`""`)]);
  });

  // line 1632: try (. * 1000000000) catch .
  test(`try (. * 1000000000) catch . | "abc"`, () => {
    const input = JSON.parse(`"abc"`);
    const result = jq(`try (. * 1000000000) catch .`, input);
    expect(result).toEqual([JSON.parse(`"Repeat string result too long"`)]);
  });

  // line 1636: [.[] / ","]
  test(`[.[] / ","] | ["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`, () => {
    const input = JSON.parse(`["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`);
    const result = jq(`[.[] / ","]`, input);
    expect(result).toEqual([JSON.parse(`[["a"," bc"," def"," ghij"," jklmn"," a","b"," c","d"," e","f"],["a","b","c","d"," e","f","g","h"]]`)]);
  });

  // line 1640: [.[] / ", "]
  test(`[.[] / ", "] | ["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`, () => {
    const input = JSON.parse(`["a, bc, def, ghij, jklmn, a,b, c,d, e,f", "a,b,c,d, e,f,g,h"]`);
    const result = jq(`[.[] / ", "]`, input);
    expect(result).toEqual([JSON.parse(`[["a","bc","def","ghij","jklmn","a,b","c,d","e,f"],["a,b,c,d","e,f,g,h"]]`)]);
  });

  // line 1644: map(.[1] as $needle | .[0] | contains($needle))
  test(`map(.[1] as \$needle | .[0] | contains(\$needle)) | [[[],[]], [[1,2,3], [1,2]], [[1,2,3], [3,1]], [[1,2,3], [4]], [[1,2,3], [1,4]]]`, () => {
    const input = JSON.parse(`[[[],[]], [[1,2,3], [1,2]], [[1,2,3], [3,1]], [[1,2,3], [4]], [[1,2,3], [1,4]]]`);
    const result = jq(`map(.[1] as \$needle | .[0] | contains(\$needle))`, input);
    expect(result).toEqual([JSON.parse(`[true, true, true, false, false]`)]);
  });

  // line 1648: map(.[1] as $needle | .[0] | contains($needle))
  test(`map(.[1] as \$needle | .[0] | contains(\$needle)) | [[["foobar", "foobaz"], ["baz", "bar"]], [["foobar", "foobaz"], ["foo"]], [["foobar", "foobaz"], ["blap"]]]`, () => {
    const input = JSON.parse(`[[["foobar", "foobaz"], ["baz", "bar"]], [["foobar", "foobaz"], ["foo"]], [["foobar", "foobaz"], ["blap"]]]`);
    const result = jq(`map(.[1] as \$needle | .[0] | contains(\$needle))`, input);
    expect(result).toEqual([JSON.parse(`[true, true, false]`)]);
  });

  // line 1652: [({foo: 12, bar:13} | contains({foo: 12})), ({foo: 12} | contains({})), ({foo: 12, bar:13} | contains({baz:14}))]
  test(`[({foo: 12, bar:13} | contains({foo: 12})), ({foo: 12} | contains({})), ({foo: 12, bar:13} | contains({baz:14}))] | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`[({foo: 12, bar:13} | contains({foo: 12})), ({foo: 12} | contains({})), ({foo: 12, bar:13} | contains({baz:14}))]`, input);
    expect(result).toEqual([JSON.parse(`[true, true, false]`)]);
  });

  // line 1656: {foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {}}})
  test(`{foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {}}}) | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`{foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {}}})`, input);
    expect(result).toEqual([JSON.parse(`true`)]);
  });

  // line 1660: {foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {bar: 14}}})
  test(`{foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {bar: 14}}}) | {}`, () => {
    const input = JSON.parse(`{}`);
    const result = jq(`{foo: {baz: 12, blap: {bar: 13}}, bar: 14} | contains({bar: 14, foo: {blap: {bar: 14}}})`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1664: sort
  test(`sort | [42,[2,5,3,11],10,{"a":42,"b":2},{"a":42},true,2,[2,6],"hello",null,[2,5,6],{"a":[],"b":1},"abc","ab",[3,10],{},false,"abcd",null]`, () => {
    const input = JSON.parse(`[42,[2,5,3,11],10,{"a":42,"b":2},{"a":42},true,2,[2,6],"hello",null,[2,5,6],{"a":[],"b":1},"abc","ab",[3,10],{},false,"abcd",null]`);
    const result = jq(`sort`, input);
    expect(result).toEqual([JSON.parse(`[null,null,false,true,2,10,42,"ab","abc","abcd","hello",[2,5,3,11],[2,5,6],[2,6],[3,10],{},{"a":42},{"a":42,"b":2},{"a":[],"b":1}]`)]);
  });

  // line 1668: (sort_by(.b) | sort_by(.a)), sort_by(.a, .b), sort_by(.b, .c), group_by(.b), group_by(.a + .b - .c == 2)
  test(`(sort_by(.b) | sort_by(.a)), sort_by(.a, .b), sort_by(.b, .c), group_by(.b), group_by(.a + .b - .c == 2) | [{"a": 1, "b": 4, "c": 14}, {"a": 4, "b": 1, "c": 3}, {"a": 1, "b": 4, "c": 3}, {"a": 0, "b": 2, "c": 43}]`, () => {
    const input = JSON.parse(`[{"a": 1, "b": 4, "c": 14}, {"a": 4, "b": 1, "c": 3}, {"a": 1, "b": 4, "c": 3}, {"a": 0, "b": 2, "c": 43}]`);
    const result = jq(`(sort_by(.b) | sort_by(.a)), sort_by(.a, .b), sort_by(.b, .c), group_by(.b), group_by(.a + .b - .c == 2)`, input);
    expect(result).toEqual([JSON.parse(`[{"a": 0, "b": 2, "c": 43}, {"a": 1, "b": 4, "c": 14}, {"a": 1, "b": 4, "c": 3}, {"a": 4, "b": 1, "c": 3}]`), JSON.parse(`[{"a": 0, "b": 2, "c": 43}, {"a": 1, "b": 4, "c": 14}, {"a": 1, "b": 4, "c": 3}, {"a": 4, "b": 1, "c": 3}]`), JSON.parse(`[{"a": 4, "b": 1, "c": 3}, {"a": 0, "b": 2, "c": 43}, {"a": 1, "b": 4, "c": 3}, {"a": 1, "b": 4, "c": 14}]`), JSON.parse(`[[{"a": 4, "b": 1, "c": 3}], [{"a": 0, "b": 2, "c": 43}], [{"a": 1, "b": 4, "c": 14}, {"a": 1, "b": 4, "c": 3}]]`), JSON.parse(`[[{"a": 1, "b": 4, "c": 14}, {"a": 0, "b": 2, "c": 43}], [{"a": 4, "b": 1, "c": 3}, {"a": 1, "b": 4, "c": 3}]]`)]);
  });

  // line 1676: unique
  test(`unique | [1,2,5,3,5,3,1,3]`, () => {
    const input = JSON.parse(`[1,2,5,3,5,3,1,3]`);
    const result = jq(`unique`, input);
    expect(result).toEqual([JSON.parse(`[1,2,3,5]`)]);
  });

  // line 1680: unique
  test(`unique | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`unique`, input);
    expect(result).toEqual([JSON.parse(`[]`)]);
  });

  // line 1684: [min, max, min_by(.[1]), max_by(.[1]), min_by(.[2]), max_by(.[2])]
  test(`[min, max, min_by(.[1]), max_by(.[1]), min_by(.[2]), max_by(.[2])] | [[4,2,"a"],[3,1,"a"],[2,4,"a"],[1,3,"a"]]`, () => {
    const input = JSON.parse(`[[4,2,"a"],[3,1,"a"],[2,4,"a"],[1,3,"a"]]`);
    const result = jq(`[min, max, min_by(.[1]), max_by(.[1]), min_by(.[2]), max_by(.[2])]`, input);
    expect(result).toEqual([JSON.parse(`[[1,3,"a"],[4,2,"a"],[3,1,"a"],[2,4,"a"],[4,2,"a"],[1,3,"a"]]`)]);
  });

  // line 1688: [min,max,min_by(.),max_by(.)]
  test(`[min,max,min_by(.),max_by(.)] | []`, () => {
    const input = JSON.parse(`[]`);
    const result = jq(`[min,max,min_by(.),max_by(.)]`, input);
    expect(result).toEqual([JSON.parse(`[null,null,null,null]`)]);
  });

  // line 1692: .foo[.baz]
  test(`.foo[.baz] | {"foo":{"bar":4},"baz":"bar"}`, () => {
    const input = JSON.parse(`{"foo":{"bar":4},"baz":"bar"}`);
    const result = jq(`.foo[.baz]`, input);
    expect(result).toEqual([JSON.parse(`4`)]);
  });

  // line 1696: .[] | .error = "no, it's OK"
  test(`.[] | .error = "no, it's OK" | [{"error":true}]`, () => {
    const input = JSON.parse(`[{"error":true}]`);
    const result = jq(`.[] | .error = "no, it's OK"`, input);
    expect(result).toEqual([JSON.parse(`{"error": "no, it's OK"}`)]);
  });

  // line 1700: [{a:1}] | .[] | .a=999
  test(`[{a:1}] | .[] | .a=999 | null`, () => {
    const input = JSON.parse(`null`);
    const result = jq(`[{a:1}] | .[] | .a=999`, input);
    expect(result).toEqual([JSON.parse(`{"a": 999}`)]);
  });

  // line 1704: to_entries
  test(`to_entries | {"a": 1, "b": 2}`, () => {
    const input = JSON.parse(`{"a": 1, "b": 2}`);
    const result = jq(`to_entries`, input);
    expect(result).toEqual([JSON.parse(`[{"key":"a", "value":1}, {"key":"b", "value":2}]`)]);
  });

  // line 1708: from_entries
  test(`from_entries | [{"key":"a", "value":1}, {"Key":"b", "Value":2}, {"name":"c", "value":3}, {"Name":"d", "Value":4}]`, () => {
    const input = JSON.parse(`[{"key":"a", "value":1}, {"Key":"b", "Value":2}, {"name":"c", "value":3}, {"Name":"d", "Value":4}]`);
    const result = jq(`from_entries`, input);
    expect(result).toEqual([JSON.parse(`{"a": 1, "b": 2, "c": 3, "d": 4}`)]);
  });

  // line 1712: with_entries(.key |= "KEY_" + .)
  test(`with_entries(.key |= "KEY_" + .) | {"a": 1, "b": 2}`, () => {
    const input = JSON.parse(`{"a": 1, "b": 2}`);
    const result = jq(`with_entries(.key |= "KEY_" + .)`, input);
    expect(result).toEqual([JSON.parse(`{"KEY_a": 1, "KEY_b": 2}`)]);
  });

  // line 1716: map(has("foo"))
  test(`map(has("foo")) | [{"foo": 42}, {}]`, () => {
    const input = JSON.parse(`[{"foo": 42}, {}]`);
    const result = jq(`map(has("foo"))`, input);
    expect(result).toEqual([JSON.parse(`[true, false]`)]);
  });

  // line 1720: map(has(2))
  test(`map(has(2)) | [[0,1], ["a","b","c"]]`, () => {
    const input = JSON.parse(`[[0,1], ["a","b","c"]]`);
    const result = jq(`map(has(2))`, input);
    expect(result).toEqual([JSON.parse(`[false, true]`)]);
  });

  // line 1724: has(nan)
  test(`has(nan) | [0,1,2]`, () => {
    const input = JSON.parse(`[0,1,2]`);
    const result = jq(`has(nan)`, input);
    expect(result).toEqual([JSON.parse(`false`)]);
  });

  // line 1728: keys
  test(`keys | [42,3,35]`, () => {
    const input = JSON.parse(`[42,3,35]`);
    const result = jq(`keys`, input);
    expect(result).toEqual([JSON.parse(`[0,1,2]`)]);
  });

  // line 1732: [][.]
  test(`[][.] | 1000000000000000000`, () => {
    const input = JSON.parse(`1000000000000000000`);
    const result = jq(`[][.]`, input);
    expect(result).toEqual([JSON.parse(`null`)]);
  });

  // line 1736: map([1,2][0:.])
  test(`map([1,2][0:.]) | [-1, 1, 2, 3, 1000000000000000000]`, () => {
    const input = JSON.parse(`[-1, 1, 2, 3, 1000000000000000000]`);
    const result = jq(`map([1,2][0:.])`, input);
    expect(result).toEqual([JSON.parse(`[[1], [1], [1,2], [1,2], [1,2]]`)]);
  });

  // line 2495: try ltrimstr(1) catch "x", try rtrimstr(1) catch "x" | "ok"
  test(`try ltrimstr(1) catch "x", try rtrimstr(1) catch "x" | "ok" | "hi"`, () => {
    const input = JSON.parse(`"hi"`);
    const result = jq(`try ltrimstr(1) catch "x", try rtrimstr(1) catch "x" | "ok"`, input);
    expect(result).toEqual([JSON.parse(`"ok"`), JSON.parse(`"ok"`)]);
  });

  // line 2500: try ltrimstr("x") catch "x", try rtrimstr("x") catch "x" | "ok"
  test(`try ltrimstr("x") catch "x", try rtrimstr("x") catch "x" | "ok" | {"hey":[]}`, () => {
    const input = JSON.parse(`{"hey":[]}`);
    const result = jq(`try ltrimstr("x") catch "x", try rtrimstr("x") catch "x" | "ok"`, input);
    expect(result).toEqual([JSON.parse(`"ok"`), JSON.parse(`"ok"`)]);
  });

  // line 2507: .[] as [$x, $y] | try ["ok", ($x | ltrimstr($y))] catch ["ko", .]
  test(`.[] as [\$x, \$y] | try ["ok", (\$x | ltrimstr(\$y))] catch ["ko", .] | [["hi",1],[1,"hi"],["hi","hi"],[1,1]]`, () => {
    const input = JSON.parse(`[["hi",1],[1,"hi"],["hi","hi"],[1,1]]`);
    const result = jq(`.[] as [\$x, \$y] | try ["ok", (\$x | ltrimstr(\$y))] catch ["ko", .]`, input);
    expect(result).toEqual([JSON.parse(`["ko","startswith() requires string inputs"]`), JSON.parse(`["ko","startswith() requires string inputs"]`), JSON.parse(`["ok",""]`), JSON.parse(`["ko","startswith() requires string inputs"]`)]);
  });

  // line 2514: .[] as [$x, $y] | try ["ok", ($x | rtrimstr($y))] catch ["ko", .]
  test(`.[] as [\$x, \$y] | try ["ok", (\$x | rtrimstr(\$y))] catch ["ko", .] | [["hi",1],[1,"hi"],["hi","hi"],[1,1]]`, () => {
    const input = JSON.parse(`[["hi",1],[1,"hi"],["hi","hi"],[1,1]]`);
    const result = jq(`.[] as [\$x, \$y] | try ["ok", (\$x | rtrimstr(\$y))] catch ["ko", .]`, input);
    expect(result).toEqual([JSON.parse(`["ko","endswith() requires string inputs"]`), JSON.parse(`["ko","endswith() requires string inputs"]`), JSON.parse(`["ok",""]`), JSON.parse(`["ko","endswith() requires string inputs"]`)]);
  });

  // line 2539: strflocaltime("" | ., @uri)
  test(`strflocaltime("" | ., @uri) | 0`, () => {
    const input = JSON.parse(`0`);
    const result = jq(`strflocaltime("" | ., @uri)`, input);
    expect(result).toEqual([JSON.parse(`""`), JSON.parse(`""`)]);
  });

});
