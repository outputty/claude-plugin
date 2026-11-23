---
name: init
description: "Scaffolds outputty into a repo: rules, templates, settings and its CLAUDE.md. Run once, and again after an upgrade."
disable-model-invocation: true
---

# init

Output: the user-level files installed, a repo `CLAUDE.md` holding only what is the repo's own, and one PR. Write progress to `~/.claude/projects/<project>/plans/init.md`; a restarted session reads it first. Delete it when the PR opens.

## Steps

Copy this checklist into your first reply and into `init.md`, and tick each item as it lands. Every source is under `${CLAUDE_PLUGIN_ROOT}/templates/`; print one line per file in the shape of [references/file-line.md](references/file-line.md).

- [ ] 1. Remove what an older init installed that the plugin now supplies: the lines merged into `~/.claude/CLAUDE.md`, and the output style and its setting, per the Do lines. Show each diff and write only on the user's yes.
- [ ] 2. Copy to the user level, created when absent, kept when present: `templates/README.md` → `~/.claude/readme-template.md`, `templates/skill-template.md` → `~/.claude/skill-template.md`.
  - Run `bash ${CLAUDE_PLUGIN_ROOT}/skills/init/scripts/sync-template.sh skills ${CLAUDE_PLUGIN_ROOT}/templates/skills ~/.claude/skills <version>`, then the same with `rules ${CLAUDE_PLUGIN_ROOT}/templates/rules ~/.claude/rules <version>`, `<version>` being the plugin's `version` in `.claude-plugin/marketplace.json`. Each makes the folder a git repo tracking only `outputty-*`, copies `templates/skills/<name>/` to `outputty-<name>/` (keeping `name: <name>`, so the skill types as `/<name>`) and `templates/rules/<file>` to `outputty-<file>`, writes the template version onto a `template` branch without leaving the checked-out branch, and never overwrites a user's copy.
  - Print the script's output: its diff is the offers, the template changes since the last init. The user takes or leaves each; a taken offer is merged into the user's copy and committed.
  - A `~/.claude/rules/code.md` or `typescript.md` from an older init: show its diff against `outputty-<file>`, and rename it to `outputty-<file>` on the user's yes.
  - Offer each folder under `~/.claude/skills/` without the `outputty-` prefix, `synced/` and `evals/` excluded, and each unprefixed file under `~/.claude/rules/`: on a yes, run `bash ${CLAUDE_PLUGIN_ROOT}/skills/init/scripts/onboard-skill.sh ~/.claude/skills <folder>` for a skill, which renames it and gives it `name: <folder>` when it has none; reshape it to `~/.claude/skill-template.md`, write `evals/` cases for it, run `/outputty:eval` on the original and the reshape, and keep the reshape only when no case drops below the original, committing the result.
- [ ] 3. Copy to the repo level, created when absent, kept when present: `templates/ISSUE_TEMPLATE/task.md` and `templates/PULL_REQUEST_TEMPLATE.md` → `.github/`.
- [ ] 4. Union `templates/settings.json` into `.claude/settings.json`, keeping every repo key and unioning `permissions` lists.
  - Stop at invalid JSON: name the file.
- [ ] 5. Create `plans/` with a `.gitkeep`, and add the line `plans/` to a root `.ignore` file, creating the file when absent. Remove `"Read(./plans/**)"` from `permissions.deny` of `.claude/settings.json` where an older init added it.
- [ ] 6. Read the repo: dispatch one `Explore` agent per source, in parallel, each returning `file:line` findings: the docs (what exists, where, claims, runnable snippets, commands), the code (entry points, public interfaces, test and lint commands and where tests live), git history (what was abandoned and why), and existing instruction files (`CLAUDE.md`, `AGENTS.md` and kin).
- [ ] 7. Draft `tmp/CLAUDE.draft.md` from the findings, a part they do not cover becoming a question: what the project is (its name and one sentence); where each kind of knowledge lives, in the shape of [references/where-things-live.md](references/where-things-live.md); **Language**, one line per term with the words it replaces; and the tracker ids.
  - Remove, by meaning, what an older init merged into the file: the flow (`/plan`, `/prototype`, `/tickets`, `/build`, `/retro` in order), the standing lines, and every line `hooks/context.md` or `~/.claude/rules/outputty-code.md` says.
- [ ] 8. Show the user the draft with its `file:line` sources, one round of questions with recommendations, and the diff against the current `CLAUDE.md`. Write only on the user's yes, and print `CLAUDE.md: settled`.
- [ ] 9. Add the repo's test, lint and typecheck commands to `permissions.allow`.
- [ ] 10. Create the tracker's labels, per the `tracker` skill.
- [ ] 11. Read the board ids with the `tracker` skill's **Board** commands and write them under **This repo** in `CLAUDE.md`.
- [ ] 12. Run every documented command and snippet that the draft cites.
  - A failing one goes back to step 7 with its error; open the PR only when each one passes.
- [ ] 13. Commit on `chore/outputty-init` and open a PR. List every part the user did not settle under the PR's **Next**.

### Upgrading

Run `/outputty:init` again after an upgrade. Each copied file reports `unchanged` or `kept, differs`; the user takes or leaves each diff. A repo whose `CLAUDE.md` still holds the begin and end comment pair of an older init keeps the text between them as plain text, less the lines step 7 removes, and loses the pair in the same diff.

## Do

- In a monorepo, put the scaffold and the drafted `CLAUDE.md` at the monorepo root (`git rev-parse --show-toplevel`), once, wherever init is run from; a package gets a `CLAUDE.md` only for what is its own.
- Write the board ids under **This repo** in `CLAUDE.md`.
- Remove from `~/.claude/CLAUDE.md`, by meaning, every line `hooks/context.md` or `~/.claude/rules/outputty-code.md` says, and the lines that moved into skills: gate a feature at construction (build), create every worktree from the latest `main` (herdr), enforce a structural rule in the linter's config before prose (retro). Keep the user's own Tools line, and every other line of the user's own.
- Remove a line that moved into the code rules only after step 2 has copied `~/.claude/rules/outputty-code.md` and the user has taken or left its diff; hold that removal until then.
- Remove `~/.claude/output-styles/outputty.md`, and the `"outputStyle": "outputty"` key in `~/.claude/settings.json`.
- Never remove a skill folder under `~/.claude/skills/`: the copies there are the user's.
- Draft the places each kind of file lives from where the repo already keeps things, and ask only about a kind the findings leave open.

## Don't

- Don't copy `${CLAUDE_PLUGIN_ROOT}/hooks/context.md` or the plugin's `output-styles/outputty.md`.
- Don't prescribe where docs, tests or source live.

## Glossary

- **Standing lines** - the lines the plugin's SessionStart hook prints into every session.
- **Scaffold** - the files init copies into the user level and the repo.
- **Tracker ids** - the project number, project id, Status field id and option ids of the board.
- **Drift** - a copied file that differs from its template after an upgrade.
