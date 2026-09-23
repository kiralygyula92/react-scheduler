// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T12 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/customization/theming';

export default function Theming(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="tokens" ns={NS} titleKey="sections.tokens" />
      <Section id="dark-mode" ns={NS} titleKey="sections.dark-mode" />
      <Section id="presets" ns={NS} titleKey="sections.presets" />
    </Page>
  );
}
