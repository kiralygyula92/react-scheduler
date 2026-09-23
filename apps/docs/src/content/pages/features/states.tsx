// SPDX-License-Identifier: MIT
// Capability page (T6).
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import States from '~/demos/states/states';
import statesSource from '~/demos/states/states.tsx?raw';

const NS = 'pages/features/states';

export default function StatesPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo id="states" ns={NS} titleKey="demos.states" component={<States />} source={statesSource} height={460} />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="accessibility" ns={NS} titleKey="sections.accessibility">
        <List k="accessibility.points" ns={NS} />
      </Section>

      <Section id="customization" ns={NS} titleKey="sections.customization">
        <List k="customization.points" ns={NS} />
      </Section>

      <Section id="limitations" ns={NS} titleKey="sections.limitations">
        <List k="limitations.points" ns={NS} />
      </Section>

      <Section id="api" ns={NS} titleKey="sections.api">
        <ApiLinks />
      </Section>
    </Page>
  );
}
