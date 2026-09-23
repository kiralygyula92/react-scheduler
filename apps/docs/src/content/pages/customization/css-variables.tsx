// SPDX-License-Identifier: MIT
// Every design token, generated from `styles/tokens.css` (T12, docs pack 03 §3.12). The table is
// never written by hand: a token added to the package appears here on the next build.
import { P, Page, Section, TokenTable } from '~/shell/doc';

const NS = 'pages/customization/css-variables';

export default function CssVariables(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="variables" ns={NS} titleKey="sections.variables">
        <P k="intro" ns={NS} />
        <P k="how" ns={NS} />
        <TokenTable ns={NS} />
      </Section>
    </Page>
  );
}
