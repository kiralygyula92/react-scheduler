// SPDX-License-Identifier: MIT
// "On this page" (docs pack 02 §6.6, 11 §6). Headings are registered by the page's `Section`
// components while they render — not scraped from the DOM and not collected in an effect — so the
// prerendered HTML already contains the list. The active entry comes from an IntersectionObserver
// offset by the navbar height.
import { createContext, use, useEffect, useState } from 'react';
import { useT } from '~/i18n/useT';

export interface Heading {
  readonly id: string;
  readonly text: string;
  readonly depth: 2 | 3;
}

/** A collector, fresh for each render pass of the page. */
interface TocStore {
  readonly headings: Heading[];
}

const TocContext = createContext<TocStore | null>(null);

/**
 * `AppShell` renders `main` before `Toc`, so the sections of this pass have already added
 * themselves by the time the list is read. A new collector per pass is what keeps a re-render (or
 * Strict Mode's double render) from doubling the list.
 */
export function TocProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const store: TocStore = { headings: [] };
  return <TocContext value={store}>{children}</TocContext>;
}

export function useRegisterHeading(heading: Heading): void {
  const store = use(TocContext);
  if (store !== null && !store.headings.some((known) => known.id === heading.id)) store.headings.push(heading);
}

export function useHeadings(): readonly Heading[] {
  return use(TocContext)?.headings ?? [];
}

function useActiveHeading(ids: readonly string[]): string | undefined {
  const [active, setActive] = useState<string | undefined>(undefined);
  const key = ids.join(',');
  useEffect(() => {
    if (key === '') return;
    const navbar = Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ds-navbar-h'), 10);
    const top = (Number.isNaN(navbar) ? 64 : navbar) + 16;
    const order = key.split(',');
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting);
        const visible = order.find((id) => seen.get(id) === true);
        setActive((previous) => visible ?? previous);
      },
      { rootMargin: `-${String(top)}px 0px -70% 0px` },
    );
    for (const id of order) {
      const element = document.getElementById(id);
      if (element !== null) observer.observe(element);
    }
    return () => {
      observer.disconnect();
    };
  }, [key]);
  return active ?? ids[0];
}

export function Toc(): React.ReactElement | null {
  const t = useT('common');
  const headings = useHeadings();
  const active = useActiveHeading(headings.map((heading) => heading.id));
  // Fewer than two headings is not a table of contents (02 §6.6).
  if (headings.length < 2) return null;

  return (
    <aside className="ds-toc" aria-labelledby="ds-toc-title">
      <p className="ds-toc__title" id="ds-toc-title">
        {t('toc.title')}
      </p>
      <ul>
        {headings.map((heading) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              data-depth={heading.depth}
              aria-current={heading.id === active ? 'true' : undefined}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}
