// SPDX-License-Identifier: MIT
// M4 stub: the page frame and the sections template T7 requires (docs pack 03 §3).
// The prose, demos and tables arrive with M5.
import { Page } from '~/shell/doc';

const NS = 'pages/demos/index';

export default function DemosIndex(): React.ReactElement {
  return <Page ns={NS} />;
}
