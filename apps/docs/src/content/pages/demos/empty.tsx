// SPDX-License-Identifier: MIT
// Scenario page (T8, docs pack 03 §3.8) for the `empty` fixture.
import { Demo, List, P, Page, Section } from '~/shell/doc';
import EmptyDemo from '~/demos/scenarios/empty';
import emptySource from '~/demos/scenarios/empty.tsx?raw';

const NS = 'pages/demos/empty';

export default function Empty(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="scenario" ns={NS} titleKey="sections.scenario">
        <P k="scenario" ns={NS} />
        <Demo id="empty" ns={NS} titleKey="demos.board" component={<EmptyDemo />} source={emptySource} height={560} />
      </Section>

      <Section id="what-to-look-for" ns={NS} titleKey="sections.what-to-look-for">
        <List k="look" ns={NS} />
      </Section>

      <Section id="what-it-uses" ns={NS} titleKey="sections.what-it-uses">
        <List k="uses" ns={NS} />
      </Section>

      <Section id="source" ns={NS} titleKey="sections.source">
        <P k="source" ns={NS} />
      </Section>
    </Page>
  );
}
