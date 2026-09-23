// SPDX-License-Identifier: MIT
// A page section: the heading the table of contents lists and the anchor links point at. The id is
// the English slug of the heading key (docs pack 01 §1 R7), so anchors are the same in every locale.
import { useT } from '~/i18n/useT';
import { useRegisterHeading } from '../Toc';

export function Section({
  id,
  ns,
  titleKey,
  level = 2,
  children,
}: {
  id: string;
  ns: string;
  titleKey: string;
  level?: 2 | 3;
  children?: React.ReactNode;
}): React.ReactElement {
  const t = useT(ns);
  const text = t(titleKey);
  useRegisterHeading({ id, text, depth: level });

  return (
    <>
      {level === 2 ? <h2 id={id}>{text}</h2> : <h3 id={id}>{text}</h3>}
      {children}
    </>
  );
}
