// SPDX-License-Identifier: MIT
// Theme editor (docs pack 04 §4.7): the page frame, and the token controls below it. The controls
// are generated from the package's own stylesheet, so a token that is added appears here by itself.
import { P, Page } from '~/shell/doc';
import { ThemeEditor as ThemeEditorApp } from '~/playground/ThemeEditor';

const NS = 'pages/demos/theme-editor';

export default function ThemeEditor(): React.ReactElement {
  return (
    <Page ns={NS}>
      <P k="intro" ns={NS} />
      <ThemeEditorApp />
    </Page>
  );
}
