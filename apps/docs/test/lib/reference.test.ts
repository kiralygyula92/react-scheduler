// SPDX-License-Identifier: MIT
// The slugs the Reference section is addressed by. They end up in URLs that must not change once
// they are published, so they are pinned here rather than only in the generator.
import { describe, expect, it } from 'vitest';
import { slugOf } from '../../scripts/lib/reference.ts';

describe('slugOf', () => {
  it('keeps a single word whole', () => {
    expect(slugOf('Scheduler')).toBe('scheduler');
    expect(slugOf('interpolate')).toBe('interpolate');
  });

  it('splits camel case', () => {
    expect(slugOf('useScheduler')).toBe('use-scheduler');
    expect(slugOf('computeTimelineLayout')).toBe('compute-timeline-layout');
    expect(slugOf('DiamondIcon')).toBe('diamond-icon');
  });

  it('turns the underscores of a constant into hyphens', () => {
    expect(slugOf('CARRIED_OVER_TAG')).toBe('carried-over-tag');
  });

  it('keeps a locale pack readable', () => {
    expect(slugOf('enUS')).toBe('en-us');
    expect(slugOf('ptPT')).toBe('pt-pt');
  });
});
