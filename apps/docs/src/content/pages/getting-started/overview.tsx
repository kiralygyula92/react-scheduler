// SPDX-License-Identifier: MIT
// The overview (T1, docs pack 03 §3.1). It teaches nothing; it says what the package is and routes
// to the six pages a reader needs next.
import { type Card, CardGrid, P, Page, Section } from '~/shell/doc';

const NS = 'pages/getting-started/overview';

/** Why the package: each reason, and the page that shows it. */
const WHY: readonly Card[] = [
  { to: '/discover-more/accessibility/', titleKey: 'why.cards.accessible.title', textKey: 'why.cards.accessible.text' },
  { to: '/customization/theming/', titleKey: 'why.cards.themed.title', textKey: 'why.cards.themed.text' },
  {
    to: '/getting-started/installation/',
    titleKey: 'why.cards.dependencies.title',
    textKey: 'why.cards.dependencies.text',
  },
  { to: '/data-modes-and-ssr/', titleKey: 'why.cards.server.title', textKey: 'why.cards.server.text' },
  { to: '/getting-started/requirements/', titleKey: 'why.cards.size.title', textKey: 'why.cards.size.text' },
  { to: '/customization/localization/', titleKey: 'why.cards.languages.title', textKey: 'why.cards.languages.text' },
];

const CARDS: readonly Card[] = [
  { to: '/getting-started/installation/', titleKey: 'cards.installation.title', textKey: 'cards.installation.text' },
  { to: '/getting-started/usage/', titleKey: 'cards.usage.title', textKey: 'cards.usage.text' },
  { to: '/all-features/', titleKey: 'cards.features.title', textKey: 'cards.features.text' },
  { to: '/timeline-view/', titleKey: 'cards.timeline.title', textKey: 'cards.timeline.text' },
  { to: '/customization/', titleKey: 'cards.customization.title', textKey: 'cards.customization.text' },
  { to: '/api/', titleKey: 'cards.api.title', textKey: 'cards.api.text' },
];

export default function GettingStartedOverview(): React.ReactElement {
  return (
    <Page ns={NS}>
      <Section id="introduction" ns={NS} titleKey="sections.introduction">
        <P k="introduction.what" ns={NS} />
        <P k="introduction.controlled" ns={NS} />
        <P k="introduction.not" ns={NS} />
      </Section>

      <Section id="why" ns={NS} titleKey="sections.why">
        <CardGrid items={WHY} ns={NS} />
      </Section>

      <Section id="start-now" ns={NS} titleKey="sections.start-now">
        <CardGrid items={CARDS} ns={NS} />
      </Section>

      <Section id="license" ns={NS} titleKey="sections.license">
        <P k="license.text" ns={NS} />
      </Section>
    </Page>
  );
}
