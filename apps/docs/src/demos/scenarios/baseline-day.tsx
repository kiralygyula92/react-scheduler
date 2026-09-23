// SPDX-License-Identifier: MIT
// A day shift with items in all three shifts, one crowded hour and two levels that pin.
// The data is the `baseline-day` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/baseline-day.json';
import { FixtureBoard } from '../_shared/board';

export default function BaselineDay(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
