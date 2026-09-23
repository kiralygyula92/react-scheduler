// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T12 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/customization/slots';

export default function Slots(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="slots" ns={NS} titleKey="sections.slots" />
      <Section id="example" ns={NS} titleKey="sections.example" />
    </Page>
  );
}
