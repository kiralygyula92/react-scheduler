// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T12 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/customization/localization';

export default function Localization(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="built-in-locales" ns={NS} titleKey="sections.built-in-locales" />
      <Section id="custom-messages" ns={NS} titleKey="sections.custom-messages" />
      <Section id="adding-a-language" ns={NS} titleKey="sections.adding-a-language" />
    </Page>
  );
}
