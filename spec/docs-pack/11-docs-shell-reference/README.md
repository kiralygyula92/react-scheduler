# 11 — Docs Shell Reference (verbatim)

This folder is what makes every plugin site identical. Agents **copy** from here; they do not redesign.

| File | Copy to | Modify? |
|---|---|---|
| `tokens.css` | `apps/docs/src/shell/tokens.css` | Never per plugin |
| `shell.css` | `apps/docs/src/shell/shell.css` | Never per plugin |
| `components.md` | Build `apps/docs/src/shell/**` and `src/i18n/**` exactly as specified | Never per plugin |
| `nav.schema.json` | `apps/docs/src/content/nav.schema.json` | Never |
| `nav.example.json` | Starting point for `apps/docs/src/content/nav.json` | Yes: plugin-specific items only |
| `locales/{lng}.common.json` | `apps/docs/src/locales/{lng}/common.json` | Add keys only if the shell gains a feature (then add them here too) |

## Shell checksum

After the shell is first built in the first plugin repository and approved by the user, run:

```bash
pnpm --filter docs shell:checksum > spec/docs-pack/11-docs-shell-reference/SHELL_CHECKSUM
```

Copy that file back into the master copy of the docs pack. From then on, `check-conformance` (C8) compares every plugin's `src/shell/` and `src/i18n/` against it, so the second, third and fourth plugin sites are byte-identical in their shell. If a shell change is needed, make it once, regenerate the checksum, and roll it out to every plugin.

## Changing the design

1. Change `tokens.css` / `shell.css` / `components.md` **here**.
2. Update `02-design-system.md` to match.
3. Bump the docs pack version in `00-READ-FIRST.md`.
4. Re-copy into every plugin repository and update visual baselines.
