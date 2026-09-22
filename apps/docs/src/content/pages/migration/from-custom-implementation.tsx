// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T14 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/migration/from-custom-implementation';

export default function FromCustomImplementation(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="who-this-is-for" ns={NS} titleKey="sections.who-this-is-for" />
      <Section id="summary-of-changes" ns={NS} titleKey="sections.summary-of-changes" />
      <Section id="step-by-step" ns={NS} titleKey="sections.step-by-step" />
      <Section id="removed-and-renamed" ns={NS} titleKey="sections.removed-and-renamed" />
      <Section id="getting-help" ns={NS} titleKey="sections.getting-help" />
    </Page>
  );
}
