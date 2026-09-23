// SPDX-License-Identifier: MIT
// FAQ (T2, docs pack 03 §3.2): one section per question, each answered in a few sentences with a
// link to the page that says more.
import { P, Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/faq';

export default function Faq(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="is-it-free" ns={NS} titleKey="sections.is-it-free">
        <P k="free.text" ns={NS} />
      </Section>

      <Section id="nextjs" ns={NS} titleKey="sections.nextjs">
        <P k="nextjs.text" ns={NS} />
      </Section>

      <Section id="without-default-styles" ns={NS} titleKey="sections.without-default-styles">
        <P k="unstyled.text" ns={NS} />
      </Section>

      <Section id="built-in-languages" ns={NS} titleKey="sections.built-in-languages">
        <P k="languages.text" ns={NS} />
      </Section>
    </Page>
  );
}
