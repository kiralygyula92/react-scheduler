// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T1 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/overview';

export default function GettingStartedOverview(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="introduction" ns={NS} titleKey="sections.introduction" />
      <Section id="why" ns={NS} titleKey="sections.why" />
      <Section id="start-now" ns={NS} titleKey="sections.start-now" />
      <Section id="license" ns={NS} titleKey="sections.license" />
    </Page>
  );
}
