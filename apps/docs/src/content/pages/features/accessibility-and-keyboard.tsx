// SPDX-License-Identifier: MIT
// Capability page (T6): the keyboard map, the roles and the announcements, in one place.
import { ApiLinks, Demo, List, P, Page, Section, Table } from '~/shell/doc';
import Keyboard from '~/demos/accessibility-and-keyboard/keyboard';
import keyboardSource from '~/demos/accessibility-and-keyboard/keyboard.tsx?raw';

const NS = 'pages/features/accessibility-and-keyboard';

export default function AccessibilityAndKeyboard(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="keyboard"
          ns={NS}
          titleKey="demos.keyboard"
          component={<Keyboard />}
          source={keyboardSource}
          height={460}
        />
      </Section>

      <Section id="keyboard" ns={NS} titleKey="sections.keyboard">
        <P k="keyboard.intro" ns={NS} />
        <Table k="keyboard.rows" ns={NS} headKeys={['keyboard.head.key', 'keyboard.head.what']} />
        <P k="keyboard.order" ns={NS} />
      </Section>

      <Section id="structure" ns={NS} titleKey="sections.structure">
        <List k="structure.points" ns={NS} />
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
