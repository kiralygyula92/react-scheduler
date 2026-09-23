// SPDX-License-Identifier: MIT
// Slots and overrides (T12): the generated table of parts, and one worked example.
import { Code, Demo, List, P, Page, Section, SlotTable } from '~/shell/doc';
import Slots from '~/demos/customization/slots';
import slotsSource from '~/demos/customization/slots.tsx?raw';

const NS = 'pages/customization/slots';

const SHAPE = `function MyChip({ ownerState, Default, ...props }: SlotProps<'moreChip', Item>) {
  // \`props\` carries the class, the ref, the handlers and the accessible name.
  return <button {...props} data-mine="" />;
}`;

export default function SlotsPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="slots" ns={NS} titleKey="sections.slots">
        <P k="intro" ns={NS} />
        <Code lang="tsx">{SHAPE}</Code>
        <List k="rules" ns={NS} />
        <P k="table" ns={NS} />
        <SlotTable />
      </Section>

      <Section id="example" ns={NS} titleKey="sections.example">
        <P k="example.intro" ns={NS} />
        <Demo id="slots" ns={NS} titleKey="demos.slots" component={<Slots />} source={slotsSource} height={480} />
      </Section>
    </Page>
  );
}
