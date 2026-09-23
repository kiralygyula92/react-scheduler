// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T2 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/requirements';

export default function Requirements(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="browsers" ns={NS} titleKey="sections.browsers" />
      <Section id="react-versions" ns={NS} titleKey="sections.react-versions" />
      <Section id="typescript-versions" ns={NS} titleKey="sections.typescript-versions" />
      <Section id="frameworks-and-ssr" ns={NS} titleKey="sections.frameworks-and-ssr" />
      <Section id="bundle-size" ns={NS} titleKey="sections.bundle-size" />
      <Section id="accessibility-target" ns={NS} titleKey="sections.accessibility-target" />
    </Page>
  );
}
