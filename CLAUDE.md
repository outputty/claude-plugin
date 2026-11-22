# outputty

A Claude Code plugin: a SessionStart hook prints its standing lines into every session, its output style is forced while it is enabled, its skills run as `/outputty:<name>`, and `/outputty:init` copies the rules under `~/.claude/` and the templates and settings into a repo, and drafts that repo's `CLAUDE.md` with its owner.

## Where things live

Each doc holds current state only; the commit history and closed issues hold history.

- What the product does, for its user: `.claude/product.md`.
- How it works: `.claude/architecture.md`, with how the components connect as a flowchart.
- The base program with real input and output: `.claude/examples.md`.
- What is open, one line each: `.claude/roadmap.md`; it is the only doc that lists open tickets.
- The front door: `README.md`. Safety and the permission payload: `docs/security.md`.
- Behaviour: `__tests__/`. Rules a tool can hold: the scripts in `package.json`.
- Scratch: `tmp/` at the repo root, gitignored.

## Language

- **Planning session** - an attended session that runs `/outputty:plan` and ends with one ticket on the board, or resumes a ticket labelled `needs-planning`. Any number run in parallel. (replaces: SPEC, PLAN, grill, the planning stage, breakdown)
- **Build session** - a session on its own worktree, started from the user's pick, that builds one ticket, or several in order, under a `/goal`. (replaces: dispatcher, loop session, build agent)
- **Ticket** - one roadmap item: the interface agreed in planning, the end state as Implementation criteria, and what it is blocked by. Built into one PR, or into a stack when labelled `stack`. (replaces: target, parent issue, sub-issue, task)
- **Layer** - one step of a build, chosen by the build session so the program works after each one; the last layer is docs. Commits on the ticket's PR, or its own PR in a stack. (replaces: sub-issue as a unit of work)
- **Stack** - one PR per layer on the planning PR, built only for a ticket the user labelled `stack` at planning; never chosen by size. (no prior term)
- **Implementation criteria** - the runnable end-state cases in a ticket; the build runs every one before it ends, and the `/goal` judge reads them. (replaces: contract, Done when)
- **Scratch file** - a planning session's running record under `~/.claude/projects/<project>/plans/`, outside the repo; a restarted session resumes from it; deleted when the ticket is filed. (replaces: trail)
- **needs-planning** - the label a build leaves when a ticket needs its plan reopened; `/outputty:plan <n>` resumes it. (replaces: replan, needs-decision)
- **Check** - what a repeated correction becomes: a new lint rule with a probe test, the removal of a lint rule that conflicts with it, or a line in the repo's `CLAUDE.md`. (replaces: lesson)
- **Prototype** - a local `prototype/<name>` branch a Haiku session builds from an idea or a ticket: tests first, then only existing patterns, anything new a `TODO: stub`; `/outputty:plan` reads it and `/outputty:build` continues it. (no prior term)
- **Audit** - a read-only pass over a codebase against the code rules: findings, questions to the user and a refactor plan, with nothing assumed and nothing edited. (no prior term)
- **Fast-path fix** - on the user's "build it now", the planning session files the ticket and opens its build tab at once, skipping the pick. (no prior term)

## This repo

This is the outputty plugin itself: `hooks/`, `output-styles/` and `skills/`, which reach every session from the installed plugin, and `templates/`, which `/outputty:init` copies. This repo runs on the installed plugin and on the user-level copies that Dogfood names. Instruction files are code.

- **Before a commit**: `pnpm format:check` (prettier) and the tests the change affects.
- **Version**: a change under `skills/`, `templates/`, `hooks/` or `output-styles/` bumps `version` in `.claude-plugin/marketplace.json` before merge (patch for a fix, minor for new behaviour). The version is the plugin cache key, so an unbumped change ships nothing.
- **Dogfood**: `.github/` is the repo-level copy of the ticket and PR templates in `templates/`. The user-level copies are `~/.claude/rules/{code,typescript}.md`, `~/.claude/readme-template.md` and `~/.claude/skill-template.md`. Edit `templates/` first, then copy the file over its installed twin. `hooks/`, `output-styles/` and `skills/` have no twin: they ship with the version bump.
- **Reload**: a plugin file is pinned at load. After a merge: `claude plugin marketplace update outputty`, `claude plugin update outputty@outputty`, then `/reload-plugins` or a new session.
- **Board**: `outputty/4` (project id `PVT_kwDOB5XC3c4BhcFm`) · Status field `PVTSSF_lADOB5XC3c4BhcFmzhgX0zk`: Todo `f75ad846` · In Progress `47fc9ee4` · Done `98236657`.
