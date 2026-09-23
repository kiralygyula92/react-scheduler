// SPDX-License-Identifier: MIT
// Guide (T13): rendering the schedule on a server and hydrating it without a warning, whatever the
// framework. The framework-specific steps are on the Next.js and React Router pages.
import { Callout, Code, List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/integrations/ssr';

const DETERMINISTIC = `// The server decides the clock once and hands it to the client.
const now = new Date().toISOString();

<Scheduler items={items} date={now} now={now} />;`;

const COMPACT = `// Width cannot be measured on a server, so 'auto' starts wide and settles after hydration.
<Scheduler items={items} now={now} compact="auto" />;

// If the first frame has to be narrow, decide it on the server from what you already know.
<Scheduler items={items} now={now} compact={isMobileUserAgent} />;`;

export default function Ssr(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="goal" ns={NS} titleKey="sections.goal">
        <P k="goal" ns={NS} />
      </Section>

      <Section id="before-you-start" ns={NS} titleKey="sections.before-you-start">
        <List k="before.points" ns={NS} />
      </Section>

      <Section id="steps" ns={NS} titleKey="sections.steps">
        <Section id="step-clock" ns={NS} titleKey="steps.clock.title" level={3}>
          <P k="steps.clock.text" ns={NS} />
          <Code lang="tsx">{DETERMINISTIC}</Code>
          <Callout tone="warning" titleKey="steps.clock.calloutTitle" k="steps.clock.callout" ns={NS} />
        </Section>

        <Section id="step-first-frame" ns={NS} titleKey="steps.firstFrame.title" level={3}>
          <P k="steps.firstFrame.text" ns={NS} />
          <List k="steps.firstFrame.points" ns={NS} />
        </Section>

        <Section id="step-compact" ns={NS} titleKey="steps.compact.title" level={3}>
          <P k="steps.compact.text" ns={NS} />
          <Code lang="tsx">{COMPACT}</Code>
        </Section>

        <Section id="step-styles" ns={NS} titleKey="steps.styles.title" level={3}>
          <P k="steps.styles.text" ns={NS} />
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
