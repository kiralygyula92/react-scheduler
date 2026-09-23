// SPDX-License-Identifier: MIT
// Capability page (T6): the same model without the markup, for a rendering of your own.
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import Headless from '~/demos/headless-api/headless';
import headlessSource from '~/demos/headless-api/headless.tsx?raw';

const NS = 'pages/features/headless-api';

export default function HeadlessApi(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="headless"
          ns={NS}
          titleKey="demos.headless"
          component={<Headless />}
          source={headlessSource}
          height={460}
        />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="layers" ns={NS} titleKey="sections.layers">
        <P k="layers.intro" ns={NS} />
        <List k="layers.points" ns={NS} />
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
