import { describe, expect, it } from 'vitest';
import {
  checkLicenses,
  checkPackageManifest,
  type InstalledPackage,
  isLicenseAllowed,
  type LicensePolicy,
  parsePnpmLicenses,
  parseSpdx,
} from '../lib/licenses.ts';

const ALLOWED = ['MIT', 'ISC', 'Apache-2.0'];

describe('isLicenseAllowed', () => {
  it.each([
    ['MIT', true],
    ['mit', true],
    ['GPL-3.0', false],
    ['(MIT OR GPL-3.0)', true],
    ['MIT AND GPL-3.0', false],
    ['MIT AND (ISC OR GPL-3.0)', true],
    ['GPL-3.0 OR MIT AND ISC', true],
    ['Apache-2.0 WITH LLVM-exception', true],
    ['UNKNOWN', false],
    ['UNLICENSED', false],
    ['(MIT', false],
  ])('%s → %s', (expression, expected) => {
    expect(isLicenseAllowed(expression, ALLOWED)).toBe(expected);
  });

  it('gives AND precedence over OR', () => {
    expect(parseSpdx('A OR B AND C')).toEqual({
      kind: 'or',
      left: { kind: 'id', id: 'A' },
      right: { kind: 'and', left: { kind: 'id', id: 'B' }, right: { kind: 'id', id: 'C' } },
    });
  });
});

describe('checkLicenses', () => {
  const policy: LicensePolicy = {
    allowed: ALLOWED,
    devExceptions: [
      { package: 'lightningcss*', license: 'MPL-2.0', via: 'vite' },
      { package: 'unused-tool', license: 'BlueOak-1.0.0', via: 'nothing' },
    ],
  };
  const pkg = (name: string, license: string): InstalledPackage => ({ name, license, versions: ['1.0.0'] });

  it('accepts allowlisted packages and named development exceptions', () => {
    const report = checkLicenses([pkg('a', 'MIT'), pkg('lightningcss-linux-x64-gnu', 'MPL-2.0')], [], policy);
    expect(report.violations).toEqual([]);
    expect(report.excepted).toEqual(['lightningcss-linux-x64-gnu (MPL-2.0) via vite']);
    expect(report.unusedExceptions).toEqual(['unused-tool (BlueOak-1.0.0)']);
  });

  it('rejects an exception whose license does not match exactly', () => {
    const report = checkLicenses([pkg('lightningcss', 'GPL-3.0')], [], policy);
    expect(report.violations).toEqual(['lightningcss@1.0.0 (GPL-3.0) is not allowlisted']);
  });

  it('never applies development exceptions to production packages', () => {
    const production = [pkg('lightningcss', 'MPL-2.0')];
    const report = checkLicenses(production, production, policy);
    expect(report.violations).toEqual(['lightningcss@1.0.0 (MPL-2.0) is a production dependency']);
  });
});

describe('parsePnpmLicenses', () => {
  it('flattens the license-keyed JSON output', () => {
    const output = JSON.stringify({
      MIT: [{ name: 'a', versions: ['1.0.0'], license: 'MIT' }],
      'BSD-3-Clause': [{ name: 'b', versions: ['2.0.0'] }],
    });
    expect(parsePnpmLicenses(output)).toEqual([
      { name: 'a', license: 'MIT', versions: ['1.0.0'] },
      { name: 'b', license: 'BSD-3-Clause', versions: ['2.0.0'] },
    ]);
  });

  it('treats the empty-tree message as no packages', () => {
    expect(parsePnpmLicenses('No licenses in packages found')).toEqual([]);
  });
});

describe('checkPackageManifest', () => {
  it('requires MIT, no runtime dependencies and only approved peers', () => {
    expect(
      checkPackageManifest({ name: 'p', license: 'MIT', dependencies: {}, peerDependencies: { react: '^19' } }, [
        'react',
      ]),
    ).toEqual([]);
    expect(
      checkPackageManifest(
        { name: 'p', license: 'ISC', dependencies: { lodash: '1' }, peerDependencies: { vue: '3' } },
        ['react'],
      ),
    ).toEqual([
      'p: "license" must be "MIT"',
      'p: "dependencies" must be empty, found lodash',
      'p: peer dependency "vue" is not approved',
    ]);
  });
});
