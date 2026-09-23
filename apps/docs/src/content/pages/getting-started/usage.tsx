// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T2 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/usage';

export default function Usage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="minimal-example" ns={NS} titleKey="sections.minimal-example" />
      <Section id="controlled-and-uncontrolled" ns={NS} titleKey="sections.controlled-and-uncontrolled" />
      <Section id="common-props" ns={NS} titleKey="sections.common-props" />
      <Section id="next-steps" ns={NS} titleKey="sections.next-steps" />
    </Page>
  );
}
