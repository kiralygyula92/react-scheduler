// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T16 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/accessibility';

export default function Accessibility(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="target" ns={NS} titleKey="sections.target" />
      <Section id="what-is-tested" ns={NS} titleKey="sections.what-is-tested" />
      <Section id="known-gaps" ns={NS} titleKey="sections.known-gaps" />
      <Section id="reporting" ns={NS} titleKey="sections.reporting" />
    </Page>
  );
}
