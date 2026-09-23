// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T2 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/faq';

export default function Faq(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="is-it-free" ns={NS} titleKey="sections.is-it-free" />
      <Section id="nextjs" ns={NS} titleKey="sections.nextjs" />
      <Section id="without-default-styles" ns={NS} titleKey="sections.without-default-styles" />
      <Section id="built-in-languages" ns={NS} titleKey="sections.built-in-languages" />
    </Page>
  );
}
