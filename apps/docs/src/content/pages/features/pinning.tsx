// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T6 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/features/pinning';

export default function Pinning(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics" />
      <Section id="accessibility" ns={NS} titleKey="sections.accessibility" />
      <Section id="customization" ns={NS} titleKey="sections.customization" />
      <Section id="limitations" ns={NS} titleKey="sections.limitations" />
      <Section id="api" ns={NS} titleKey="sections.api" />
    </Page>
  );
}
