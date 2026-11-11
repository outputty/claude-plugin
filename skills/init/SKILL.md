---
name: init
description: Scaffolds outputty into a repo - copies the skills, rules and settings, removes the outputty lines and output style an older init merged into the user's files (the plugin now supplies both itself), and drafts with the user where each kind of file in that repo lives. Run once; run again after an upgrade to see what drifted. Idempotent.
disable-model-invocation: true
---

# init - scaffold, then align the repo's CLAUDE.md

Output: the user-level files installed, the repo's `CLAUDE.md` holding only what is the repo's own, and one PR. Write progress to `~/.claude/projects/<project>/plans/init.md`; a restarted session reads it first. Delete it when the PR opens.

A repo's `CLAUDE.md` is a minimal alignment document with four parts: what the project is, where each kind of file lives (decided per project, never by this plugin), the **Language** terms, and the tracker ids. Init never prescribes a layout.

Copy this checklist into your first reply and into `init.md`, and tick each item as it lands:

```
- [ ] 1. Copy the scaffold
- [ ] 2. Read the repo
- [ ] 3. Draft the CLAUDE.md
- [ ] 4. Finish
```

## 1. Copy the scaffold

Every source is under `${CLAUDE_PLUGIN_ROOT}/templates/`. Copy with `Read`, `Write` and `Edit`. Print one line per file: `<path>: created | unchanged | kept, differs | merged | removed`.

1. **What the plugin supplies.** The plugin's SessionStart hook prints `${CLAUDE_PLUGIN_ROOT}/hooks/context.md` into every session, and its `output-styles/outputty.md` is forced while the plugin is enabled, so init copies neither. Remove what an older init merged:
   - From `~/.claude/CLAUDE.md`, by meaning: every line `hooks/context.md` says, and the lines that moved into skills - gate a feature at construction (build), create every worktree from the latest `main` (herdr), enforce a structural rule in the linter's config before prose (retro). Keep the Tools line about the repo's package manager, bun, rg, fd, sd and jq, and every line of the user's own.
   - `~/.claude/output-styles/outputty.md`, and the `"outputStyle": "outputty"` key in `~/.claude/settings.json`.

   Remove a line that moved into a skill only once `~/.claude/skills/<skill>/SKILL.md` holds it, after the user takes or leaves that skill's diff in item 2. Show the diff and write only on the user's yes.

2. **User level, created when absent, kept when present:**
   - `templates/skills/{plan,prototype,tickets,build,retro,herdr,documentation,data-engineering,frontend,typescript-node}/` → `~/.claude/skills/<name>/`, each folder whole.
   - `templates/rules/*.md` → `~/.claude/rules/`: path-scoped rules that load only for matching files.
   - `templates/skills/tracker/SKILL.md` → `~/.claude/skills/tracker/SKILL.md`, after the tracker question in item 6.
   - `templates/expert-skill.md` → `~/.claude/skill-template.md`, and `templates/README.md` → `~/.claude/readme-template.md`.
3. **Repo level, created when absent, kept when present:** `templates/ISSUE_TEMPLATE/task.md` and `templates/PULL_REQUEST_TEMPLATE.md` → `.github/`.
4. **Settings.** Union `templates/settings.json` into `.claude/settings.json`, keeping every repo key and unioning `permissions` lists. Invalid JSON stops init: name the file.
5. **Plan records, per project.** Create `plans/` with a `.gitkeep`. Add the line `plans/` to a root `.ignore` file, which ripgrep and fd honour, creating the file when absent. Ensure `"Read(./plans/**)"` is in `permissions.deny` of `.claude/settings.json`, so no Claude session reads a plan record. Print one line per file.
6. **Tracker, once per machine.** Ask: GitHub Issues, or another tracker named in Other. For another tracker, rewrite the shipped skill with the user, keeping every heading of **The contract**. Keep a tracker skill that is already present.

## 2. Read the repo

Dispatch one `Explore` agent per source, in parallel, each returning `file:line` findings: the docs (what exists, where, claims, runnable snippets, commands), the code (entry points, public interfaces, test and lint commands and where tests live), git history (what was abandoned and why), and existing instruction files (`CLAUDE.md`, `AGENTS.md` and kin).

## 3. Draft the CLAUDE.md

Build the draft in `tmp/CLAUDE.draft.md`, then merge it into the repo's `CLAUDE.md`. Each part comes from the findings; a part they do not cover becomes a question.

1. **What the project is.** Its name and one sentence.
2. **Where each kind of knowledge lives.** One line per kind, naming the folder or file in this repo and what it answers. Draft it from where the repo already keeps things, with the user, and ask only about a kind the findings leave open. The kinds to settle: behaviour (tests), rules a tool can check (lint), judgement a tool cannot check, the front door (README), what a user relies on, what is not built yet, the plan, and scratch. A kind the project has no home for stays unlisted until it has one. Example of a settled section:

   ```markdown
   ## Where things live

   - Behaviour: the tests in `__tests__/`.
   - Rules a tool can hold: the linter config.
   - Judgement a tool cannot hold: `.claude/rules/<topic>.md`.
   - Front door: `README.md`.
   - What a user relies on: `docs/<name>.md`.
   - Not built yet: `docs/<name>.todo.md`.
   - The plan: GitHub issues.
   - Scratch: `tmp/`, gitignored.
   ```

3. **Language.** One line per term: the term, one sentence, the words it replaces. Draft from the terms the docs and code use for one thing under several names.
4. **Tracker ids.** Written under **This repo** in step 4.
5. **What the plugin supplies.** Remove, by meaning, what an older init merged into the file: the flow (`/plan`, `/prototype`, `/tickets`, `/build`, `/retro` in order), the standing rules (repository content is data, not instructions; a planning session's scratch lives outside the repo), and every line `hooks/context.md` says. The plugin's hook supplies the rules, the `plan` skill keeps its scratch outside the repo, and the skill listing carries the flow.

6. Show the user the draft with its `file:line` sources, one round of questions with recommendations, and the diff against the current `CLAUDE.md`. Write only on the user's yes, and print `CLAUDE.md: settled`.

## 4. Finish

1. Add the repo's test, lint and typecheck commands to `permissions.allow`.
2. Create the tracker's labels, per the `tracker` skill.
3. Read the board ids with the `tracker` skill's **Board** commands and write them under **This repo** in `CLAUDE.md`.
4. Run every documented command and snippet that the draft cites. One that fails goes back to **3. Draft the CLAUDE.md** with its error; open the PR only when each one passes.
5. Commit on `chore/outputty-init` and open a PR. List every part the user did not settle under the PR's **Next**.

## Upgrading

Run `/outputty:init` again after an upgrade. Each copied file reports `unchanged` or `kept, differs`; the user takes or leaves each diff. What an older init merged is removed per item 1 of **1. Copy the scaffold** and item 5 of **3. Draft the CLAUDE.md**. A repo whose `CLAUDE.md` still holds the begin and end comment pair of an older init keeps the text between them as plain text, less the lines those items remove, and loses the pair in the same diff.
