// SPDX-License-Identifier: MIT
// 240 items over the three rendered shifts: the size the virtualization is measured at.
// The data is the `large` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/large.json';
import { FixtureBoard } from '../_shared/board';

export default function Large(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
