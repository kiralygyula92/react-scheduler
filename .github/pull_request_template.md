## What and why

<!-- What does this change, and which issue does it address? -->

## Checklist

- [ ] Tests added or updated (unit, browser and/or e2e)
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --filter docs i18n:check` and `pnpm --filter docs conformance` pass
- [ ] A changeset is included (`pnpm changeset`) for user-facing changes
- [ ] Public API changes: TSDoc updated, `pnpm --filter docs api` run and the docs pages updated in every locale
- [ ] New user-visible strings go through `localization` (package) or `apps/docs/src/locales` (site), in every locale
- [ ] `pnpm check:zero-reference` passes
- [ ] New behavior is opt-in, or the breaking change is called out
- [ ] Any third-party material has a compatible license and is listed in `NOTICE`
