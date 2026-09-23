// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T12 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/customization/css-variables';

export default function CssVariables(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="variables" ns={NS} titleKey="sections.variables" />
    </Page>
  );
}
