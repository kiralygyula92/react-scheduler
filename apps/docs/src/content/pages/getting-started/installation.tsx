// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T2 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/installation';

export default function Installation(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="install" ns={NS} titleKey="sections.install" />
      <Section id="peer-dependencies" ns={NS} titleKey="sections.peer-dependencies" />
      <Section id="stylesheet" ns={NS} titleKey="sections.stylesheet" />
      <Section id="verify" ns={NS} titleKey="sections.verify" />
      <Section id="next-steps" ns={NS} titleKey="sections.next-steps" />
    </Page>
  );
}
