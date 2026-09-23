// SPDX-License-Identifier: MIT
// Guides index (T16). The task-oriented guides live in Integrations for now; this page says so and
// points at the pages that already answer the questions a guide would.
import { List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/guides/index';

export default function GuidesIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />
      <Section id="start-here" ns={NS} titleKey="sections.start-here">
        <List k="start.points" ns={NS} />
      </Section>
    </Page>
  );
}
