// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T16 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/roadmap';

export default function Roadmap(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="planned" ns={NS} titleKey="sections.planned" />
    </Page>
  );
}
