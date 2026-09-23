// SPDX-License-Identifier: MIT
// One item per shift, which is under the threshold the navigation buttons appear at.
// The data is the `sparse` characterization fixture, reduced to the shape of the day; the wording is
// the site's own, so the scenario reads in the language of the page.
import fixture from '~/content/fixtures/sparse.json';
import { FixtureBoard } from '../_shared/board';

export default function Sparse(): React.ReactElement {
  return <FixtureBoard fixture={fixture} />;
}
