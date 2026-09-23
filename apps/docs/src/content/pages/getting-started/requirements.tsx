// SPDX-License-Identifier: MIT
// Requirements (T2, docs pack 03 §3.2). Every number here is measured, not estimated: the sizes come
// from the package's own `size-limit` budgets and the matrices from what CI runs.
import { List, P, Page, Section, Table } from '~/shell/doc';

const NS = 'pages/getting-started/requirements';

export default function Requirements(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="browsers" ns={NS} titleKey="sections.browsers">
        <P k="browsers.intro" ns={NS} />
        <Table k="browsers.rows" ns={NS} headKeys={['browsers.head.target', 'browsers.head.versions']} />
        <P k="browsers.features" ns={NS} />
        <List k="browsers.points" ns={NS} />
      </Section>

      <Section id="react-versions" ns={NS} titleKey="sections.react-versions">
        <P k="react.intro" ns={NS} />
        <P k="react.strict" ns={NS} />
      </Section>

      <Section id="typescript-versions" ns={NS} titleKey="sections.typescript-versions">
        <P k="typescript.intro" ns={NS} />
        <P k="typescript.generics" ns={NS} />
      </Section>

      <Section id="frameworks-and-ssr" ns={NS} titleKey="sections.frameworks-and-ssr">
        <P k="frameworks.intro" ns={NS} />
        <List k="frameworks.points" ns={NS} />
      </Section>

      <Section id="bundle-size" ns={NS} titleKey="sections.bundle-size">
        <P k="size.intro" ns={NS} />
        <Table k="size.rows" ns={NS} headKeys={['size.head.entry', 'size.head.size', 'size.head.budget']} />
      </Section>

      <Section id="accessibility-target" ns={NS} titleKey="sections.accessibility-target">
        <P k="a11y.intro" ns={NS} />
        <P k="a11y.tested" ns={NS} />
      </Section>
    </Page>
  );
}
