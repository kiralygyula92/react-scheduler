// SPDX-License-Identifier: MIT
// Migration guide (T14, docs pack 03 §3.14): from a shift board a team wrote themselves to this one.
import { Code, List, P, Page, Section, Table } from '~/shell/doc';

const NS = 'pages/migration/from-custom-implementation';

const ITEM = `// Your own row, whatever its shape.
type Task = { taskId: string; from: string; to: string; severity: 'high' | 'low'; name: string };

const items = tasks.map((task) => ({
  id: task.taskId,
  start: task.from,
  end: task.to,
  level: task.severity === 'high' ? 'critical' : 'routine',
  title: task.name,
  // Anything the component does not know about travels in \`data\`, typed.
  data: task,
}));`;

const LEVELS = `import type { LevelDefinition } from '@react-schedulerkit/react-scheduler';

const levels: LevelDefinition[] = [
  { key: 'critical', rank: 0, variant: 'alert', pinOnPass: true },
  { key: 'routine', rank: 1 },
];`;

export default function FromCustomImplementation(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="who-this-is-for" ns={NS} titleKey="sections.who-this-is-for">
        <P k="who.intro" ns={NS} />
        <List k="who.points" ns={NS} />
      </Section>

      <Section id="summary-of-changes" ns={NS} titleKey="sections.summary-of-changes">
        <P k="summary.intro" ns={NS} />
        <Table
          k="summary.rows"
          ns={NS}
          headKeys={['summary.head.before', 'summary.head.after', 'summary.head.action']}
        />
      </Section>

      <Section id="step-by-step" ns={NS} titleKey="sections.step-by-step">
        <Section id="step-items" ns={NS} titleKey="steps.items.title" level={3}>
          <P k="steps.items.text" ns={NS} />
          <Code lang="ts">{ITEM}</Code>
        </Section>

        <Section id="step-levels" ns={NS} titleKey="steps.levels.title" level={3}>
          <P k="steps.levels.text" ns={NS} />
          <Code lang="ts">{LEVELS}</Code>
        </Section>

        <Section id="step-shifts" ns={NS} titleKey="steps.shifts.title" level={3}>
          <P k="steps.shifts.text" ns={NS} />
        </Section>

        <Section id="step-strings" ns={NS} titleKey="steps.strings.title" level={3}>
          <P k="steps.strings.text" ns={NS} />
        </Section>

        <Section id="step-styles" ns={NS} titleKey="steps.styles.title" level={3}>
          <P k="steps.styles.text" ns={NS} />
        </Section>

        <Section id="step-behavior" ns={NS} titleKey="steps.behavior.title" level={3}>
          <P k="steps.behavior.text" ns={NS} />
        </Section>
      </Section>

      <Section id="removed-and-renamed" ns={NS} titleKey="sections.removed-and-renamed">
        <P k="removed.text" ns={NS} />
      </Section>

      <Section id="getting-help" ns={NS} titleKey="sections.getting-help">
        <List k="help.points" ns={NS} />
      </Section>
    </Page>
  );
}
