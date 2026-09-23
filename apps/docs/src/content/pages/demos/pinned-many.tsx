// SPDX-License-Identifier: MIT
// Scenario page (T8, docs pack 03 §3.8) for the `pinned-many` fixture.
import { Demo, List, P, Page, Section } from '~/shell/doc';
import PinnedManyDemo from '~/demos/scenarios/pinned-many';
import pinnedManySource from '~/demos/scenarios/pinned-many.tsx?raw';

const NS = 'pages/demos/pinned-many';

export default function PinnedMany(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="scenario" ns={NS} titleKey="sections.scenario">
        <P k="scenario" ns={NS} />
        <Demo
          id="pinned-many"
          ns={NS}
          titleKey="demos.board"
          component={<PinnedManyDemo />}
          source={pinnedManySource}
          height={560}
        />
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
