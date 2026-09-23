// SPDX-License-Identifier: MIT
// The API index (T10). Every row comes from the generated API data; nothing here is written by hand
// (C6). The tables live in `ApiIndex` so the page keeps the shape every other page has.
import { ApiIndex, Page } from '~/shell/doc';

const NS = 'pages/reference/index';

export default function ReferenceIndex(): React.ReactElement {
  return (
    <Page ns={NS}>
      <ApiIndex ns={NS} />
    </Page>
  );
}
