// SPDX-License-Identifier: MIT
// Scenario page (T8, docs pack 03 §3.8) for the `night-shift` fixture.
import { Demo, List, P, Page, Section } from '~/shell/doc';
import NightShiftDemo from '~/demos/scenarios/night-shift';
import nightShiftSource from '~/demos/scenarios/night-shift.tsx?raw';

const NS = 'pages/demos/night-shift';

export default function NightShift(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="scenario" ns={NS} titleKey="sections.scenario">
        <P k="scenario" ns={NS} />
        <Demo
          id="night-shift"
          ns={NS}
          titleKey="demos.board"
          component={<NightShiftDemo />}
          source={nightShiftSource}
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
