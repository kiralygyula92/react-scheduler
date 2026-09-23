// SPDX-License-Identifier: MIT
// Demos index (T7, docs pack 03 §3.7): a scope sentence and a card per demo page, the Playground
// last. The cards are generated from `nav.json` and the pages' own descriptions, so a scenario
// that is added or renamed reaches this page without anyone editing it.
import { P, Page, PageCards } from '~/shell/doc';

const NS = 'pages/demos/index';

export default function DemosIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />
      <PageCards section="demos" exclude="demos/index" />
    </Page>
  );
}
