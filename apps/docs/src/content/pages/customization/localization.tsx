// SPDX-License-Identifier: MIT
// Localization (T12): the seven built-in packs, a partial override, and a language of your own.
import { Code, Demo, List, P, Page, Section, Table } from '~/shell/doc';
import Localization from '~/demos/customization/localization';
import localizationSource from '~/demos/customization/localization.tsx?raw';

const NS = 'pages/customization/localization';

const PACK = `import { roRO } from '@react-schedulerkit/react-scheduler/locales/ro';

<Scheduler items={items} localization={roRO} />;`;

const OWN = `import { enUS } from '@react-schedulerkit/react-scheduler';

const nlNL: SchedulerLocalization = {
  ...enUS,
  locale: 'nl-NL',
  emptyAll: 'Geen agendagegevens beschikbaar.',
  // … every other key of SchedulerLocalization
};`;

export default function LocalizationPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="built-in-locales" ns={NS} titleKey="sections.built-in-locales">
        <P k="packs.intro" ns={NS} />
        <Code lang="tsx">{PACK}</Code>
        <Table k="packs.rows" ns={NS} headKeys={['packs.head.pack', 'packs.head.language', 'packs.head.status']} />
      </Section>

      <Section id="custom-messages" ns={NS} titleKey="sections.custom-messages">
        <P k="messages.intro" ns={NS} />
        <Demo
          id="localization"
          ns={NS}
          titleKey="demos.localization"
          component={<Localization />}
          source={localizationSource}
          height={420}
        />
        <List k="messages.points" ns={NS} />
      </Section>

      <Section id="adding-a-language" ns={NS} titleKey="sections.adding-a-language">
        <P k="adding.intro" ns={NS} />
        <Code lang="tsx">{OWN}</Code>
        <P k="adding.formats" ns={NS} />
      </Section>
    </Page>
  );
}
