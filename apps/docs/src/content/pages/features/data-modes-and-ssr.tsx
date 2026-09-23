// SPDX-License-Identifier: MIT
// Capability page (T6) with the "Server and client" section 03 §3.6 requires of a feature that has
// data modes.
import { ApiLinks, Code, Demo, List, P, Page, Section } from '~/shell/doc';
import ServerData from '~/demos/data-modes-and-ssr/server-data';
import serverDataSource from '~/demos/data-modes-and-ssr/server-data.tsx?raw';

const NS = 'pages/features/data-modes-and-ssr';

const DETERMINISTIC = `// The server and the first client render agree because both are given the same moment.
<Scheduler items={items} date={date} now={renderedAt} />;`;

export default function DataModesAndSsr(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="server-data"
          ns={NS}
          titleKey="demos.serverData"
          component={<ServerData />}
          source={serverDataSource}
          height={460}
        />
        <P k="basics.range" ns={NS} />
      </Section>

      <Section id="server-and-client" ns={NS} titleKey="sections.server-and-client">
        <P k="server.intro" ns={NS} />
        <List k="server.points" ns={NS} />
        <Code lang="tsx">{DETERMINISTIC}</Code>
      </Section>

      <Section id="accessibility" ns={NS} titleKey="sections.accessibility">
        <List k="accessibility.points" ns={NS} />
      </Section>

      <Section id="customization" ns={NS} titleKey="sections.customization">
        <List k="customization.points" ns={NS} />
      </Section>

      <Section id="limitations" ns={NS} titleKey="sections.limitations">
        <List k="limitations.points" ns={NS} />
      </Section>

      <Section id="api" ns={NS} titleKey="sections.api">
        <ApiLinks />
      </Section>
    </Page>
  );
}
