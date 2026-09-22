// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T16 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/license';

export default function License(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="summary" ns={NS} titleKey="sections.summary" />
      <Section id="full-text" ns={NS} titleKey="sections.full-text" />
    </Page>
  );
}
