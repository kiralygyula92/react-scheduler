// SPDX-License-Identifier: MIT
// Capability page (T6): how a day is cut into shifts, and which of them are rendered.
import { ApiLinks, Demo, List, P, Page, PropsTable, Section } from '~/shell/doc';
import shiftOptions from '~/content/api/ShiftOptions.json';
import MoreShifts from '~/demos/shifts-and-dates/more-shifts';
import moreShiftsSource from '~/demos/shifts-and-dates/more-shifts.tsx?raw';
import ShiftPattern from '~/demos/shifts-and-dates/pattern';
import patternSource from '~/demos/shifts-and-dates/pattern.tsx?raw';
import RegularShifts from '~/demos/shifts-and-dates/regular';
import regularSource from '~/demos/shifts-and-dates/regular.tsx?raw';

const NS = 'pages/features/shifts-and-dates';

export default function ShiftsAndDates(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="basics" ns={NS} titleKey="sections.basics">
        <P k="basics.intro" ns={NS} />
        <Demo
          id="regular-shifts"
          ns={NS}
          titleKey="demos.regular"
          component={<RegularShifts />}
          source={regularSource}
          height={460}
        />
        <P k="basics.day" ns={NS} />
      </Section>

      <Section id="patterns" ns={NS} titleKey="sections.patterns">
        <P k="patterns.intro" ns={NS} />
        <Demo
          id="shift-pattern"
          ns={NS}
          titleKey="demos.pattern"
          component={<ShiftPattern />}
          source={patternSource}
          height={460}
        />
      </Section>

      <Section id="how-many" ns={NS} titleKey="sections.how-many">
        <P k="howMany.intro" ns={NS} />
        <Demo
          id="more-shifts"
          ns={NS}
          titleKey="demos.moreShifts"
          component={<MoreShifts />}
          source={moreShiftsSource}
          height={460}
        />
        <P k="howMany.options" ns={NS} />
        <PropsTable members={shiftOptions.props} />
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
