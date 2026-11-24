# outputty

A Claude Code plugin: a SessionStart hook prints its standing lines into every session, its output style is forced while it is enabled, its skills run as `/outputty:<name>`, and `/outputty:init` copies the rules under `~/.claude/` and the templates and settings into a repo, and drafts that repo's `CLAUDE.md` with its owner.

## Where things live

Each doc holds current state only; the commit history and closed issues hold history.

- Everything a user or contributor reads - the flow, the sessions, the install, the safety bounds and the permission payload: `README.md`, the one doc, with one flowchart.
- What is open: the tickets on the board, per the `tracker` skill.
- Research documents: `docs/research/<slug>.md`.
- Behaviour: `__tests__/`. Rules a tool can hold: the scripts in `package.json`.
- Scratch: `tmp/` at the repo root, gitignored.

## Language

- **Planning session** - an attended session that runs `/plan` and ends with one ticket on the board, or resumes a ticket labelled `needs-planning`. Any number run in parallel. (replaces: SPEC, PLAN, grill, the planning stage, breakdown)
- **Build session** - a session on its own worktree, started from the user's pick, that builds one ticket, several in order, or every buildable ticket in a loop, under a `/goal`. (replaces: dispatcher, build agent)
- **Research session** - a session on its own worktree, opened by `/research <topic>` on Opus 5.5 with ultracode, that ends with a research document and files no ticket. (no prior term)
- **Research document** - `docs/research/<slug>.md`: findings by category, each with its source, committed in a PR the research session opens, and read by `/plan`. (no prior term)
- **Merge classifier** - the Haiku agent that reads a PR's whole diff and reports a public API change, possibly breaking functionality and a major refactor; the build merges the PR only when all three read none and the merge does not deploy. (no prior term)
- **Ticket** - one unit of planned work: the interface agreed in planning, the end state as Implementation criteria, and what it is blocked by. Built into one PR, or into a stack when labelled `stack`. (replaces: target, parent issue, sub-issue, task)
- **Layer** - one step of a build, chosen by the build session so the program works after each one; the last layer is docs. Commits on the ticket's PR, or its own PR in a stack. (replaces: sub-issue as a unit of work)
- **Stack** - one PR per layer, built only for a ticket the user labelled `stack` at planning; never chosen by size. (no prior term)
- **Implementation criteria** - the runnable end-state cases in a ticket; the build runs every one before it ends, and the `/goal` judge reads them. (replaces: contract, Done when)
- **Scratch file** - a planning session's running record under `~/.claude/projects/<project>/plans/`, outside the repo; a restarted session resumes from it; deleted when the ticket is filed. (replaces: trail)
- **needs-planning** - the label a build leaves when a ticket needs its plan reopened; `/plan <n>` resumes it. (replaces: replan, needs-decision)
- **Check** - what a repeated correction becomes: a new lint rule with a probe test, the removal of a lint rule that conflicts with it, a line in the repo's `CLAUDE.md`, or an edit to a user skill or a rule file. (replaces: lesson)
- **Prototype** - a `prototype/<name>` branch on GitHub a Haiku session builds from an idea or a ticket: tests first, then only existing patterns, anything new a `TODO: stub`; `/plan` reads it, and a ticket whose **Base** names it is built on it. (no prior term)
- **Audit** - a read-only pass over a codebase against the code rules: findings, questions to the user and a refactor plan, with nothing assumed and nothing edited. (no prior term)
- **Fast-path fix** - on the user's "build it now", the planning session files the ticket and opens its build tab at once, skipping the pick. (no prior term)
- **Plugin skill** - a skill that ships in the plugin as `/outputty:<name>` and changes only with a release: init, herdr, dream, eval. (no prior term)
- **User skill** - the copy init makes of a template skill into `~/.claude/skills/outputty-<name>/`, typed as `/<name>`, owned by the user and edited by dream. (no prior term)
- **Dream** - the plugin skill that reads the transcripts since its last run and turns each friction into a measured, committed edit. (replaces: retro)
- **Friction** - a flagged window of a transcript: heavy tool use, repeat reads, a long run, or a correction. (no prior term)
- **Offer** - a template change init lists for the user to take; it never writes it into the user's copy. (no prior term)

## This repo

This is the outputty plugin itself: `hooks/`, `output-styles/` and `skills/` (the plugin skills: dream, eval, herdr, init), which reach every session from the installed plugin, and `templates/`, which `/outputty:init` copies, `templates/skills/` becoming the user skills. This repo runs on the installed plugin and on the user-level copies that Dogfood names. Instruction files are code.

- **Before a commit**: `pnpm format:check` (prettier) and the tests the change affects.
- **Before a merge**: a change to `output-styles/`, `hooks/`, `skills/` or `templates/rules/` runs `/outputty:eval` on the sections it touches, against the version it replaces.
- **Version**: a change under `skills/`, `templates/`, `hooks/` or `output-styles/` bumps `version` in `.claude-plugin/marketplace.json` before merge (patch for a fix, minor for new behaviour). The version is the plugin cache key, so an unbumped change ships nothing.
- **Dogfood**: `.github/` is the repo-level copy of the ticket and PR templates in `templates/`. The user-level copies are `~/.claude/rules/outputty-{code,typescript}.md`, `~/.claude/skills/outputty-<name>/` for each `templates/skills/<name>/`, `~/.claude/readme-template.md` and `~/.claude/skill-template.md`. Edit `templates/` first, then copy the file over its installed twin. `hooks/`, `output-styles/` and the plugin skills in `skills/` have no twin: they ship with the version bump.
- **Reload**: a plugin file is pinned at load. After a merge: `claude plugin marketplace update outputty`, `claude plugin update outputty@outputty`, then `/reload-plugins` or a new session.
- **Board**: `outputty/4` (project id `PVT_kwDOB5XC3c4BhcFm`) · Status field `PVTSSF_lADOB5XC3c4BhcFmzhgX0zk`: Todo `f75ad846` · In Progress `47fc9ee4` · Done `98236657`.
