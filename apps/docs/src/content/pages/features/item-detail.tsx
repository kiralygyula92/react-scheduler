// SPDX-License-Identifier: MIT
// Capability page (T6): what opens when a reader activates an item, and how to replace it.
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import BasicDetail from '~/demos/item-detail/basic';
import basicSource from '~/demos/item-detail/basic.tsx?raw';
import CustomDetail from '~/demos/item-detail/custom';
import customSource from '~/demos/item-detail/custom.tsx?raw';

const NS = 'pages/features/item-detail';

export default function ItemDetailPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="detail-basic"
          ns={NS}
          titleKey="demos.basic"
          component={<BasicDetail />}
          source={basicSource}
          height={460}
        />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="your-own" ns={NS} titleKey="sections.your-own">
        <P k="own.intro" ns={NS} />
        <Demo
          id="detail-custom"
          ns={NS}
          titleKey="demos.custom"
          component={<CustomDetail />}
          source={customSource}
          height={460}
        />
        <P k="own.state" ns={NS} />
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
