// SPDX-License-Identifier: MIT
// The highlighter (docs pack 07 §5). The contract is narrow on purpose: it must never change the
// code, and it must classify the constructs the documentation actually shows.
import { describe, expect, it } from 'vitest';
import { highlight, type Language, tokenize } from '~/lib/highlight';

function rendered(code: string, lang: Language): string {
  return tokenize(code, lang)
    .map((token) => token.text)
    .join('');
}

function kindOf(code: string, lang: Language, text: string): string | undefined {
  return tokenize(code, lang).find((token) => token.text === text)?.kind;
}

function kindsOf(code: string, lang: Language, text: string): (string | undefined)[] {
  return tokenize(code, lang)
    .filter((token) => token.text === text)
    .map((token) => token.kind);
}

const SAMPLES: Record<Language, string> = {
  tsx: `import { Scheduler } from '@react-schedulerkit/react-scheduler';\n\n// A day of shifts\nexport function App(): React.ReactElement {\n  const items = useItems(3);\n  return <Scheduler view="timeline" items={items} />;\n}\n`,
  ts: `export type View = 'list' | 'timeline';\nconst DEFAULT: View = 'list';\n`,
  bash: `# install\npnpm add @react-schedulerkit/react-scheduler --save-exact\n`,
  json: `{ "view": "timeline", "compact": true, "levels": 3 }`,
  css: `/* theme */\n.rs-root { --rs-gap: 8px; color: var(--rs-text); }`,
};

describe('every language', () => {
  it.each(Object.keys(SAMPLES) as Language[])('%s keeps the code byte for byte', (lang) => {
    expect(rendered(SAMPLES[lang], lang)).toBe(SAMPLES[lang]);
  });

  it.each(Object.keys(SAMPLES) as Language[])('%s classifies something', (lang) => {
    expect(tokenize(SAMPLES[lang], lang).some((token) => token.kind !== undefined)).toBe(true);
  });
});

describe('tsx', () => {
  const code = SAMPLES.tsx;

  it('marks keywords, strings and comments', () => {
    expect(kindOf(code, 'tsx', 'import')).toBe('keyword');
    expect(kindOf(code, 'tsx', "'@react-schedulerkit/react-scheduler'")).toBe('string');
    expect(kindOf(code, 'tsx', '// A day of shifts')).toBe('comment');
  });

  it('marks components as tags and calls as functions', () => {
    // The same name is a type where it is imported and part of the tag where it is rendered.
    expect(kindsOf(code, 'tsx', 'Scheduler')).toEqual(['type']);
    expect(kindOf(code, 'tsx', '<Scheduler')).toBe('tag');
    expect(kindOf(code, 'tsx', 'view')).toBe('attr');
    expect(kindOf(code, 'tsx', 'useItems')).toBe('function');
  });

  it('does not take a string apart', () => {
    expect(kindOf(`const s = 'const';`, 'ts', "'const'")).toBe('string');
  });

  it('leaves a comment whole even when it contains code', () => {
    expect(kindOf(`// const x = 1;`, 'ts', '// const x = 1;')).toBe('comment');
  });
});

describe('json', () => {
  it('separates keys from values', () => {
    expect(kindOf(SAMPLES.json, 'json', '"view"')).toBe('property');
    expect(kindOf(SAMPLES.json, 'json', '"timeline"')).toBe('string');
    expect(kindOf(SAMPLES.json, 'json', 'true')).toBe('keyword');
    expect(kindOf(SAMPLES.json, 'json', '3')).toBe('number');
  });
});

describe('css', () => {
  it('marks selectors, custom properties and values', () => {
    expect(kindOf(SAMPLES.css, 'css', '.rs-root')).toBe('tag');
    expect(kindOf(SAMPLES.css, 'css', '--rs-gap')).toBe('attr');
    expect(kindOf(SAMPLES.css, 'css', '8px')).toBe('number');
  });
});

describe('bash', () => {
  it('marks the command, its flags and comments', () => {
    expect(kindOf(SAMPLES.bash, 'bash', 'pnpm')).toBe('function');
    expect(kindOf(SAMPLES.bash, 'bash', '--save-exact')).toBe('attr');
    expect(kindOf(SAMPLES.bash, 'bash', '# install')).toBe('comment');
  });
});

describe('highlight', () => {
  it('splits into lines without losing anything', () => {
    const lines = highlight(SAMPLES.tsx.trimEnd(), 'tsx');
    expect(lines).toHaveLength(SAMPLES.tsx.trimEnd().split('\n').length);
    expect(lines.map((line) => line.map((token) => token.text).join('')).join('\n')).toBe(SAMPLES.tsx.trimEnd());
  });

  it('handles an empty string', () => {
    expect(highlight('', 'ts')).toEqual([[]]);
  });
});
