// SPDX-License-Identifier: MIT
// One page for a family of exported types (docs pack 05 §4 applied to types, EXCEPTIONS.md #11):
// each type gets a heading, its description, its members or its allowed values. Generated from the
// API data like the symbol pages, so the reference cannot fall behind the declarations.
import { useT } from '~/i18n/useT';
import { Code } from './Code';
import { Inline } from './Inline';
import { Page } from './Page';
import { type ApiProp, PropsTable } from './PropsTable';
import { Section } from './Section';

export interface ApiTypeData {
  readonly name: string;
  readonly descriptionKey: string;
  readonly props?: readonly ApiProp[];
  readonly literals?: readonly string[];
}

/** `SchedulerItem` → `scheduler-item`, so the anchor of a type is stable and locale-independent. */
function anchorOf(name: string): string {
  return name
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll('_', '-')
    .toLowerCase();
}

export function TypeGroupPage({ types, ns }: { types: readonly ApiTypeData[]; ns: string }): React.ReactElement {
  const api = useT('api');

  return (
    <Page ns={ns}>
      {types.map((type) => (
        <Section key={type.name} id={anchorOf(type.name)} ns="api" titleKey="" title={type.name}>
          <p>
            <Inline text={api(type.descriptionKey)} />
          </p>
          {(type.literals ?? []).length > 0 && (
            <Code lang="ts">{(type.literals ?? []).map((value) => `'${value}'`).join(' | ')}</Code>
          )}
          <PropsTable members={type.props ?? []} />
        </Section>
      ))}
    </Page>
  );
}
