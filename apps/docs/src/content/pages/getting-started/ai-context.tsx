// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T3 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/ai-context';

export default function AiContext(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="prerequisites" ns={NS} titleKey="sections.prerequisites" />
      <Section id="installation" ns={NS} titleKey="sections.installation" />
      <Section id="what-is-in-the-file" ns={NS} titleKey="sections.what-is-in-the-file" />
      <Section id="which-file-to-use" ns={NS} titleKey="sections.which-file-to-use" />
      <Section id="minimal-working-example" ns={NS} titleKey="sections.minimal-working-example" />
      <Section id="verify" ns={NS} titleKey="sections.verify" />
      <Section id="next-steps" ns={NS} titleKey="sections.next-steps" />
    </Page>
  );
}
