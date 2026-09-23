// SPDX-License-Identifier: MIT
// Capability page (T6).
import { ApiLinks, Demo, List, P, Page, Section } from '~/shell/doc';
import Motion from '~/demos/motion/motion';
import motionSource from '~/demos/motion/motion.tsx?raw';

const NS = 'pages/features/motion';

export default function MotionPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo id="motion" ns={NS} titleKey="demos.motion" component={<Motion />} source={motionSource} height={460} />
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
