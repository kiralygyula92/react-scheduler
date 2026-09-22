// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T2 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/support';

export default function Support(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="where-to-ask" ns={NS} titleKey="sections.where-to-ask" />
      <Section id="report-a-bug" ns={NS} titleKey="sections.report-a-bug" />
      <Section id="security" ns={NS} titleKey="sections.security" />
      <Section id="support-policy" ns={NS} titleKey="sections.support-policy" />
    </Page>
  );
}
