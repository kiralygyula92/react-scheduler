// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T10 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/reference/index';

export default function ReferenceIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="components" ns={NS} titleKey="sections.components" />
      <Section id="hooks" ns={NS} titleKey="sections.hooks" />
      <Section id="functions" ns={NS} titleKey="sections.functions" />
      <Section id="types" ns={NS} titleKey="sections.types" />
      <Section id="css-variables" ns={NS} titleKey="sections.css-variables" />
    </Page>
  );
}
