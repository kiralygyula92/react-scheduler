// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T12 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/customization/overview';

export default function CustomizationOverview(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="css-variables" ns={NS} titleKey="sections.css-variables" />
      <Section id="class-names" ns={NS} titleKey="sections.class-names" />
      <Section id="slot-props" ns={NS} titleKey="sections.slot-props" />
      <Section id="slots" ns={NS} titleKey="sections.slots" />
      <Section id="handlers" ns={NS} titleKey="sections.handlers" />
      <Section id="headless-hooks" ns={NS} titleKey="sections.headless-hooks" />
    </Page>
  );
}
