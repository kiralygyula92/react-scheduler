// SPDX-License-Identifier: MIT
// The site's syntax highlighter (docs pack 07 §5: no third-party highlighting library). It covers
// exactly the languages the documentation shows — tsx, ts, bash, json and css — and emits the token
// classes shell.css already styles (`ds-t-*`). Anything it cannot classify stays plain text, which
// is the only failure mode: code is never altered, only coloured.

export type TokenKind =
  | 'keyword'
  | 'string'
  | 'number'
  | 'comment'
  | 'function'
  | 'type'
  | 'tag'
  | 'attr'
  | 'punct'
  | 'operator'
  | 'property';

export interface Token {
  readonly text: string;
  readonly kind?: TokenKind;
}

/** The languages the documentation shows (docs pack 04 §2). */
export type Language = 'tsx' | 'ts' | 'jsx' | 'js' | 'json' | 'bash' | 'css' | 'html' | 'md' | 'text';

interface Rule {
  readonly pattern: RegExp;
  readonly kind: TokenKind;
  /** When set, only this capture group is coloured; the rest stays plain. */
  readonly group?: number;
}

const TS_KEYWORDS =
  /\b(?:as|async|await|break|case|catch|class|const|continue|default|delete|do|else|enum|export|extends|finally|for|from|function|if|implements|import|in|instanceof|interface|let|new|of|readonly|return|satisfies|static|switch|this|throw|try|type|typeof|var|void|while|yield|true|false|null|undefined)\b/;

const TS_RULES: readonly Rule[] = [
  { pattern: /\/\/[^\n]*/, kind: 'comment' },
  { pattern: /\/\*[\s\S]*?\*\//, kind: 'comment' },
  { pattern: /`(?:\\.|[^`\\])*`/, kind: 'string' },
  { pattern: /'(?:\\.|[^'\\\n])*'/, kind: 'string' },
  { pattern: /"(?:\\.|[^"\\\n])*"/, kind: 'string' },
  // The bracket travels with the name: a bare `<` would be read as an operator, and an operator
  // match starts one character earlier, so it would win.
  { pattern: /<\/?[A-Za-z][\w.]*/, kind: 'tag' },
  { pattern: /\b([a-z]\w*)(?==[{"'])/i, kind: 'attr', group: 1 },
  { pattern: TS_KEYWORDS, kind: 'keyword' },
  { pattern: /\b\d[\d_]*(?:\.\d+)?(?:e[+-]?\d+)?\b/i, kind: 'number' },
  { pattern: /\.([a-z_$][\w$]*)/i, kind: 'property', group: 1 },
  { pattern: /\b([a-z_$][\w$]*)(?=\s*\()/i, kind: 'function' },
  { pattern: /\b[A-Z][\w$]*\b/, kind: 'type' },
  { pattern: /[=!<>+\-*/%&|^~?:]+/, kind: 'operator' },
  { pattern: /[{}()[\];,.]/, kind: 'punct' },
];

const BASH_RULES: readonly Rule[] = [
  { pattern: /#[^\n]*/, kind: 'comment' },
  { pattern: /'(?:\\.|[^'\\])*'/, kind: 'string' },
  { pattern: /"(?:\\.|[^"\\])*"/, kind: 'string' },
  { pattern: /(?:^|\s)(--?[\w-]+)/, kind: 'attr', group: 1 },
  { pattern: /^\s*([\w./-]+)/m, kind: 'function', group: 1 },
  { pattern: /\$\{?[\w]+\}?/, kind: 'property' },
  { pattern: /\b\d+\b/, kind: 'number' },
  { pattern: /[|&><]+/, kind: 'operator' },
];

const JSON_RULES: readonly Rule[] = [
  { pattern: /"(?:\\.|[^"\\])*"(?=\s*:)/, kind: 'property' },
  { pattern: /"(?:\\.|[^"\\])*"/, kind: 'string' },
  { pattern: /\b(?:true|false|null)\b/, kind: 'keyword' },
  { pattern: /-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i, kind: 'number' },
  { pattern: /[{}[\],:]/, kind: 'punct' },
];

const CSS_RULES: readonly Rule[] = [
  { pattern: /\/\*[\s\S]*?\*\//, kind: 'comment' },
  { pattern: /@[\w-]+/, kind: 'keyword' },
  { pattern: /(--[\w-]+)/, kind: 'attr' },
  { pattern: /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/, kind: 'string' },
  { pattern: /([\w-]+)(?=\s*:)/, kind: 'property' },
  { pattern: /\b\d+(?:\.\d+)?(?:px|rem|em|%|s|ms|vh|vw|dvh|fr|deg)?\b/, kind: 'number' },
  { pattern: /[.#&][\w-]+|::?[\w-]+/, kind: 'tag' },
  { pattern: /[{}();,:]/, kind: 'punct' },
];

const HTML_RULES: readonly Rule[] = [
  { pattern: /<!--[\s\S]*?-->/, kind: 'comment' },
  { pattern: /<!DOCTYPE[^>]*>/i, kind: 'keyword' },
  { pattern: /<\/?[a-z][\w-]*/i, kind: 'tag' },
  { pattern: /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/, kind: 'string' },
  { pattern: /\b([a-z-]+)(?==)/i, kind: 'attr', group: 1 },
  { pattern: /\/?>/, kind: 'punct' },
];

const MARKDOWN_RULES: readonly Rule[] = [
  { pattern: /^#{1,6} [^\n]*/m, kind: 'keyword' },
  { pattern: /```[\s\S]*?```/, kind: 'string' },
  { pattern: /`[^`\n]+`/, kind: 'string' },
  { pattern: /\[([^\]]*)\]/, kind: 'tag', group: 1 },
  { pattern: /\(([^)\s]+)\)/, kind: 'property', group: 1 },
  { pattern: /\*\*[^*\n]+\*\*/, kind: 'type' },
  { pattern: /^\s*(?:[-*+]|\d+\.) /m, kind: 'punct' },
];

const RULES: Readonly<Record<Language, readonly Rule[]>> = {
  tsx: TS_RULES,
  ts: TS_RULES,
  // JSX and JS are the same grammar as far as colouring goes; the type keywords simply never occur.
  jsx: TS_RULES,
  js: TS_RULES,
  bash: BASH_RULES,
  json: JSON_RULES,
  css: CSS_RULES,
  html: HTML_RULES,
  md: MARKDOWN_RULES,
  // Plain text is shown as it is.
  text: [],
};

/** The earliest match among the rules, preferring the rule listed first on a tie. */
function nextMatch(
  source: string,
  from: number,
  rules: readonly Rule[],
): { start: number; end: number; token: Token } | null {
  let best: { start: number; end: number; token: Token } | null = null;
  for (const rule of rules) {
    const pattern = new RegExp(rule.pattern.source, rule.pattern.flags.includes('m') ? 'gm' : 'g');
    pattern.lastIndex = from;
    const match = pattern.exec(source);
    if (match === null) continue;
    const text = rule.group === undefined ? match[0] : match[rule.group];
    if (text === undefined || text === '') continue;
    const start = rule.group === undefined ? match.index : match.index + match[0].indexOf(text);
    if (best !== null && start >= best.start) continue;
    best = { start, end: start + text.length, token: { text, kind: rule.kind } };
  }
  return best;
}

/** Splits code into tokens; plain runs carry no kind. */
export function tokenize(code: string, lang: Language): readonly Token[] {
  const rules = RULES[lang];
  const tokens: Token[] = [];
  let at = 0;
  while (at < code.length) {
    const match = nextMatch(code, at, rules);
    if (match === null) break;
    if (match.start > at) tokens.push({ text: code.slice(at, match.start) });
    tokens.push(match.token);
    at = match.end;
  }
  if (at < code.length) tokens.push({ text: code.slice(at) });
  return tokens;
}

/** The same tokens, split at line boundaries, which is how a code block renders them. */
export function highlight(code: string, lang: Language): readonly (readonly Token[])[] {
  const lines: Token[][] = [[]];
  for (const token of tokenize(code, lang)) {
    const parts = token.text.split('\n');
    parts.forEach((part, index) => {
      if (index > 0) lines.push([]);
      if (part !== '') (lines.at(-1) as Token[]).push({ text: part, ...(token.kind && { kind: token.kind }) });
    });
  }
  return lines;
}
