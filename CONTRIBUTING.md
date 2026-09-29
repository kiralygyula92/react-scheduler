# Contributing

Thanks for helping improve `@react-schedulerkit/react-scheduler`! Bug reports, docs fixes and pull
requests are all welcome.

## Getting started

Requirements: Node 22.18+ (the repository uses Node 24, see `.nvmrc`) and pnpm (run
`corepack enable` to use the pinned version).

```sh
git clone https://github.com/kiralygyula92/react-scheduler.git
cd react-scheduler
pnpm install
pnpm dev
```

`pnpm dev` builds the package once, generates the site's API data and starts the site's
development server; open the address it prints, followed by `/react-scheduler/`. The
[root README](README.md#commands) lists every command.

## Making a change

1. Open an issue first for larger changes, so we can agree on the API before you build it.
2. Create a branch from `main`.
3. Add or update tests: unit tests in `packages/react-scheduler/test` (Vitest), browser tests
   (`pnpm test:browser`) and end-to-end tests in `apps/docs/e2e` (Playwright). Every behavior should
   be covered by at least one of them, and `pnpm test:coverage` enforces the coverage thresholds.
4. Run the checks:

   ```sh
   pnpm --filter docs api && pnpm lint && pnpm typecheck && pnpm test:coverage
   pnpm check:licenses && pnpm check:zero-reference && pnpm check:keys && pnpm check:scenarios
   pnpm knip
   pnpm build && pnpm check:pack && pnpm --filter docs i18n:check && pnpm --filter docs conformance
   pnpm test:browser && pnpm e2e
   ```

   The browser tests and the E2E suite need Playwright's browsers once:
   `pnpm exec playwright install`.

5. Add a changeset for anything users will notice: `pnpm changeset`. Pick `patch` for fixes,
   `minor` for new features and `major` for breaking changes.
6. For public API changes, update the documentation (see below).
7. Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, e.g.
   `fix(docs): titles, copy and wording` or `fix: controls, icons and small screens`.

## Documentation

The documentation site lives in [`apps/docs`](apps/docs), in seven locales (de, en, es, fr, hu,
pt, ro):

- **Every string is translated.** Site text lives in `apps/docs/src/locales/{lng}/*.json`,
  complete in every locale; `pnpm --filter docs i18n:check` fails otherwise.
- **The API pages are generated** from the package: `pnpm --filter docs api` regenerates their
  data, and `pnpm --filter docs api:sources` updates the translation hashes when the English API
  text changes.
- **The site shell is fixed.** Header, sidebar and layout follow
  `spec/docs-pack/11-docs-shell-reference/`; changes go into the content, not the shell.
- **No invented facts.** Pages state only what tests or data back; open questions go to
  [GAPS.md](GAPS.md).

After a docs change, `pnpm --filter docs build`, `pnpm --filter docs conformance` and
`pnpm --filter docs check:links` must pass.

## Design principles

- **Opt-in by default:** new behavior goes behind a prop, so upgrades never change existing
  schedules.
- **No runtime dependencies** beyond the `react` and `react-dom` peers: no state libraries, UI
  kits, CSS-in-JS runtimes, or third-party search, highlighting or i18n libraries. A new
  dependency needs an architecture decision record in [`docs/adr`](docs/adr).
- **Localized:** no user-visible string in code; the package's strings go through its
  `localization`.
- **Accessible:** keyboard operable and labeled; axe checks run in the browser tests and the
  end-to-end suite.
- **Typed:** strict TypeScript and TSDoc on every public export.
- **American English** in all English content.

## Licensing of contributions

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
Only submit code and assets you wrote yourself or that are available under a compatible
permissive license (`pnpm check:licenses` checks the dependencies). Note any third-party material
in the pull request so it can be added to `packages/react-scheduler/NOTICE`.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).
