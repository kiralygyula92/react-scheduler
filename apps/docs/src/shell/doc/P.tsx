// SPDX-License-Identifier: MIT
// A paragraph from a locale key. Inline markup goes through `Trans`, which allows six tags and
// nothing else (docs pack 11 §9).
import type { Vars } from '~/i18n/format';
import { Trans } from '~/i18n/Trans';

export function P({ k, ns, vars }: { k: string; ns: string; vars?: Vars }): React.ReactElement {
  return (
    <p>
      <Trans k={k} ns={ns} {...(vars && { vars })} />
    </p>
  );
}
