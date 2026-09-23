// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T9 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/demos/playground';

export default function Playground(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="setup" ns={NS} titleKey="sections.setup" />
      <Section id="props" ns={NS} titleKey="sections.props" />
      <Section id="code" ns={NS} titleKey="sections.code" />
      <Section id="event-log" ns={NS} titleKey="sections.event-log" />
    </Page>
  );
}
