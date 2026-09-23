// SPDX-License-Identifier: MIT
// Versions (T4, docs pack 03 §3.4): which versions are supported, what a release number promises,
// and where an older major is documented.
import { List, P, Page, Section, Table } from '~/shell/doc';

const NS = 'pages/getting-started/versions';

export default function Versions(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="supported-versions" ns={NS} titleKey="sections.supported-versions">
        <Table
          k="supported.rows"
          ns={NS}
          headKeys={['supported.head.version', 'supported.head.status', 'supported.head.docs']}
        />
      </Section>

      <Section id="versioning-policy" ns={NS} titleKey="sections.versioning-policy">
        <P k="policy.intro" ns={NS} />
        <List k="policy.points" ns={NS} />
        <P k="policy.optIn" ns={NS} />
      </Section>

      <Section id="older-versions" ns={NS} titleKey="sections.older-versions">
        <P k="older.text" ns={NS} />
      </Section>

      <Section id="related" ns={NS} titleKey="sections.related">
        <List k="related.points" ns={NS} />
      </Section>
    </Page>
  );
}
