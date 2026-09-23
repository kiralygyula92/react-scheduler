// SPDX-License-Identifier: MIT
// Integrations index (T16): a scope sentence and a card per guide, generated from nav.json.
import { P, Page, PageCards } from '~/shell/doc';

const NS = 'pages/integrations/index';

export default function IntegrationsIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />
      <PageCards section="integrations" exclude="integrations/index" />
    </Page>
  );
}
