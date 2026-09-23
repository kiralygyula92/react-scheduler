// SPDX-License-Identifier: MIT
// Version select (docs pack 02 §6.1, 10 §3.4): a pill in the navbar labelled `v{major}.{minor}`
// (O14), opening the list from `content/versions.json`. The current entry's label comes from the
// package's own version, so the two can never disagree.
import { useCallback, useRef, useState } from 'react';
import { useT } from '~/i18n/useT';
import versions from '~/content/versions.json';
import { useDismissOnOutside, useEscape } from './hooks';
import { CheckIcon, ChevronDownIcon } from './icons';
import { site } from './nav';

interface VersionEntry {
  readonly label: string;
  readonly href: string;
  readonly current?: boolean;
  readonly supported?: boolean;
}

const entries: readonly VersionEntry[] = versions;

/** `1.4.2` → `v1.4`, the label O14 fixed for every plugin site. */
export function versionLabel(version: string): string {
  const [major = '0', minor = '0'] = version.split('.');
  return `v${major}.${minor}`;
}

function labelOf(entry: VersionEntry): string {
  return entry.current === true ? versionLabel(site.version) : entry.label;
}

export function VersionMenu(): React.ReactElement {
  const t = useT('common');
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLAnchorElement | null)[]>([]);
  const current = entries.find((entry) => entry.current === true) ?? entries[0];

  const close = useCallback(() => {
    setOpen(false);
    button.current?.focus();
  }, []);
  useEscape(open, close);
  const container = useDismissOnOutside(open, () => {
    setOpen(false);
  });

  const onItemKeyDown = (event: React.KeyboardEvent, index: number): void => {
    const last = entries.length - 1;
    const move = (to: number): void => {
      event.preventDefault();
      items.current[to]?.focus();
    };
    if (event.key === 'ArrowDown') move(index === last ? 0 : index + 1);
    else if (event.key === 'ArrowUp') move(index === 0 ? last : index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(last);
  };

  return (
    // See LanguageMenu: shell.css gives `.ds-menu` no positioned ancestor (EXCEPTIONS.md #7).
    <div className="ds-menu-anchor" style={{ position: 'relative' }} ref={container}>
      <button
        type="button"
        ref={button}
        className="ds-version"
        aria-label={t('shell.version')}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((was) => !was);
        }}
      >
        {current === undefined ? '' : labelOf(current)}
        <ChevronDownIcon />
      </button>
      {open && (
        <ul className="ds-menu" role="menu" aria-label={t('shell.version')}>
          {entries.map((entry, index) => (
            <li key={entry.href} role="none">
              {/* Other majors live on their own deployments, so these are plain links. */}
              <a
                role="menuitem"
                className="ds-menu__item"
                ref={(node) => {
                  items.current[index] = node;
                }}
                href={entry.href}
                aria-current={entry.current === true ? 'true' : undefined}
                onKeyDown={(event) => {
                  onItemKeyDown(event, index);
                }}
              >
                {labelOf(entry)}
                {entry.current === true && <CheckIcon />}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
