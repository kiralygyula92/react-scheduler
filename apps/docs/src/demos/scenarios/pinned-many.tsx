// SPDX-License-Identifier: MIT
// Six items of a pinning level in the previous shift, and what the pinned strip does with them.
// The data is the `pinned-many` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/pinned-many.json';
import { FixtureBoard } from '../_shared/board';

export default function PinnedMany(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
