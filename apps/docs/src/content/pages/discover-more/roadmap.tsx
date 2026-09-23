// SPDX-License-Identifier: MIT
// Roadmap (T16): what is planned after 1.0, as plain rows. No dates, and nothing promised.
import { List, P, Page, Section, Table } from '~/shell/doc';

const NS = 'pages/discover-more/roadmap';

export default function Roadmap(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="intro" ns={NS} />

      <Section id="planned" ns={NS} titleKey="sections.planned">
        <Table k="planned.rows" ns={NS} headKeys={['planned.head.item', 'planned.head.status', 'planned.head.what']} />
      </Section>

      <Section id="not-planned" ns={NS} titleKey="sections.not-planned">
        <P k="notPlanned.intro" ns={NS} />
        <List k="notPlanned.points" ns={NS} />
      </Section>

      <Section id="how-it-changes" ns={NS} titleKey="sections.how-it-changes">
        <P k="how.text" ns={NS} />
      </Section>
    </Page>
  );
}
