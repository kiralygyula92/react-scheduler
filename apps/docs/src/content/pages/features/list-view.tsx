// SPDX-License-Identifier: MIT
// Capability page (T6): the list view, its sections and the options that change how it is read.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import listOptions from '~/content/api/ListOptions.json';
import ListBasics from '~/demos/list-view/basics';
import basicsSource from '~/demos/list-view/basics.tsx?raw';
import ListOptionsDemo from '~/demos/list-view/options';
import optionsSource from '~/demos/list-view/options.tsx?raw';

const NS = 'pages/features/list-view';

export default function ListViewPage(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="list-basics"
          ns={NS}
          titleKey="demos.basics"
          component={<ListBasics />}
          source={basicsSource}
          height={460}
        />
        <List k="basics.points" ns={NS} />
      </Section>

      <Section id="reading" ns={NS} titleKey="sections.reading">
        <P k="reading.intro" ns={NS} />
        <Demo
          id="list-options"
          ns={NS}
          titleKey="demos.options"
          component={<ListOptionsDemo />}
          source={optionsSource}
          height={460}
        />
        <P k="reading.options" ns={NS} />
        <PropsTable members={listOptions.props} />
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
