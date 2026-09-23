// SPDX-License-Identifier: MIT
// Guide (T13): React Router in framework mode, where the loader holds the items and the route
// renders them. This site is built the same way.
import { Code, List, P, Page, Section } from '~/shell/doc';

const NS = 'pages/integrations/react-router';

const PACKAGE = '@react-schedulerkit/react-scheduler';

const ROOT = `import '@react-schedulerkit/react-scheduler/styles.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}`;

const ROUTE = `import { Scheduler } from '@react-schedulerkit/react-scheduler';
import type { Route } from './+types/shifts';

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const date = url.searchParams.get('date') ?? new Date().toISOString();
  return { items: await getItems(date), date };
}

export default function Shifts({ loaderData }: Route.ComponentProps) {
  return <Scheduler items={loaderData.items} date={loaderData.date} now={loaderData.date} />;
}`;

const RANGE = `const [, setSearchParams] = useSearchParams();

<Scheduler
  items={loaderData.items}
  date={loaderData.date}
  onVisibleRangeChange={(range) => {
    setSearchParams({ date: range.start.toISOString() }, { preventScrollReset: true });
  }}
/>;`;

export default function ReactRouterPage(): React.ReactElement {
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
          <Code lang="tsx">{ROOT}</Code>
        </Section>

        <Section id="step-route" ns={NS} titleKey="steps.route.title" level={3}>
          <P k="steps.route.text" ns={NS} />
          <Code lang="tsx">{ROUTE}</Code>
        </Section>

        <Section id="step-range" ns={NS} titleKey="steps.range.title" level={3}>
          <P k="steps.range.text" ns={NS} />
          <Code lang="tsx">{RANGE}</Code>
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
