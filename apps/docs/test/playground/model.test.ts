// SPDX-License-Identifier: MIT
// The control the Playground gives each prop (docs pack 04 §4.2), checked against the real API data
// rather than a fixture: if the component gains a prop of a kind the mapping does not handle, this
// test is where it shows.
import { describe, expect, it } from 'vitest';
import scheduler from '../../src/content/api/Scheduler.json';
import { type Control, controls, defaultLabel, groups, parseValue } from '../../src/playground/model';

const all = controls();
const byName = new Map(all.map((control) => [control.prop.name, control]));

function control(name: string): Control {
  const found = byName.get(name);
  if (found === undefined) throw new Error(`${name} is not a prop of the component`);
  return found;
}

describe('controls', () => {
  it('covers every prop of the component exactly once', () => {
    expect(all).toHaveLength(scheduler.props.length);
    expect(new Set(all.map((entry) => entry.prop.name)).size).toBe(all.length);
  });

  it('gives a boolean prop a select of true and false', () => {
    const enablePinning = control('enablePinning');
    expect(enablePinning.kind).toBe('boolean');
    expect(enablePinning.options).toEqual(['true', 'false']);
    expect(defaultLabel(enablePinning.prop)).toBe('true');
  });

  it('gives a string-literal union its own members', () => {
    expect(control('view').kind).toBe('select');
    expect(control('view').options).toEqual(['list', 'timeline']);
    expect(control('density').options).toEqual(['standard', 'comfortable', 'dense']);
  });

  it('offers auto beside the booleans where the type allows it', () => {
    const compact = control('compact');
    expect(compact.kind).toBe('select');
    expect(compact.options).toEqual(['auto', 'true', 'false']);
  });

  it('adds a slider to a number that declares both bounds', () => {
    expect(control('compactBreakpoint').kind).toBe('number');
    expect(control('compactBreakpoint').slider).toBe(true);
    expect(control('overflowPage').slider).toBe(false);
  });

  it('leaves the data, the callbacks and the complex props to the code', () => {
    expect(control('items').kind).toBe('code-only');
    expect(control('levels').kind).toBe('code-only');
    expect(control('renderItem').kind).toBe('code-only');
    expect(control('localization').kind).toBe('code-only');
    expect(control('onViewChange').kind).toBe('event');
  });

  it('wires every callback to the log', () => {
    const events = all.filter((entry) => entry.kind === 'event');
    expect(events.length).toBeGreaterThan(10);
    for (const entry of events) expect(entry.prop.name).toMatch(/^on[A-Z]/);
  });
});

describe('groups', () => {
  it('keeps only the editable props, grouped by category', () => {
    const editable = all.filter((entry) => entry.kind !== 'event' && entry.kind !== 'code-only');
    expect(groups(all).flatMap((group) => group.controls)).toHaveLength(editable.length);
    expect(groups(all).map((group) => group.category)).toContain('Appearance');
  });
});

describe('parseValue', () => {
  it('turns what a control produces into what the prop expects', () => {
    expect(parseValue(control('enablePinning'), 'false')).toBe(false);
    expect(parseValue(control('compact'), 'auto')).toBe('auto');
    expect(parseValue(control('compact'), 'true')).toBe(true);
    expect(parseValue(control('overflowPageSize'), '25')).toBe(25);
    expect(parseValue(control('headingLevel'), '4')).toBe(4);
    expect(parseValue(control('aria-label'), 'Shift board')).toBe('Shift board');
  });

  it('reads an empty control as "leave it at the default"', () => {
    expect(parseValue(control('view'), '')).toBeUndefined();
    expect(parseValue(control('overflowPageSize'), '')).toBeUndefined();
    expect(parseValue(control('overflowPageSize'), 'abc')).toBeUndefined();
  });
});
