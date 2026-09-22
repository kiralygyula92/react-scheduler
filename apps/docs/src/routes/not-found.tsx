// SPDX-License-Identifier: MIT
// The 404 page (docs pack 01 §6): prerendered per locale, with a link back to the Overview. The
// search dialog is one keystroke away in the navbar, so the page itself stays short.
import { Link } from 'react-router';
import { useT } from '~/i18n/useT';
import { useNav } from '~/shell/nav';

export function NotFound(): React.ReactElement {
  const t = useT('common');
  const { localePath } = useNav();
  return (
    <>
      <h1>{t('notFound.title')}</h1>
      <p className="ds-lead">{t('notFound.text')}</p>
      <p>
        <Link to={localePath('/')}>{t('notFound.back')}</Link>
      </p>
    </>
  );
}
