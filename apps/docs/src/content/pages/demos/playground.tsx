// SPDX-License-Identifier: MIT
// Playground (T9, docs pack 04 §4): the page frame, and the generated controls below it. Everything
// interactive lives in `~/playground`, because the controls are built from the API data rather than
// written here (C7).
import { P, Page } from '~/shell/doc';
import { Playground as PlaygroundApp } from '~/playground/Playground';

const NS = 'pages/demos/playground';

export default function Playground(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="intro" ns={NS} />
      <PlaygroundApp />
    </Page>
  );
}
