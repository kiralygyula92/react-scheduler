// SPDX-License-Identifier: MIT
// A callout (docs pack 02 §6.8). The tone carries an icon and a colour, but the title text says
// what it is, so colour is never the only carrier of meaning (07 §2).
import { Trans } from '~/i18n/Trans';
import { useT } from '~/i18n/useT';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '../icons';

export type Tone = 'info' | 'success' | 'warning' | 'danger';

const ICONS = { info: InfoIcon, success: SuccessIcon, warning: WarningIcon, danger: ErrorIcon };

export function Callout({
  tone = 'info',
  titleKey,
  k,
  ns,
}: {
  tone?: Tone;
  titleKey: string;
  k: string;
  ns: string;
}): React.ReactElement {
  const t = useT(ns);
  const Icon = ICONS[tone];
  return (
    <div className="ds-callout" data-tone={tone}>
      <p className="ds-callout__title">
        <Icon />
        {t(titleKey)}
      </p>
      <p>
        <Trans k={k} ns={ns} />
      </p>
    </div>
  );
}
