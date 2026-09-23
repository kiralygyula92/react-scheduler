// SPDX-License-Identifier: MIT
// Usage (T2, docs pack 03 §3.2): one complete example, how state is shared with the application,
// and the props a reader reaches for first.
import { Code, Demo, List, P, Page, Section, Table } from '~/shell/doc';
import Minimal from '~/demos/getting-started/minimal';
import minimalSource from '~/demos/getting-started/minimal.tsx?raw';

const NS = 'pages/getting-started/usage';

const UNCONTROLLED = `<Scheduler items={items} defaultView="timeline" />`;

const CONTROLLED = `const [view, setView] = useState<ViewKind>('timeline');

<Scheduler items={items} view={view} onViewChange={setView} />;`;

export default function Usage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="minimal-example" ns={NS} titleKey="sections.minimal-example">
        <P k="minimal.intro" ns={NS} />
        <Demo
          id="usage-minimal"
          ns={NS}
          titleKey="demos.minimal"
          component={<Minimal />}
          source={minimalSource}
          height={420}
        />
      </Section>

      <Section id="controlled-and-uncontrolled" ns={NS} titleKey="sections.controlled-and-uncontrolled">
        <P k="controlled.intro" ns={NS} />
        <Code lang="tsx">{UNCONTROLLED}</Code>
        <P k="controlled.controlled" ns={NS} />
        <Code lang="tsx">{CONTROLLED}</Code>
        <P k="controlled.pairs" ns={NS} />
        <List k="controlled.points" ns={NS} />
      </Section>

      <Section id="common-props" ns={NS} titleKey="sections.common-props">
        <P k="common.intro" ns={NS} />
        <Table k="common.rows" ns={NS} headKeys={['common.head.prop', 'common.head.what']} />
      </Section>

      <Section id="next-steps" ns={NS} titleKey="sections.next-steps">
        <List k="next.points" ns={NS} />
      </Section>
    </Page>
  );
}
