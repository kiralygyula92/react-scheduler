// SPDX-License-Identifier: MIT
// Capability page (T6): the two navigation buttons, what they target and what they announce.
import { ApiLinks, Demo, List, P, Page, Section, Table } from '~/shell/doc';
import Navigation from '~/demos/navigation/navigation';
import navigationSource from '~/demos/navigation/navigation.tsx?raw';

const NS = 'pages/features/navigation';

export default function NavigationPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="navigation"
          ns={NS}
          titleKey="demos.navigation"
          component={<Navigation />}
          source={navigationSource}
          height={460}
        />
        <P k="basics.where" ns={NS} />
      </Section>

      <Section id="targets" ns={NS} titleKey="sections.targets">
        <P k="targets.intro" ns={NS} />
        <Table k="targets.rows" ns={NS} headKeys={['targets.head.when', 'targets.head.top', 'targets.head.bottom']} />
        <P k="targets.count" ns={NS} />
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
