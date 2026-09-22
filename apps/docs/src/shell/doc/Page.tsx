// SPDX-License-Identifier: MIT
// The frame every page shares (docs pack 03 §1, 11 §11): breadcrumbs, the single `h1` from
// `meta.title`, the lead from `meta.description`, the page's own sections, then prev/next. The
// document head is set by the route module, from the same two keys (01 §9).
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { useT } from '~/i18n/useT';
import { Breadcrumbs } from '../Breadcrumbs';
import { PrevNext } from '../PrevNext';

export function Page({ ns, children }: { ns: string; children?: React.ReactNode }): React.ReactElement {
  const t = useT(ns);
  const heading = useRef<HTMLHeadingElement>(null);
  const { pathname } = useLocation();
  const first = useRef(true);

  // On a client navigation focus moves to the new page's title (01 §6); on the first load it stays
  // where the browser put it.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    heading.current?.focus();
  }, [pathname]);

  return (
    <>
      <Breadcrumbs />
      <h1 ref={heading} tabIndex={-1}>
        {t('meta.title')}
      </h1>
      <p className="ds-lead">{t('meta.description')}</p>
      {children}
      <PrevNext />
    </>
  );
}
