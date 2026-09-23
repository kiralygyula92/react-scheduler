// SPDX-License-Identifier: MIT
// A day two days before now: everything has already happened, so there is no now indicator.
// The data is the `past-date` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/past-date.json';
import { FixtureBoard } from '../_shared/board';

export default function PastDate(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
