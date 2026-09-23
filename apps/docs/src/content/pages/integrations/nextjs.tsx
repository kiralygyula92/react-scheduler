// SPDX-License-Identifier: MIT
// Guide (T13): the App Router, where the schedule is a client component and the data is not.
import { Callout, Code, List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/integrations/nextjs';

const PACKAGE = '@react-schedulerkit/react-scheduler';

const LAYOUT = `import '@react-schedulerkit/react-scheduler/styles.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;

const CLIENT = `'use client';

import { Scheduler, type SchedulerItem } from '@react-schedulerkit/react-scheduler';

export function Board({ items, now }: { items: SchedulerItem[]; now: string }) {
  return <Scheduler items={items} now={now} />;
}`;

const SERVER = `import { Board } from './board';

export default async function Page() {
  const items = await getItems();
  // One clock for both renders: without it the server and the client disagree about "now".
  return <Board items={items} now={new Date().toISOString()} />;
}`;

export default function NextJs(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="goal" ns={NS} titleKey="sections.goal">
        <P k="goal" ns={NS} />
      </Section>

      <Section id="before-you-start" ns={NS} titleKey="sections.before-you-start">
        <List k="before.points" ns={NS} />
      </Section>

      <Section id="steps" ns={NS} titleKey="sections.steps">
        <Section id="step-install" ns={NS} titleKey="steps.install.title" level={3}>
          <P k="steps.install.text" ns={NS} />
          <Code lang="bash" tabs="pm">
            {PACKAGE}
          </Code>
        </Section>

        <Section id="step-stylesheet" ns={NS} titleKey="steps.stylesheet.title" level={3}>
          <P k="steps.stylesheet.text" ns={NS} />
          <Code lang="tsx">{LAYOUT}</Code>
        </Section>

        <Section id="step-client" ns={NS} titleKey="steps.client.title" level={3}>
          <P k="steps.client.text" ns={NS} />
          <Code lang="tsx">{CLIENT}</Code>
          <Callout tone="info" titleKey="steps.client.calloutTitle" k="steps.client.callout" ns={NS} />
        </Section>

        <Section id="step-server" ns={NS} titleKey="steps.server.title" level={3}>
          <P k="steps.server.text" ns={NS} />
          <Code lang="tsx">{SERVER}</Code>
        </Section>
      </Section>

      <Section id="result" ns={NS} titleKey="sections.result">
        <P k="result.text" ns={NS} />
      </Section>

      <Section id="troubleshooting" ns={NS} titleKey="sections.troubleshooting">
        <List k="troubleshooting.points" ns={NS} />
      </Section>

      <Section id="related" ns={NS} titleKey="sections.related">
        <List k="related.points" ns={NS} />
      </Section>
    </Page>
  );
}
