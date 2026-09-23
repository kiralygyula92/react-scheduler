// SPDX-License-Identifier: MIT
// Capability page (T6, docs pack 03 §3.6): what the timeline does by default, what you can change,
// what a keyboard and a screen reader get, and where it stops. Every demo is the file it shows.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import timelineOptions from '~/content/api/TimelineOptions.json';
import TimelineBasics from '~/demos/timeline-view/basics';
import basicsSource from '~/demos/timeline-view/basics.tsx?raw';
import TimelineColumnPlacement from '~/demos/timeline-view/column-placement';
import columnPlacementSource from '~/demos/timeline-view/column-placement.tsx?raw';
import TimelineColumns from '~/demos/timeline-view/columns';
import columnsSource from '~/demos/timeline-view/columns.tsx?raw';
import TimelineOverflowWindow from '~/demos/timeline-view/overflow-window';
import overflowWindowSource from '~/demos/timeline-view/overflow-window.tsx?raw';

const NS = 'pages/features/timeline-view';

export default function TimelineView(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="timeline-basics"
          ns={NS}
          titleKey="demos.basics"
          component={<TimelineBasics />}
          source={basicsSource}
          height={480}
        />
        <P k="basics.grid" ns={NS} />
        <List k="basics.parts" ns={NS} />
      </Section>

      <Section id="accessibility" ns={NS} titleKey="sections.accessibility">
        <P k="accessibility.intro" ns={NS} />
        <List k="accessibility.points" ns={NS} />
      </Section>

      <Section id="customization" ns={NS} titleKey="sections.customization">
        <P k="customization.intro" ns={NS} />
        <Demo
          id="timeline-columns"
          ns={NS}
          titleKey="demos.columns"
          component={<TimelineColumns />}
          source={columnsSource}
          height={480}
        />
        <P k="customization.placement" ns={NS} />
        <Demo
          id="timeline-column-placement"
          ns={NS}
          titleKey="demos.columnPlacement"
          component={<TimelineColumnPlacement />}
          source={columnPlacementSource}
          height={480}
        />
        <P k="customization.overflow" ns={NS} />
        <Demo
          id="timeline-overflow-window"
          ns={NS}
          titleKey="demos.overflowWindow"
          component={<TimelineOverflowWindow />}
          source={overflowWindowSource}
          height={480}
        />
        <P k="customization.options" ns={NS} />
        <PropsTable members={timelineOptions.props} />
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
