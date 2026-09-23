// SPDX-License-Identifier: MIT
// Theming (T12): the three dials, the dark scheme and the tokens behind them.
import { Code, Demo, List, P, Page, Section } from '~/shell/doc';
import Theming from '~/demos/customization/theming';
import themingSource from '~/demos/customization/theming.tsx?raw';

const NS = 'pages/customization/theming';

const TOKENS = `<Scheduler
  items={items}
  tokens={{ '--rs-color-now': '#0f766e', '--rs-radius-card': '4px' }}
/>;`;

const SCHEME = `/* Or set them in your own stylesheet, on any ancestor. */
.dark-page .rs-root {
  --rs-color-bg: #101418;
  --rs-color-text: #f5f7fa;
}`;

export default function ThemingPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="tokens" ns={NS} titleKey="sections.tokens">
        <P k="tokens.intro" ns={NS} />
        <Demo
          id="theming"
          ns={NS}
          titleKey="demos.theming"
          component={<Theming />}
          source={themingSource}
          height={520}
        />
        <P k="tokens.props" ns={NS} />
        <Code lang="tsx">{TOKENS}</Code>
      </Section>

      <Section id="dark-mode" ns={NS} titleKey="sections.dark-mode">
        <P k="dark.intro" ns={NS} />
        <Code lang="css">{SCHEME}</Code>
        <P k="dark.system" ns={NS} />
      </Section>

      <Section id="presets" ns={NS} titleKey="sections.presets">
        <P k="presets.intro" ns={NS} />
        <List k="presets.points" ns={NS} />
      </Section>
    </Page>
  );
}
