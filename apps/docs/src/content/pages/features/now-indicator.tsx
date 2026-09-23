// SPDX-License-Identifier: MIT
// Capability page (T6): the now marker, when it is shown and what keeps it moving.
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import NowMarker from '~/demos/now-indicator/now';
import nowSource from '~/demos/now-indicator/now.tsx?raw';

const NS = 'pages/features/now-indicator';

export default function NowIndicatorPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo id="now" ns={NS} titleKey="demos.now" component={<NowMarker />} source={nowSource} height={460} />
        <P k="basics.when" ns={NS} />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="clock" ns={NS} titleKey="sections.clock">
        <P k="clock.intro" ns={NS} />
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
