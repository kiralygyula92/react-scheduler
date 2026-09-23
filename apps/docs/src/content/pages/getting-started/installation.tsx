// SPDX-License-Identifier: MIT
// Installation (T2, docs pack 03 §3.2): the four package managers, the peers, the stylesheet, and a
// render short enough to prove the install worked.
import { Callout, Code, List, P, Page, Section, Table } from '~/shell/doc';

const NS = 'pages/getting-started/installation';

const PACKAGE = '@react-schedulerkit/react-scheduler';

const STYLESHEET = `import '@react-schedulerkit/react-scheduler/styles.css';`;

const VERIFY = `import { Scheduler } from '@react-schedulerkit/react-scheduler';
import '@react-schedulerkit/react-scheduler/styles.css';

const items = [{ id: '1', start: new Date(), level: 'normal', title: 'First item' }];

export function App() {
  return <Scheduler items={items} />;
}`;

export default function Installation(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="install" ns={NS} titleKey="sections.install">
        <Code lang="bash" tabs="pm">
          {PACKAGE}
        </Code>
      </Section>

      <Section id="peer-dependencies" ns={NS} titleKey="sections.peer-dependencies">
        <P k="peers.intro" ns={NS} />
        <Table k="peers.rows" ns={NS} headKeys={['peers.head.package', 'peers.head.range', 'peers.head.why']} />
      </Section>

      <Section id="stylesheet" ns={NS} titleKey="sections.stylesheet">
        <P k="stylesheet.intro" ns={NS} />
        <Code lang="ts">{STYLESHEET}</Code>
        <P k="stylesheet.unstyled" ns={NS} />
      </Section>

      <Section id="verify" ns={NS} titleKey="sections.verify">
        <P k="verify.intro" ns={NS} />
        <Code lang="tsx">{VERIFY}</Code>
        <Callout tone="info" titleKey="verify.calloutTitle" k="verify.callout" ns={NS} />
      </Section>

      <Section id="next-steps" ns={NS} titleKey="sections.next-steps">
        <List k="next.points" ns={NS} />
      </Section>
    </Page>
  );
}
