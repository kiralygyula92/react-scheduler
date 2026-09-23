// SPDX-License-Identifier: MIT
// Capability page (T6): the component itself and the two views it switches between.
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import Presets from '~/demos/scheduler-and-views/presets';
import presetsSource from '~/demos/scheduler-and-views/presets.tsx?raw';
import Views from '~/demos/scheduler-and-views/views';
import viewsSource from '~/demos/scheduler-and-views/views.tsx?raw';

const NS = 'pages/features/scheduler-and-views';

export default function SchedulerAndViews(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo id="views" ns={NS} titleKey="demos.views" component={<Views />} source={viewsSource} height={460} />
        <P k="basics.switch" ns={NS} />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="presets" ns={NS} titleKey="sections.presets">
        <P k="presets.intro" ns={NS} />
        <Demo
          id="presets"
          ns={NS}
          titleKey="demos.presets"
          component={<Presets />}
          source={presetsSource}
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
