import { describe, expect, it } from 'vitest';
import { findUnresolvedKeys } from '../lib/unresolved-keys.ts';

// Keys are assembled at runtime so this file passes the check it tests.
const key = (name: string): string => `{{${name}}}`;

describe('findUnresolvedKeys', () => {
  it('finds upper-snake keys with their line numbers', () => {
    expect(findUnresolvedKeys('README.md', `intro\nuse ${key('NPM_PACKAGE')} and ${key('PLUGIN_ID')}`)).toEqual([
      { line: 2, key: 'NPM_PACKAGE' },
      { line: 2, key: 'PLUGIN_ID' },
    ]);
  });

  it('ignores GitHub Actions expressions and lower-case message placeholders', () => {
    expect(
      findUnresolvedKeys('ci.yml', `$${key('SECRET')} \${{ matrix.react }} ${key('count').toLowerCase()}`),
    ).toEqual([]);
  });

  it('allows keys only inside the Project dictionary section of AGENTS.md', () => {
    const agents = [
      '# AGENTS.md',
      '## Project dictionary',
      `| \`${key('PLUGIN_ID')}\` | react-scheduler |`,
      '## Project',
      `Package ${key('NPM_PACKAGE')}`,
    ].join('\n');
    expect(findUnresolvedKeys('AGENTS.md', agents)).toEqual([{ line: 5, key: 'NPM_PACKAGE' }]);
    expect(findUnresolvedKeys('docs/AGENTS.md', agents)).toHaveLength(2);
  });
});
