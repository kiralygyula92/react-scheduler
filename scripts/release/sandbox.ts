// SPDX-License-Identifier: MIT
// The post-publish checks of docs pack 10 §4.5, run before there is anything on the registry: the
// package is built and packed, the tarball is scanned the way `release.yml` scans it, and then it is
// installed with npm into fresh applications outside this repository — one on React 19, one on
// React 18.2, the peer floor — which import the component and its stylesheet, build with Vite and
// type-check against the shipped declarations with every TypeScript version the documentation
// promises. A CommonJS `require()` of every entry point and
// `publint` / `attw` on the tarball itself close it.
//
// Nothing here talks to npm other than to download the sandbox apps' own dependencies. After the
// release, `--from-registry <version>` runs the same applications against the published package
// instead of the tarball: docs pack 10 §4.5's post-publish checks as one command.
//
// Usage: node scripts/release/sandbox.ts [--from-registry <version>]
import { execFileSync, execSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const packageName = '@react-schedulerkit/react-scheduler';
const windows = process.platform === 'win32';
const registryFlag = process.argv.indexOf('--from-registry');
const registryVersion = registryFlag >= 0 ? process.argv[registryFlag + 1] : undefined;
if (registryFlag >= 0 && (registryVersion === undefined || registryVersion.startsWith('-'))) {
  throw new Error('--from-registry needs a version, such as 1.0.0');
}

/** Versions pinned so a run today and a run next month test the same thing. */
const TOOLS = { vite: '8.3.0', typescript: '6.0.3' } as const;
/**
 * The TypeScript versions the Requirements page promises. The oldest is the first that resolves
 * subpath exports with `moduleResolution: "bundler"`; each is installed beside the others under an
 * npm alias and runs over the same application.
 */
const TYPESCRIPTS = ['5.0.4', '5.9.3', '6.0.3', '7.0.2'] as const;
const alias = (version: string): string => `typescript-${version.replaceAll('.', '-')}`;
const REACTS = [
  { name: 'React 19', react: '19.3.0', types: '19.3.0' },
  { name: 'React 18.2', react: '18.2.0', types: '18.2.79' },
] as const;

/** The README's own example: if this builds and type-checks, the README is telling the truth. */
const APP = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Scheduler, type SchedulerItem } from '${packageName}';
import { roRO } from '${packageName}/locales/ro';
import { createScheduler } from '${packageName}/headless';
import { getShiftWindows } from '${packageName}/core';
import '${packageName}/styles.css';

const items: SchedulerItem[] = [
  { id: 'a', start: '2031-03-12T09:00', end: '2031-03-12T10:30', level: 'critical', title: 'Handover' },
  { id: 'b', start: '2031-03-12T11:00', end: '2031-03-12T12:00', level: 'routine', title: 'Stock count' },
];

// The framework-agnostic entries resolve and type-check too.
void createScheduler;
void getShiftWindows;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Scheduler items={items} localization={roRO} />
  </StrictMode>,
);
`;

function run(command: string, args: readonly string[], cwd: string): string {
  // npm, npx and pnpm are `.cmd` shims on Windows, which only a shell can start; the line is
  // quoted here rather than handing the arguments to a shell unescaped.
  if (windows && (command === 'npm' || command === 'npx' || command === 'pnpm')) {
    const line = [command, ...args.map((arg) => (/[\s"&|<>^]/.test(arg) ? `"${arg.replaceAll('"', '\\"')}"` : arg))];
    return execSync(line.join(' '), { cwd, encoding: 'utf8', stdio: 'pipe' });
  }
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

function step(label: string, action: () => void): void {
  process.stdout.write(`  ${label} … `);
  action();
  console.log('ok');
}

function main(): number {
  const work = mkdtempSync(join(tmpdir(), 'rs-sandbox-'));
  console.log(`sandbox: ${work}`);
  try {
    let tarball = '';
    if (registryVersion === undefined) {
      // 1. Build and pack, exactly what the release workflow publishes.
      step('build and pack the package', () => {
        run('pnpm', ['--filter', packageName, 'build'], root);
        run('pnpm', ['--filter', packageName, 'pack', '--pack-destination', work], root);
        tarball = join(work, readdirSync(work).find((file) => file.endsWith('.tgz')) ?? '');
      });

      // 2. The zero-reference scan of the unpacked tarball (Feature Dossier 09 §7).
      step('zero-reference scan of the tarball', () => {
        const contents = join(work, 'contents');
        mkdirSync(contents);
        // Relative paths: GNU tar reads `C:` in an absolute Windows path as a remote host.
        run('tar', ['-xzf', basename(tarball), '-C', 'contents'], work);
        run('node', ['scripts/check-zero-reference.ts', '--dir', contents], root);
      });
    }

    // 3. `publint` and `attw` on what a consumer receives.
    step(registryVersion === undefined ? 'publint and attw on the tarball' : 'attw on the published package', () => {
      const cwd = join(root, 'packages', 'react-scheduler');
      const exclude = ['--profile', 'node16', '--exclude-entrypoints', './styles.css', './base.css'];
      if (registryVersion === undefined) {
        run('pnpm', ['exec', 'publint', join(work, 'contents', 'package')], cwd);
        run('pnpm', ['exec', 'attw', tarball, ...exclude], cwd);
      } else {
        run('pnpm', ['exec', 'attw', '--from-npm', `${packageName}@${registryVersion}`, ...exclude], cwd);
      }
    });

    // 4. A fresh application per React version.
    for (const react of REACTS) {
      const app = join(work, react.name.replaceAll(' ', '-').toLowerCase());
      mkdirSync(join(app, 'src'), { recursive: true });
      writeFileSync(
        join(app, 'package.json'),
        `${JSON.stringify(
          {
            name: 'sandbox',
            private: true,
            type: 'module',
            dependencies: {
              [packageName]: registryVersion ?? `file:${tarball}`,
              react: react.react,
              'react-dom': react.react,
            },
            devDependencies: {
              vite: TOOLS.vite,
              typescript: TOOLS.typescript,
              ...Object.fromEntries(TYPESCRIPTS.map((version) => [alias(version), `npm:typescript@${version}`])),
              '@types/react': react.types,
              '@types/react-dom': react.types.startsWith('18') ? '18.2.25' : react.types,
            },
          },
          null,
          2,
        )}\n`,
      );
      writeFileSync(
        join(app, 'tsconfig.json'),
        `${JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ESNext',
              moduleResolution: 'bundler',
              jsx: 'react-jsx',
              strict: true,
              noEmit: true,
              skipLibCheck: false,
              lib: ['ES2022', 'DOM', 'DOM.Iterable'],
              types: [],
            },
            include: ['src'],
          },
          null,
          2,
        )}\n`,
      );
      writeFileSync(
        join(app, 'index.html'),
        '<div id="root"></div><script type="module" src="/src/main.tsx"></script>\n',
      );
      writeFileSync(join(app, 'src', 'main.tsx'), APP);
      writeFileSync(join(app, 'src', 'env.d.ts'), "declare module '*.css';\n");

      console.log(`${react.name}:`);
      step(registryVersion === undefined ? 'npm install from the tarball' : 'npm install from the registry', () => {
        run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], app);
      });
      for (const version of TYPESCRIPTS) {
        step(`type-check with TypeScript ${version}`, () => {
          run('node', [join('node_modules', alias(version), 'bin', 'tsc'), '-p', '.'], app);
        });
      }
      step('vite build', () => {
        run('npx', ['vite', 'build', '--logLevel', 'error'], app);
      });
      step('require() every entry point from CommonJS', () => {
        const entries = ['', '/core', '/headless', '/dom', '/locales', '/locales/ro'];
        const script = entries.map((entry) => `require('${packageName}${entry}');`).join('');
        run('node', ['-e', script], app);
      });
    }

    console.log('sandbox: every check passed');
    return 0;
  } catch (error) {
    console.log('FAILED');
    const failure = error as { stdout?: string; stderr?: string; message?: string };
    console.error(failure.stdout ?? '', failure.stderr ?? '', failure.message ?? '');
    return 1;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

process.exitCode = main();
