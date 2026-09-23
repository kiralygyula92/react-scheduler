// SPDX-License-Identifier: MIT
// Capability page (T6): what happens to the items a crowded hour cannot place, and the dialog that
// holds them.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import overflowColumn from '~/content/api/OverflowColumn.json';
import OverflowColumns from '~/demos/overflow/columns';
import columnsSource from '~/demos/overflow/columns.tsx?raw';

const NS = 'pages/features/overflow';

export default function OverflowPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="overflow-columns"
          ns={NS}
          titleKey="demos.columns"
          component={<OverflowColumns />}
          source={columnsSource}
          height={460}
        />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="columns" ns={NS} titleKey="sections.columns">
        <P k="columns.intro" ns={NS} />
        <PropsTable members={overflowColumn.props} />
        <P k="columns.sorting" ns={NS} />
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
