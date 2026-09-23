// SPDX-License-Identifier: MIT
// What the Playground can offer for each prop of the component (docs pack 04 §4.2). The list is
// derived from `src/content/api/Scheduler.json`, which the extractor writes from the declarations,
// so a prop added to the type appears here without anyone editing this file — and conformance C7
// fails if one goes missing.
import scheduler from '~/content/api/Scheduler.json';

/** One prop of the component, as the extractor writes it (docs pack 05 §2). */
export interface ApiProp {
  readonly name: string;
  readonly type: string;
  readonly typeKind: string;
  readonly literals?: readonly string[];
  readonly default?: string;
  readonly required: boolean;
  readonly category?: string;
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly descriptionKey: string;
  readonly deprecated?: string | null;
}

/**
 * How a prop is offered: a control the reader can change, an event wired to the log, or a prop that
 * only code can set and which is therefore listed rather than edited.
 */
type ControlKind = 'boolean' | 'select' | 'number' | 'text' | 'event' | 'code-only';

export interface Control {
  readonly prop: ApiProp;
  readonly kind: ControlKind;
  /** The values a select offers, beside the entry that leaves the prop at its default. */
  readonly options: readonly string[];
  /** A number control gets a slider as well when the declaration gives it both bounds. */
  readonly slider: boolean;
}

/** The props Setup owns, because a control cannot express them and the scenario decides them. */
const SETUP_PROPS = new Set(['items', 'segments', 'date', 'defaultDate', 'now', 'localization', 'locale']);

/** Props that are code only however simple their type looks: changing them here would mean nothing. */
const NEVER_EDITABLE = new Set(['className', 'id', 'unstyled']);

const props = scheduler.props as readonly ApiProp[];

/** `'auto'` in a union such as `boolean | 'auto'`, which a select offers next to true and false. */
function unionLiterals(type: string): readonly string[] {
  return type
    .split('|')
    .map((part) => part.trim())
    .filter((part) => part.startsWith("'") && part.endsWith("'"))
    .map((part) => part.slice(1, -1));
}

/** Whether a union is only literals and primitives a text or select control can produce. */
function editableUnion(prop: ApiProp): ControlKind | undefined {
  const parts = prop.type.split('|').map((part) => part.trim());
  const simple = parts.every(
    (part) =>
      part === 'boolean' || part === 'null' || part === 'string' || /^'[^']*'$/.test(part) || /^\d+$/.test(part),
  );
  if (!simple) return undefined;
  if (parts.includes('string')) return 'text';
  return 'select';
}

function kindOf(prop: ApiProp): ControlKind {
  if (prop.name.startsWith('on') && prop.typeKind === 'function') return 'event';
  if (SETUP_PROPS.has(prop.name) || NEVER_EDITABLE.has(prop.name)) return 'code-only';
  switch (prop.typeKind) {
    case 'boolean': {
      return 'boolean';
    }
    case 'literal-union': {
      return 'select';
    }
    case 'number': {
      return 'number';
    }
    case 'string': {
      return 'text';
    }
    case 'union': {
      return editableUnion(prop) ?? 'code-only';
    }
    default: {
      return 'code-only';
    }
  }
}

function optionsOf(prop: ApiProp, kind: ControlKind): readonly string[] {
  if (kind === 'boolean') return ['true', 'false'];
  if (kind !== 'select') return [];
  if (prop.literals !== undefined && prop.literals.length > 0) return prop.literals;
  const parts = prop.type.split('|').map((part) => part.trim());
  return [
    ...unionLiterals(prop.type),
    ...(parts.includes('boolean') ? ['true', 'false'] : []),
    ...parts.filter((part) => /^\d+$/.test(part)),
    ...(parts.includes('null') ? ['null'] : []),
  ];
}

/** Every prop of the component, in declaration order, with the control it gets. */
export function controls(): readonly Control[] {
  return props.map((prop) => {
    const kind = kindOf(prop);
    return {
      prop,
      kind,
      options: optionsOf(prop, kind),
      slider: kind === 'number' && prop.min !== undefined && prop.max !== undefined,
    };
  });
}

/** The controls of one `@category`, in the order the categories first appear. */
export interface ControlGroup {
  readonly category: string;
  readonly controls: readonly Control[];
}

export function groups(all: readonly Control[]): readonly ControlGroup[] {
  const byCategory = new Map<string, Control[]>();
  for (const control of all) {
    if (control.kind === 'event' || control.kind === 'code-only') continue;
    const category = control.prop.category ?? 'Other';
    const list = byCategory.get(category);
    if (list === undefined) byCategory.set(category, [control]);
    else list.push(control);
  }
  return [...byCategory].map(([category, list]) => ({ category, controls: list }));
}

/** The value a control shows when nothing has been chosen: the declared default, or "—". */
export function defaultLabel(prop: ApiProp): string {
  return prop.default ?? '—';
}

/**
 * Turns the string a control produces into the value the component is given. Controls carry strings
 * because that is what `<select>` and `<input>` give, and because the URL carries strings too.
 */
export function parseValue(control: Control, raw: string): unknown {
  if (raw === '') return undefined;
  switch (control.kind) {
    case 'boolean': {
      return raw === 'true';
    }
    case 'number': {
      const value = Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
    case 'select': {
      if (raw === 'true' || raw === 'false') return raw === 'true';
      if (raw === 'null') return null;
      return /^\d+$/.test(raw) ? Number(raw) : raw;
    }
    default: {
      return raw;
    }
  }
}
