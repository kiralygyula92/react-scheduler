// SPDX-License-Identifier: MIT
// Capability page (T6): what an item is, how the level scale works, and what decides the order.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import levelDefinition from '~/content/api/LevelDefinition.json';
import schedulerItem from '~/content/api/SchedulerItem.json';
import CompareItems from '~/demos/items-and-levels/compare';
import compareSource from '~/demos/items-and-levels/compare.tsx?raw';
import CustomLevels from '~/demos/items-and-levels/levels';
import levelsSource from '~/demos/items-and-levels/levels.tsx?raw';

const NS = 'pages/features/items-and-levels';

export default function ItemsAndLevels(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="levels"
          ns={NS}
          titleKey="demos.levels"
          component={<CustomLevels />}
          source={levelsSource}
          height={460}
        />
        <P k="basics.item" ns={NS} />
        <PropsTable members={schedulerItem.props} />
      </Section>

      <Section id="levels" ns={NS} titleKey="sections.levels">
        <P k="levels.intro" ns={NS} />
        <PropsTable members={levelDefinition.props} />
        <List k="levels.points" ns={NS} />
      </Section>

      <Section id="order" ns={NS} titleKey="sections.order">
        <P k="order.intro" ns={NS} />
        <Demo
          id="compare"
          ns={NS}
          titleKey="demos.compare"
          component={<CompareItems />}
          source={compareSource}
          height={460}
        />
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
