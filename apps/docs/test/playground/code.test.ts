// SPDX-License-Identifier: MIT
// The JSX the Playground shows (docs pack 04 §4.4): the imports, and exactly the props that differ
// from their defaults — a reader has to be able to paste it and get what is on the screen.
import { describe, expect, it } from 'vitest';
import { generate } from '../../src/playground/code';
import { controls } from '../../src/playground/model';

const all = controls().filter((control) => control.kind !== 'event');
const base = { controls: all, locale: 'en', dataset: 'An ordinary day' };

describe('generate', () => {
  it('writes the component with nothing but the items when nothing has changed', () => {
    const code = generate({ ...base, changed: {} });
    expect(code).toContain(`import { Scheduler } from '@react-schedulerkit/react-scheduler';`);
    expect(code).toContain(`import '@react-schedulerkit/react-scheduler/styles.css';`);
    expect(code).toContain('<Scheduler items={items} />');
    expect(code).not.toContain('localization');
  });

  it('writes a string prop quoted and a number in braces', () => {
    const code = generate({ ...base, changed: { view: 'timeline', overflowPageSize: '25' } });
    expect(code).toContain('view="timeline"');
    expect(code).toContain('overflowPageSize={25}');
  });

  it('writes a boolean that is on as a bare attribute and one that is off in braces', () => {
    const code = generate({ ...base, changed: { keepInactiveViewMounted: 'true', enablePinning: 'false' } });
    expect(code).toContain('keepInactiveViewMounted\n');
    expect(code).toContain('enablePinning={false}');
  });

  it('imports the locale pack the scenario chose', () => {
    const code = generate({ ...base, locale: 'ro', changed: {} });
    expect(code).toContain(`import { roRO } from '@react-schedulerkit/react-scheduler/locales/ro';`);
    expect(code).toContain('localization={roRO}');
  });

  it('ignores a prop the component does not have', () => {
    const code = generate({ ...base, changed: { notAProp: 'true' } });
    expect(code).not.toContain('notAProp');
  });
});
