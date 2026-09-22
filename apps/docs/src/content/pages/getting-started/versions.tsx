// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T4 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/versions';

export default function Versions(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="supported-versions" ns={NS} titleKey="sections.supported-versions" />
      <Section id="versioning-policy" ns={NS} titleKey="sections.versioning-policy" />
      <Section id="older-versions" ns={NS} titleKey="sections.older-versions" />
      <Section id="related" ns={NS} titleKey="sections.related" />
    </Page>
  );
}
