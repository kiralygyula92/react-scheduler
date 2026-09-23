// SPDX-License-Identifier: MIT
// Support (T2, docs pack 03 §3.2): where a question goes, what a useful bug report holds, how a
// vulnerability is reported privately, and how long a version is supported.
import { List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/support';

export default function Support(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="where-to-ask" ns={NS} titleKey="sections.where-to-ask">
        <P k="ask.text" ns={NS} />
      </Section>

      <Section id="report-a-bug" ns={NS} titleKey="sections.report-a-bug">
        <P k="bug.intro" ns={NS} />
        <List k="bug.points" ns={NS} ordered />
        <P k="bug.reduce" ns={NS} />
      </Section>

      <Section id="security" ns={NS} titleKey="sections.security">
        <P k="security.text" ns={NS} />
      </Section>

      <Section id="support-policy" ns={NS} titleKey="sections.support-policy">
        <P k="policy.text" ns={NS} />
      </Section>
    </Page>
  );
}
