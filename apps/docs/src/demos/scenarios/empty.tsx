// SPDX-License-Identifier: MIT
// No items at all: the empty state, and the navigation that is not drawn.
// The data is the `empty` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/empty.json';
import { FixtureBoard } from '../_shared/board';

export default function Empty(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
