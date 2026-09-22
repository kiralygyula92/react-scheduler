# CLAUDE.md

@AGENTS.md

Claude Code specifics:
- Use plan mode at the start of each milestone and show the plan before editing.
- Prefer running the narrowest command that verifies a change (`pnpm --filter … test -- <file>`), then the full gate before reporting a milestone done.
