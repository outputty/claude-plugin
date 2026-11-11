# outputty

A Claude Code plugin: a SessionStart hook prints its standing lines into every session, its output style is forced while it is enabled, and `/outputty:init` copies a scaffold of skills, rules and settings into a repo and drafts that repo's `CLAUDE.md` with its owner.

## Where things live

Each doc holds current state only; the commit history and closed issues hold history.

- What the product does, for its user: `.claude/product.md`.
- How it works: `.claude/architecture.md`, with the base pipeline as a call-stack graph.
- The base program with real input and output: `.claude/examples.md`.
- What is open, one line each: `.claude/roadmap.md`; it is the only doc that lists open tickets.
- Behaviour: `__tests__/`. Rules a tool can hold: the checks in `package.json`.
- Scratch: `tmp/` at the repo root, gitignored. A planning session's scratch lives outside the repo.

## Language

- **Fast-path fix** - a planning spike that is already the complete fix, built in the planning session on the user's yes. (no prior term)
- **Check** - what a repeated correction becomes: a lint rule with a probe test, a reproducing test, a hook or permission, a Language line or an output-style line. (replaces: lesson, rule)

## This repo

This is the outputty plugin itself: `hooks/` and `output-styles/`, which reach every session from the installed plugin, and `skills/init` and `templates/`, which `/outputty:init` copies into a repo. This repo runs on its own copy under `.claude/`. Instruction files are code.

- **Check**: `pnpm format:check` (prettier) and `pnpm test` before a commit.
- **Version**: a change under `skills/`, `templates/`, `hooks/` or `output-styles/` bumps `version` in `.claude-plugin/marketplace.json` before merge (patch for a fix, minor for new behaviour). The version is the plugin cache key, so an unbumped change ships nothing.
- **Dogfood**: `.github/` is the repo-level copy of `templates/`. The user-level copies are `~/.claude/skills/{plan,prototype,tickets,build,retro,tracker,herdr,documentation}`, `~/.claude/skill-template.md` and `~/.claude/readme-template.md`. Edit `templates/` first, then copy the file over its installed twin. `hooks/context.md` and `output-styles/outputty.md` have no twin: they ship with the version bump.
- **Reload**: a plugin file is pinned at load; `/reload-plugins` after editing `skills/init`. A repo-local skill under `.claude/skills/` reloads on the next session.
- **Board**: `outputty/4` (project id `PVT_kwDOB5XC3c4BhcFm`) · Status field `PVTSSF_lADOB5XC3c4BhcFmzhgX0zk`: Todo `f75ad846` · In Progress `47fc9ee4` · Done `98236657`.
