// SPDX-License-Identifier: MIT
// Guide (T13, docs pack 03 §3.13): the shortest path from an empty Vite app to a schedule.
import { Code, List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/integrations/vite';

const PACKAGE = '@react-schedulerkit/react-scheduler';

const ENTRY = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@react-schedulerkit/react-scheduler/styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);`;

const APP = `import { Scheduler } from '@react-schedulerkit/react-scheduler';

const items = [
  { id: 'a', start: '2031-03-12T09:00', end: '2031-03-12T10:30', level: 'critical', title: 'Handover' },
  { id: 'b', start: '2031-03-12T11:00', end: '2031-03-12T12:00', level: 'routine', title: 'Stock count' },
];

export default function App() {
  return <Scheduler items={items} />;
}`;

export default function Vite(): React.ReactElement {
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
          <Code lang="tsx">{ENTRY}</Code>
        </Section>

        <Section id="step-render" ns={NS} titleKey="steps.render.title" level={3}>
          <P k="steps.render.text" ns={NS} />
          <Code lang="tsx">{APP}</Code>
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
