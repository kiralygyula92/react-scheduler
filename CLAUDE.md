# CLAUDE.md

@AGENTS.md

Claude Code specifics:

- Use plan mode for larger changes and show the plan before editing.
- Prefer running the narrowest command that verifies a change (`pnpm --filter … test -- <file>`),
  then the full gate before reporting a task done.
