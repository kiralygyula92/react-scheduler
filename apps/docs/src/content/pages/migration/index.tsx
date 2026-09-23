// SPDX-License-Identifier: MIT
// Migration index (T16): what is here now, and the card that leads to it.
import { P, Page, PageCards } from '~/shell/doc';

const NS = 'pages/migration/index';

export default function MigrationIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />
      <PageCards section="migration" exclude="migration/index" />
      <P k="versions" ns={NS} />
    </Page>
  );
}
