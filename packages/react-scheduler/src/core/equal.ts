// SPDX-License-Identifier: MIT
// Structural equality for small option objects, so inline props (`shifts={{ before: 2 }}`) do not
// re-derive the model on every render (Feature Dossier 05 F-30). Functions and class instances
// compare by identity.

function isPlainObject(value: object): boolean {
  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, index) => deepEqual(value, b[index]));
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  const recordA = a as Record<string, unknown>;
  const recordB = b as Record<string, unknown>;
  return keysA.every((key) => Object.hasOwn(recordB, key) && deepEqual(recordA[key], recordB[key]));
}

/** Returns the previous value while each new one is structurally equal to it. */
export function stabilizer<T>(): (value: T) => T {
  let last: { value: T } | undefined;
  return (value) => {
    if (last && deepEqual(last.value, value)) return last.value;
    last = { value };
    return value;
  };
}

/** Shallow equality of two records by `Object.is`. */
export function shallowEqual<T extends object>(a: T, b: T): boolean {
  const keys = Object.keys(a) as (keyof T)[];
  return keys.length === Object.keys(b).length && keys.every((key) => Object.is(a[key], b[key]));
}
