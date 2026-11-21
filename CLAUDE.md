# outputty

A Claude Code plugin: a SessionStart hook prints its standing lines into every session, its output style is forced while it is enabled, and `/outputty:init` copies a scaffold of skills and rules under `~/.claude/` and of templates and settings into a repo, and drafts that repo's `CLAUDE.md` with its owner.

## Where things live

Each doc holds current state only; the commit history and closed issues hold history.

- What the product does, for its user: `.claude/product.md`.
- How it works: `.claude/architecture.md`, with how the components connect as a flowchart.
- The base program with real input and output: `.claude/examples.md`.
- What is open, one line each: `.claude/roadmap.md`; it is the only doc that lists open tickets.
- The front door: `README.md`. Safety and the permission payload: `docs/security.md`.
- Behaviour: `__tests__/`. Rules a tool can hold: the checks in `package.json`.
- Scratch: `tmp/` at the repo root, gitignored. A planning session's scratch lives outside the repo.

## Language

- **Fast-path fix** - a fix built in the planning session itself, on the user's "build it now". (no prior term)
- **Check** - what a repeated correction becomes: a new lint rule with a probe test, the removal of a lint rule that conflicts with it, or a line in the repo's `CLAUDE.md`. (replaces: lesson)

## This repo

This is the outputty plugin itself: `hooks/` and `output-styles/`, which reach every session from the installed plugin, and `skills/init` and `templates/`, which `/outputty:init` copies into a repo. This repo runs on the user-level copies that Dogfood names. Instruction files are code.

- **Check**: `pnpm format:check` (prettier) and `pnpm test` before a commit.
- **Version**: a change under `skills/`, `templates/`, `hooks/` or `output-styles/` bumps `version` in `.claude-plugin/marketplace.json` before merge (patch for a fix, minor for new behaviour). The version is the plugin cache key, so an unbumped change ships nothing.
- **Dogfood**: `.github/` is the repo-level copy of `templates/`. The user-level copies are `~/.claude/skills/{plan,prototype,tickets,build,audit,retro,tracker,herdr,documentation,data-engineering,frontend,typescript-node}`, `~/.claude/rules/{code,typescript}.md`, `~/.claude/skill-template.md` and `~/.claude/readme-template.md`. Edit `templates/` first, then copy the file over its installed twin. `hooks/context.md` and `output-styles/outputty.md` have no twin: they ship with the version bump.
- **Reload**: a plugin file is pinned at load; `/reload-plugins` after editing `skills/init`. An installed skill under `~/.claude/skills/` reloads on the next session.
- **Board**: `outputty/4` (project id `PVT_kwDOB5XC3c4BhcFm`) · Status field `PVTSSF_lADOB5XC3c4BhcFmzhgX0zk`: Todo `f75ad846` · In Progress `47fc9ee4` · Done `98236657`.
