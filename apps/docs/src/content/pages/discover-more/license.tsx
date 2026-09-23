// SPDX-License-Identifier: MIT
// License (T16, docs pack 03 §3.16): a translated summary, and the licence itself reproduced from
// the repository's own LICENSE file so the page cannot say something the file does not.
import licenseText from '../../../../../../LICENSE?raw';
import { Code, List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/license';

export default function License(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="summary" ns={NS} titleKey="sections.summary">
        <P k="summary.intro" ns={NS} />
        <List k="summary.points" ns={NS} />
        <P k="summary.note" ns={NS} />
      </Section>

      <Section id="full-text" ns={NS} titleKey="sections.full-text">
        <P k="full.intro" ns={NS} />
        <Code lang="text">{licenseText.trimEnd()}</Code>
      </Section>
    </Page>
  );
}
