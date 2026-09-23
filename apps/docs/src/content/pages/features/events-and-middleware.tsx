// SPDX-License-Identifier: MIT
// Capability page (T6): what runs before an interaction, what reports it afterwards, and in which
// order the two happen.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section, Table } from '~/shell/doc';
import schedulerHandlers from '~/content/api/SchedulerHandlers.json';
import Middleware from '~/demos/events-and-middleware/middleware';
import middlewareSource from '~/demos/events-and-middleware/middleware.tsx?raw';

const NS = 'pages/features/events-and-middleware';

export default function EventsAndMiddleware(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="middleware"
          ns={NS}
          titleKey="demos.middleware"
          component={<Middleware />}
          source={middlewareSource}
          height={460}
        />
        <P k="basics.next" ns={NS} />
      </Section>

      <Section id="order" ns={NS} titleKey="sections.order">
        <P k="order.intro" ns={NS} />
        <Table k="order.rows" ns={NS} headKeys={['order.head.step', 'order.head.what']} />
        <P k="order.frames" ns={NS} />
      </Section>

      <Section id="middleware" ns={NS} titleKey="sections.middleware">
        <P k="middleware.intro" ns={NS} />
        <PropsTable members={schedulerHandlers.props} />
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
