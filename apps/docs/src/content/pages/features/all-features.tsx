// SPDX-License-Identifier: MIT
// All features (T5, docs pack 03 §3.5): a scope sentence, then the sidebar's own groups as card
// grids. The grids are generated from `nav.json`, so this page cannot fall behind the navigation.
import { FeatureGrid, P, Page } from '~/shell/doc';

const NS = 'pages/features/all-features';

export default function AllFeatures(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="scope" ns={NS} />
      <FeatureGrid ns={NS} />
    </Page>
  );
}
