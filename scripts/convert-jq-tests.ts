/**
 * Converts jq's test format (jq.test) into vitest test cases, split by module.
 *
 * jq.test format: groups of lines
 * - Lines starting with # are comments (section headers detected by pattern)
 * - Blank lines separate test groups
 * - %%FAIL marks an expected-failure test (skip these)
 * - Otherwise: first non-blank line is filter, second is input,
 *   remaining lines until next blank are expected outputs (one per line)
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

interface TestCase {
  filter: string;
  input: string;
  outputs: string[];
  line: number;
  section: string;
}

// Map section header patterns to module file names
const SECTION_MAP: [RegExp, string][] = [
  [/simple value/i, 'values'],
  [/dictionary construction|object construction/i, 'objects'],
  [/field access|piping/i, 'access'],
  [/chaining|suffix/i, 'access'],
  [/negative array ind/i, 'access'],
  [/multiple outputs|iteration/i, 'iteration'],
  [/slice/i, 'slices'],
  [/variable/i, 'variables'],
  [/builtin func/i, 'builtins'],
  [/user.defined func|^def /i, 'def'],
  [/precedence.*def/i, 'def'],
  [/many argument/i, 'def'],
  [/math|trig|floor|ceil|sqrt/i, 'math'],
  [/number/i, 'numbers'],
  [/string|escape|unicode|interpolat/i, 'strings'],
  [/try.catch|error/i, 'errors'],
  [/reduce|foreach|label/i, 'reduce'],
  [/recursi/i, 'recursion'],
  [/walk/i, 'walk'],
  [/path/i, 'paths'],
  [/regex|onig|match|test|capture|scan|sub|gsub/i, 'regex'],
  [/format|base64|csv|tsv|html|uri|@/i, 'format'],
  [/sort|group|unique/i, 'sort'],
  [/regression/i, 'regression'],
  [/nan|inf|NaN/i, 'numbers'],
  [/explode|implode/i, 'strings'],
  [/ltrimstr|rtrimstr/i, 'strings'],
  [/setpath|getpath|delpaths/i, 'paths'],
];

function classifySection(header: string): string {
  for (const [pattern, module] of SECTION_MAP) {
    if (pattern.test(header)) return module;
  }
  return 'misc';
}

interface Section {
  name: string;
  module: string;
  startLine: number;
}

function parseJqTests(content: string): Map<string, TestCase[]> {
  const lines = content.split('\n');
  const modules = new Map<string, TestCase[]>();
  let currentSection = 'misc';
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;

    // Detect section headers in comments (all # lines are comments, skip them)
    if (line.startsWith('#')) {
      const headerText = line.replace(/^#+\s*/, '').trim();
      if (headerText.length > 3) {
        const detected = classifySection(headerText);
        if (detected !== 'misc') {
          currentSection = detected;
        }
      }
      i++;
      continue;
    }

    // Skip blank lines
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Check for %%FAIL — skip this block (handles %%FAIL and %%FAIL IGNORE MSG variants)
    if (line.trim().startsWith('%%FAIL')) {
      i++;
      while (i < lines.length && lines[i]!.trim() !== '') i++;
      continue;
    }

    const filterLine = i;
    const filter = line;
    i++;

    if (i >= lines.length) break;
    // Strip BOM (U+FEFF) from input lines
    const input = lines[i]!.replace(/^\uFEFF/, '');
    i++;

    const outputs: string[] = [];
    while (i < lines.length && lines[i]!.trim() !== '' && !lines[i]!.startsWith('#')) {
      outputs.push(lines[i]!);
      i++;
    }

    if (outputs.length > 0) {
      const tc: TestCase = { filter, input, outputs, line: filterLine + 1, section: currentSection };
      if (!modules.has(currentSection)) modules.set(currentSection, []);
      modules.get(currentSection)!.push(tc);
    }
  }

  return modules;
}

function escapeTemplateLiteral(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

function generateTestFile(moduleName: string, cases: TestCase[]): string {
  const lines: string[] = [];
  lines.push(`// Auto-generated from jq's test suite (ref-jq/tests/jq.test)`);
  lines.push(`// Licensed under MIT (Copyright (c) 2012 Stephen Dolan)`);
  lines.push(`// See: https://github.com/jqlang/jq/blob/master/COPYING`);
  lines.push(``);
  lines.push(`import { describe, expect, test } from 'vitest';`);
  lines.push(`import { jq } from '../../src/index.js';`);
  lines.push(``);
  lines.push(`describe('jq official: ${moduleName}', () => {`);

  for (const tc of cases) {
    const filterEsc = escapeTemplateLiteral(tc.filter);
    const inputEsc = escapeTemplateLiteral(tc.input);

    const expectedItems = tc.outputs.map((o) => {
      const escaped = escapeTemplateLiteral(o);
      return `JSON.parse(\`${escaped}\`)`;
    });

    lines.push(`  // line ${tc.line}: ${tc.filter}`);
    lines.push(`  test(\`${filterEsc} | ${inputEsc}\`, () => {`);
    lines.push(`    const input = JSON.parse(\`${inputEsc}\`);`);
    lines.push(`    const result = jq(\`${filterEsc}\`, input);`);
    lines.push(`    expect(result).toEqual([${expectedItems.join(', ')}]);`);
    lines.push(`  });`);
    lines.push(``);
  }

  lines.push(`});`);
  lines.push(``);
  return lines.join('\n');
}

// --- Main ---

const content = readFileSync('ref-jq/tests/jq.test', 'utf-8');
const modules = parseJqTests(content);

mkdirSync('tests/official', { recursive: true });

let total = 0;
for (const [moduleName, cases] of modules) {
  const output = generateTestFile(moduleName, cases);
  const filename = `tests/official/${moduleName}.test.ts`;
  writeFileSync(filename, output);
  console.log(`  ${filename}: ${cases.length} tests`);
  total += cases.length;
}

console.log(`\nTotal: ${total} test cases across ${modules.size} modules`);
