// SPDX-License-Identifier: MIT
// The one place the site renders the inline code spans of TSDoc. Descriptions in `api.json` keep the
// backticks their source comment had, because that is what the package's authors and every
// translator see; here they become `<code>`. Prose written for the site uses the tags of `Trans`
// instead (docs pack 11 §9) — this is only for the generated API strings.
import { Fragment } from 'react';

/** ``selected by `view`.`` → `selected by <code>view</code>.` */
export function Inline({ text }: { text: string }): React.ReactElement {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, index) => {
        const key = `${String(index)}:${part}`;
        return index % 2 === 1 ? <code key={key}>{part}</code> : <Fragment key={key}>{part}</Fragment>;
      })}
    </>
  );
}
