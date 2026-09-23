// SPDX-License-Identifier: MIT
// Customization overview (T12, docs pack 03 §3.12): the override levels from the lightest to the
// heaviest, each with a two-line example and a link to the page that goes further.
import { Code, P, Page, Section } from '~/shell/doc';

const NS = 'pages/customization/overview';

const VARIABLES = `<Scheduler items={items} style={{ '--rs-color-now': '#0f766e' }} />;`;

const CLASS_NAMES = `<Scheduler items={items} classNames={{ listCard: 'my-card' }} />;`;

const SLOT_PROPS = `<Scheduler items={items} slotProps={{ cardTitle: { title: 'Open the item' } }} />;`;

const SLOTS = `<Scheduler items={items} slots={{ moreChip: MyChip }} />;`;

const HANDLERS = `<Scheduler items={items} handlers={{ onItemActivate: (ctx, next) => confirm() && next() }} />;`;

const HOOKS = `const scheduler = useScheduler({ items, levels, shifts });`;

export default function CustomizationOverview(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />

      <Section id="css-variables" ns={NS} titleKey="sections.css-variables">
        <P k="variables.text" ns={NS} />
        <Code lang="tsx">{VARIABLES}</Code>
      </Section>

      <Section id="class-names" ns={NS} titleKey="sections.class-names">
        <P k="classNames.text" ns={NS} />
        <Code lang="tsx">{CLASS_NAMES}</Code>
      </Section>

      <Section id="slot-props" ns={NS} titleKey="sections.slot-props">
        <P k="slotProps.text" ns={NS} />
        <Code lang="tsx">{SLOT_PROPS}</Code>
      </Section>

      <Section id="slots" ns={NS} titleKey="sections.slots">
        <P k="slots.text" ns={NS} />
        <Code lang="tsx">{SLOTS}</Code>
      </Section>

      <Section id="handlers" ns={NS} titleKey="sections.handlers">
        <P k="handlers.text" ns={NS} />
        <Code lang="tsx">{HANDLERS}</Code>
      </Section>

      <Section id="headless-hooks" ns={NS} titleKey="sections.headless-hooks">
        <P k="hooks.text" ns={NS} />
        <Code lang="tsx">{HOOKS}</Code>
      </Section>
    </Page>
  );
}
