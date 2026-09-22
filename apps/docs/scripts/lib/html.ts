// SPDX-License-Identifier: MIT
// Reads the prerendered pages. The search index and the machine-readable surface are both generated
// from the built HTML (docs pack 01 §7: "from the same page components and locale files as the
// HTML, so it can never say anything the site does not"), which is why this file exists instead of
// a second rendering path.

const ENTITIES: Readonly<Record<string, string>> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x27;': "'",
  '&#39;': "'",
  '&nbsp;': ' ',
  '&#x2F;': '/',
};

function decode(value: string): string {
  return value.replaceAll(/&(?:amp|lt|gt|quot|nbsp|#x27|#39|#x2F);/g, (entity) => ENTITIES[entity] ?? entity);
}

/** The inner HTML of the page's `main`, which is everything the reader sees as content. */
export function mainOf(html: string): string {
  const start = html.indexOf('<main');
  if (start === -1) return '';
  const open = html.indexOf('>', start) + 1;
  const end = html.indexOf('</main>', open);
  return end === -1 ? '' : html.slice(open, end);
}

/**
 * The page's own content: `main` without the chrome that frames it. Breadcrumbs and the prev/next
 * cards are navigation, and a Markdown twin or a search snippet that repeated them would bury the
 * page's first real sentence.
 */
export function contentOf(html: string): string {
  return mainOf(html)
    .replace(/<nav class="ds-breadcrumbs"[\s\S]*?<\/nav>/, '')
    .replace(/<div class="ds-prevnext"[\s\S]*?<\/div>\s*$/, '');
}

export function titleOf(html: string): string {
  return decode(/<title[^>]*>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '');
}

export function descriptionOf(html: string): string {
  return decode(/<meta name="description" content="([^"]*)"/.exec(html)?.[1] ?? '');
}

export interface Heading {
  readonly id: string;
  readonly text: string;
  readonly depth: 2 | 3;
}

export function headingsOf(html: string): Heading[] {
  const headings: Heading[] = [];
  for (const match of html.matchAll(/<(h2|h3)[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    headings.push({ id: match[2] as string, text: text(match[3] ?? ''), depth: match[1] === 'h3' ? 3 : 2 });
  }
  return headings;
}

/** Tags out, entities in, whitespace collapsed. */
export function text(html: string): string {
  return decode(html.replaceAll(/<[^>]*>/g, ' '))
    .replaceAll(/\s+/g, ' ')
    .trim();
}

/** The breadcrumb trail of a page, as ` › `-joined labels. */
export function crumbOf(html: string): string {
  const nav = /<nav class="ds-breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/.exec(html)?.[1] ?? '';
  return [...nav.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)]
    .map((match) => text(match[1] ?? ''))
    .filter((label) => label !== '')
    .join(' › ');
}

interface Block {
  readonly tag: string;
  readonly attributes: string;
  readonly inner: string;
}

/** Top-level blocks of a fragment, in document order. */
function blocks(html: string): Block[] {
  const found: Block[] = [];
  const pattern = /<(h1|h2|h3|h4|p|ul|ol|pre|table|div|section)\b([^>]*)>/g;
  let match = pattern.exec(html);
  while (match !== null) {
    const tag = match[1] as string;
    const open = match.index;
    const contentStart = open + match[0].length;
    let depth = 1;
    const scanner = new RegExp(`</?${tag}\\b[^>]*>`, 'g');
    scanner.lastIndex = contentStart;
    let end = html.length;
    let inner = scanner.exec(html);
    while (inner !== null) {
      depth += inner[0].startsWith('</') ? -1 : 1;
      if (depth === 0) {
        end = inner.index;
        break;
      }
      inner = scanner.exec(html);
    }
    found.push({ tag, attributes: match[2] ?? '', inner: html.slice(contentStart, end) });
    pattern.lastIndex = end;
    match = pattern.exec(html);
  }
  return found;
}

function inline(html: string): string {
  return decode(
    html
      .replaceAll(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/g, '**$2**')
      .replaceAll(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/g, '_$2_')
      .replaceAll(/<(code|kbd)[^>]*>([\s\S]*?)<\/\1>/g, '`$2`')
      .replaceAll(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, '[$2]($1)')
      .replaceAll(/<[^>]*>/g, ''),
  )
    .replaceAll(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Markdown for a page's content: the `.md` twin and `llms-full.md` are this, per page. Only the
 * blocks the doc primitives produce are handled; anything else degrades to its text.
 */
export function toMarkdown(html: string): string {
  const lines: string[] = [];
  for (const block of blocks(html)) {
    switch (block.tag) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4': {
        const level = '#'.repeat(Number(block.tag.slice(1)));
        lines.push(`${level} ${inline(block.inner)}`, '');
        break;
      }
      case 'p': {
        const body = inline(block.inner);
        if (body !== '') lines.push(body, '');
        break;
      }
      case 'ul':
      case 'ol': {
        const items = [...block.inner.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)].map((item) => inline(item[1] ?? ''));
        items.forEach((item, index) => {
          lines.push(block.tag === 'ol' ? `${String(index + 1)}. ${item}` : `- ${item}`);
        });
        if (items.length > 0) lines.push('');
        break;
      }
      case 'pre': {
        const language = /data-lang="([^"]*)"/.exec(block.attributes)?.[1] ?? '';
        lines.push(`\`\`\`${language}`, decode(block.inner.replaceAll(/<[^>]*>/g, '')).trimEnd(), '```', '');
        break;
      }
      case 'table': {
        const rows = [...block.inner.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map((row) =>
          [...(row[1] ?? '').matchAll(/<(th|td)[^>]*>([\s\S]*?)<\/\1>/g)].map((cell) => inline(cell[2] ?? '')),
        );
        rows.forEach((cells, index) => {
          lines.push(`| ${cells.join(' | ')} |`);
          if (index === 0) lines.push(`| ${cells.map(() => '---').join(' | ')} |`);
        });
        if (rows.length > 0) lines.push('');
        break;
      }
      default: {
        // `div` and `section` are wrappers (code blocks, callouts, demos): recurse into them.
        const nested = toMarkdown(block.inner);
        if (nested !== '') lines.push(nested);
        break;
      }
    }
  }
  return lines
    .join('\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}
