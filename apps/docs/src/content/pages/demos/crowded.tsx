// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T8 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/demos/crowded';

export default function Crowded(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="scenario" ns={NS} titleKey="sections.scenario" />
      <Section id="what-it-uses" ns={NS} titleKey="sections.what-it-uses" />
      <Section id="source" ns={NS} titleKey="sections.source" />
    </Page>
  );
}
