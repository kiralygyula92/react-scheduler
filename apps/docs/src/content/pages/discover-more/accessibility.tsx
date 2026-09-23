// SPDX-License-Identifier: MIT
// Accessibility (T16, docs pack 03 §3.16): the target, what every change is tested against, the gaps
// that remain, and where to report one.
import { List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/discover-more/accessibility';

export default function Accessibility(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="target" ns={NS} titleKey="sections.target">
        <P k="target.intro" ns={NS} />
        <List k="target.points" ns={NS} />
      </Section>

      <Section id="what-is-tested" ns={NS} titleKey="sections.what-is-tested">
        <P k="tested.intro" ns={NS} />
        <List k="tested.points" ns={NS} />
      </Section>

      <Section id="known-gaps" ns={NS} titleKey="sections.known-gaps">
        <P k="gaps.intro" ns={NS} />
        <List k="gaps.points" ns={NS} />
      </Section>

      <Section id="reporting" ns={NS} titleKey="sections.reporting">
        <P k="reporting.intro" ns={NS} />
        <List k="reporting.points" ns={NS} />
      </Section>
    </Page>
  );
}
