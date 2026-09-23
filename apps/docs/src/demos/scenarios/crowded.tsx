// SPDX-License-Identifier: MIT
// Seven items over the same two hours: the column cap, the promotion and the overflow buckets.
// The data is the `crowded` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/crowded.json';
import { FixtureBoard } from '../_shared/board';

export default function Crowded(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
