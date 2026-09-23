// SPDX-License-Identifier: MIT
// Capability page (T6): which items stay in view once they scroll past, and how that is tuned.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import pinningOptions from '~/content/api/PinningOptions.json';
import Pinning from '~/demos/pinning/pinning';
import pinningSource from '~/demos/pinning/pinning.tsx?raw';

const NS = 'pages/features/pinning';

export default function PinningPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="pinning"
          ns={NS}
          titleKey="demos.pinning"
          component={<Pinning />}
          source={pinningSource}
          height={460}
        />
        <P k="basics.which" ns={NS} />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="rules" ns={NS} titleKey="sections.rules">
        <P k="rules.intro" ns={NS} />
        <PropsTable members={pinningOptions.props} />
        <P k="rules.carried" ns={NS} />
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
