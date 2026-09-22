// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T13 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/integrations/ssr';

export default function Ssr(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="goal" ns={NS} titleKey="sections.goal" />
      <Section id="before-you-start" ns={NS} titleKey="sections.before-you-start" />
      <Section id="steps" ns={NS} titleKey="sections.steps" />
      <Section id="result" ns={NS} titleKey="sections.result" />
      <Section id="related" ns={NS} titleKey="sections.related" />
    </Page>
  );
}
