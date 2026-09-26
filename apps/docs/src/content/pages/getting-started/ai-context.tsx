// SPDX-License-Identifier: MIT
// AI context (T3, docs pack 03 §3.3): the one file a coding agent needs, how to give it, and a
// question that proves the agent read it.
import { Code, List, P, Page, Section, Table } from '~/shell/doc';
import { site } from '~/shell/nav';

const NS = 'pages/getting-started/ai-context';

// The site's own origin, so the command and the link point wherever this build is deployed.
const LLMS_FULL = `${site.origin}${site.basePath}llms-full.md`;
const DOWNLOAD = `curl -o docs/react-scheduler.md ${LLMS_FULL}`;

const INSTRUCTION = `React Scheduler documentation, with the source of every example: docs/react-scheduler.md`;

const PROMPT = `Using docs/react-scheduler.md, add a schedule to the shift board:
two 8-hour shifts anchored at 06:00, the timeline view by default,
our own four-level scale, and the detail dialog replaced by our drawer.`;

const QUESTION = `In the timeline view, what decides whether two crowded hours share
one "+ more" group or get one each?`;

export default function AiContext(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="prerequisites" ns={NS} titleKey="sections.prerequisites">
        <P k="prerequisites.text" ns={NS} />
      </Section>

      <Section id="installation" ns={NS} titleKey="sections.installation">
        <P k="install.download" ns={NS} />
        <Code lang="bash">{DOWNLOAD}</Code>
        <P k="install.instruction" ns={NS} />
        <Code lang="md">{INSTRUCTION}</Code>
        <P k="install.url" ns={NS} vars={{ url: LLMS_FULL }} />
      </Section>

      <Section id="what-is-in-the-file" ns={NS} titleKey="sections.what-is-in-the-file">
        <P k="what.text" ns={NS} />
        <List k="what.points" ns={NS} />
      </Section>

      <Section id="which-file-to-use" ns={NS} titleKey="sections.which-file-to-use">
        <Table k="which.rows" ns={NS} headKeys={['which.head.file', 'which.head.holds', 'which.head.when']} />
        <P k="which.context" ns={NS} />
      </Section>

      <Section id="minimal-working-example" ns={NS} titleKey="sections.minimal-working-example">
        <P k="example.text" ns={NS} />
        <Code lang="text">{PROMPT}</Code>
      </Section>

      <Section id="verify" ns={NS} titleKey="sections.verify">
        <P k="verify.text" ns={NS} />
        <Code lang="text">{QUESTION}</Code>
        <P k="verify.answer" ns={NS} />
      </Section>

      <Section id="next-steps" ns={NS} titleKey="sections.next-steps">
        <List k="next.points" ns={NS} />
      </Section>
    </Page>
  );
}
