// SPDX-License-Identifier: MIT
// The part of JSON Schema `nav.schema.json` uses (docs pack 11), validated without a dependency:
// type, required, additionalProperties, properties, patternProperties-free objects, prefixItems,
// items (including `false`), const, enum, pattern, minLength, minItems, maxItems, oneOf and local
// `$ref`s into `$defs`. Anything the schema gains beyond that has to be added here too, so the
// validator fails loudly on a keyword it does not know.

export interface Schema {
  readonly [keyword: string]: unknown;
}

const KNOWN = new Set([
  '$schema',
  '$id',
  '$ref',
  '$defs',
  'title',
  'description',
  'type',
  'required',
  'additionalProperties',
  'properties',
  'prefixItems',
  'items',
  'const',
  'enum',
  'pattern',
  'format',
  'minLength',
  'minItems',
  'maxItems',
  'oneOf',
  'default',
]);

function typeOf(value: unknown): string {
  if (Array.isArray(value)) return 'array';
  if (value === null) return 'null';
  return typeof value;
}

function target(root: Schema, reference: string): Schema {
  const path = reference.replace(/^#\//, '').split('/');
  let node: unknown = root;
  for (const part of path) node = (node as Record<string, unknown>)[part];
  return node as Schema;
}

export function validate(value: unknown, schema: Schema, root: Schema = schema, path = ''): string[] {
  const errors: string[] = [];
  const at = path === '' ? '(root)' : path;

  // A `$ref` with siblings applies both schemas to the value (JSON Schema 2020-12 §8.2.3): the
  // sections in nav.schema.json are `{ $ref: section, properties: { id: { const } } }`, and merging
  // the two `properties` objects instead would hide every key the referenced schema defines.
  const reference = schema['$ref'];
  if (typeof reference === 'string') {
    errors.push(...validate(value, target(root, reference), root, path));
    const siblings = Object.fromEntries(Object.entries(schema).filter(([keyword]) => keyword !== '$ref'));
    if (Object.keys(siblings).length > 0) errors.push(...validate(value, siblings, root, path));
    return errors;
  }
  const active = schema;

  for (const keyword of Object.keys(active)) {
    if (!KNOWN.has(keyword)) errors.push(`${at}: the validator does not know the keyword "${keyword}"`);
  }

  if (typeof active['type'] === 'string' && typeOf(value) !== active['type']) {
    if (!(active['type'] === 'number' && typeOf(value) === 'number')) {
      errors.push(`${at}: expected ${active['type']}, found ${typeOf(value)}`);
      return errors;
    }
  }
  if ('const' in active && JSON.stringify(value) !== JSON.stringify(active['const'])) {
    errors.push(`${at}: expected ${JSON.stringify(active['const'])}`);
  }
  if (
    Array.isArray(active['enum']) &&
    !active['enum'].some((option) => JSON.stringify(option) === JSON.stringify(value))
  ) {
    errors.push(`${at}: ${JSON.stringify(value)} is not one of ${JSON.stringify(active['enum'])}`);
  }
  if (typeof value === 'string') {
    if (typeof active['pattern'] === 'string' && !new RegExp(active['pattern']).test(value)) {
      errors.push(`${at}: "${value}" does not match ${active['pattern']}`);
    }
    if (typeof active['minLength'] === 'number' && value.length < active['minLength']) {
      errors.push(`${at}: shorter than ${String(active['minLength'])}`);
    }
  }

  if (Array.isArray(value)) {
    if (typeof active['minItems'] === 'number' && value.length < active['minItems']) {
      errors.push(`${at}: needs at least ${String(active['minItems'])} items`);
    }
    if (typeof active['maxItems'] === 'number' && value.length > active['maxItems']) {
      errors.push(`${at}: allows at most ${String(active['maxItems'])} items`);
    }
    const prefix = Array.isArray(active['prefixItems']) ? (active['prefixItems'] as Schema[]) : [];
    value.forEach((item, index) => {
      const itemSchema = prefix[index] ?? (active['items'] as Schema | false | undefined);
      if (itemSchema === false) {
        errors.push(`${at}[${String(index)}]: no further items are allowed`);
        return;
      }
      if (itemSchema === undefined) return;
      errors.push(...validate(item, itemSchema, root, `${at}[${String(index)}]`));
    });
  }

  if (typeOf(value) === 'object') {
    const object = value as Record<string, unknown>;
    const properties = (active['properties'] ?? {}) as Record<string, Schema>;
    for (const key of (active['required'] ?? []) as string[]) {
      if (!(key in object)) errors.push(`${at}: "${key}" is required`);
    }
    for (const [key, item] of Object.entries(object)) {
      const propertySchema = properties[key];
      if (propertySchema === undefined) {
        if (active['additionalProperties'] === false) errors.push(`${at}: "${key}" is not allowed`);
        continue;
      }
      errors.push(...validate(item, propertySchema, root, `${at}.${key}`));
    }
  }

  if (Array.isArray(active['oneOf'])) {
    const matches = (active['oneOf'] as Schema[]).filter(
      (option) => validate(value, option, root, at).length === 0,
    ).length;
    if (matches !== 1) errors.push(`${at}: matches ${String(matches)} of the allowed shapes, expected exactly one`);
  }

  return errors;
}
