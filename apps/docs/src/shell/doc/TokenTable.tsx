// SPDX-License-Identifier: MIT
// The design tokens and the slots, as tables generated from the API data (docs pack 03 §3.12): the
// Customization pages never list a token or a part by hand, so neither can fall behind the package.
import { useT } from '~/i18n/useT';
import reference from '~/content/api/reference.json';
import scheduler from '~/content/api/Scheduler.json';
import { Section } from './Section';

interface Token {
  readonly name: string;
  readonly light: string;
  readonly dark: string;
  readonly category: string;
}

/** The families the tokens are read in; the category is the word after the `--rs-` prefix. */
const FAMILIES: readonly { readonly id: string; readonly categories: readonly string[] }[] = [
  { id: 'color', categories: ['color', 'surface', 'now'] },
  { id: 'typography', categories: ['text', 'font', 'letter'] },
  { id: 'levels', categories: ['level', 'alert'] },
  { id: 'shape', categories: ['radius', 'shadow', 'focus', 'dialog'] },
  { id: 'motion', categories: ['duration', 'ease'] },
];

const NAMED = new Set(FAMILIES.flatMap((family) => family.categories));

function Rows({ variables, labels }: { variables: readonly Token[]; labels: readonly string[] }): React.ReactElement {
  return (
    <div className="ds-table-wrap" tabIndex={0}>
      <table className="ds-table">
        <thead>
          <tr>
            {labels.map((label) => (
              <th key={label} scope="col">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => (
            <tr key={variable.name} id={`css-${variable.name.replace('--rs-', '')}`}>
              <th scope="row">
                <code>{variable.name}</code>
              </th>
              <td>
                <code>{variable.light}</code>
              </td>
              <td>
                <code>{variable.dark}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One section per family, each with the family's own sentence from the page's locale file. */
export function TokenTable({ ns }: { ns: string }): React.ReactElement {
  const api = useT('api');
  const page = useT(ns);
  const labels = [api('table.variable'), api('table.light'), api('table.dark')];
  const tokens = reference.cssVars as readonly Token[];
  const groups = [
    ...FAMILIES.map((family) => ({
      id: family.id,
      variables: tokens.filter((token) => family.categories.includes(token.category)),
    })),
    { id: 'layout', variables: tokens.filter((token) => !NAMED.has(token.category)) },
  ];

  return (
    <>
      {groups.map((group) => (
        <Section key={group.id} id={`tokens-${group.id}`} ns={ns} titleKey={`families.${group.id}.title`} level={3}>
          <p>{page(`families.${group.id}.text`)}</p>
          <Rows variables={group.variables} labels={labels} />
        </Section>
      ))}
    </>
  );
}

/** Every replaceable part, with the props its slot receives. */
export function SlotTable(): React.ReactElement {
  const api = useT('api');
  return (
    <div className="ds-table-wrap" tabIndex={0}>
      <table className="ds-table">
        <thead>
          <tr>
            <th scope="col">{api('table.slot')}</th>
            <th scope="col">{api('table.propsType')}</th>
          </tr>
        </thead>
        <tbody>
          {scheduler.slots.map((slot) => (
            <tr key={slot.name} id={`slot-${slot.name}`}>
              <th scope="row">
                <code>{slot.name}</code>
              </th>
              <td>
                <code>{slot.propsType}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
