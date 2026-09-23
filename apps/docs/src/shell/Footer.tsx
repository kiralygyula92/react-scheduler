// SPDX-License-Identifier: MIT
// Footer (docs pack 02 §6.10). Four columns built from page ids that every plugin site has by
// definition (01 §3 fixes them), so the structure is identical everywhere and nothing is
// hand-written. The bottom row carries the licence line and the two machine-readable links.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { flatItems, site, useNav } from './nav';
import { versionLabel } from './VersionMenu';

const COLUMNS: readonly { readonly headingKey: string; readonly ids: readonly string[] }[] = [
  { headingKey: 'footer.product', ids: ['overview', 'all-features', 'demos', 'playground'] },
  { headingKey: 'footer.resources', ids: ['installation', 'usage', 'api', 'guides'] },
  { headingKey: 'footer.explore', ids: ['customization', 'integrations', 'migration', 'accessibility'] },
  { headingKey: 'footer.project', ids: ['changelog', 'roadmap', 'versions', 'license'] },
];

/** A file name, not prose (01 §7). */
const LLMS_TXT = 'llms.txt';

export function Footer(): React.ReactElement {
  const common = useT('common');
  const nav = useT('nav');
  const { localePath, locale } = useNav();
  const label = (key: string): string => (common.has(key) ? common(key) : nav(key.replace(/^nav\./, '')));
  const machineSurface = localePath('/') + LLMS_TXT;

  return (
    <footer className="ds-footer">
      <div className="ds-footer__cols">
        {COLUMNS.map((column) => (
          <div key={column.headingKey}>
            <h2>{common(column.headingKey)}</h2>
            <ul>
              {column.ids.map((id) => {
                const item = flatItems.find((candidate) => candidate.id === id);
                if (item === undefined) return null;
                return (
                  <li key={id}>
                    <Link to={localePath(item.path)}>{label(item.labelKey)}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
      <div className="ds-footer__bottom">
        <span lang={locale}>
          {common('footer.license', { pluginName: site.displayName, version: versionLabel(site.version).slice(1) })}
        </span>
        <span>
          <a href={site.repoUrl}>{common('shell.github')}</a> <a href={machineSurface}>{LLMS_TXT}</a>
        </span>
      </div>
    </footer>
  );
}
