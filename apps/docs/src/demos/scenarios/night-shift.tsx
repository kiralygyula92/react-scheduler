// SPDX-License-Identifier: MIT
// The selected time is 02:00, so the current shift is the one that started at 20:00 the day before.
// The data is the `night-shift` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/night-shift.json';
import { FixtureBoard } from '../_shared/board';

export default function NightShift(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
