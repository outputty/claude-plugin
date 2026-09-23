---
name: init
description: Scaffolds outputty into a repo - copies the skills, output style, user block, doc templates and settings, then drafts the repo's docs with the user. Run once; run again after an upgrade to see what drifted. Idempotent.
disable-model-invocation: true
---

# init - scaffold, then draft the docs

Output: the repo's docs settled with the user, the user-level files installed, and one PR. Write progress to `~/.claude/projects/<project>/plans/init.md`; a restarted session reads it first. Delete it when the PR opens.

## 1. Copy the scaffold

Every source is under `${CLAUDE_PLUGIN_ROOT}/templates/`. Copy with `Read`, `Write` and `Edit`. Print one line per file: `<path>: created | unchanged | kept, differs | block replaced | block appended`.

1. **Managed blocks.** `templates/CLAUDE.block.md` goes into the repo's `CLAUDE.md`, and `templates/CLAUDE.user.md` goes into `~/.claude/CLAUDE.md`. With both markers present, replace everything from `<!-- outputty:begin` through `<!-- outputty:end -->`. With no markers, append the block. Text outside the markers stays untouched.
2. **User level, created when absent, kept when present:**
   - `templates/skills/{plan,tickets,build,retro,herdr,documentation}/` → `~/.claude/skills/<name>/`, each folder whole.
   - `templates/rules/*.md` → `~/.claude/rules/`: path-scoped rules that load only for matching files.
   - `templates/skills/tracker/SKILL.md` → `~/.claude/skills/tracker/SKILL.md`, after the tracker question below.
   - `templates/output-styles/outputty.md` → `~/.claude/output-styles/outputty.md`.
   - `templates/expert-skill.md` → `~/.claude/skill-template.md`, and `templates/README.md` → `~/.claude/readme-template.md`.
3. **Repo level, created when absent, kept when present:** `templates/ISSUE_TEMPLATE/task.md` and `templates/PULL_REQUEST_TEMPLATE.md` → `.github/`; `templates/docs/*.md` → `.claude/`.
4. **Settings.** Union `templates/settings.json` into `.claude/settings.json`, keeping every repo key and unioning `permissions` lists. Set `"outputStyle": "outputty"` in `~/.claude/settings.json`, keeping its other keys. Invalid JSON stops init: name the file.
5. **Tracker, once per machine.** Ask: GitHub Issues, or another tracker named in Other. For another tracker, rewrite the shipped skill with the user, keeping every heading of **The contract**. Keep a tracker skill that is already present.

## 2. Read the repo

Dispatch one `Explore` agent per source, in parallel, each returning `file:line` findings: the docs (claims, runnable snippets, commands), the code (entry points, public interfaces, test and lint commands), git history (what was abandoned and why), and existing instruction files (`CLAUDE.md` outside the markers, `AGENTS.md` and kin).

## 3. Draft each doc

In order: `product.md`, `architecture.md`, `roadmap.md`, `examples.md`, then `CLAUDE.md`'s **Language** and `.claude/rules/`.

1. Draft every section from the findings. A section the findings do not cover becomes a question.
2. Present the draft with its `file:line` sources and one round of questions with recommendations.
3. Apply the answers, write the file, and print `<path>: settled`.

## 4. Finish

1. Add the repo's test, lint and typecheck commands to `permissions.allow`.
2. Create the tracker's labels, per the `tracker` skill.
3. Write the board ids under **This repo** in `CLAUDE.md`, outside the markers.
4. Run every block in `.claude/examples.md` and paste its real output.
5. Commit on `chore/outputty-init` and open a PR. List every section the user did not settle under **Keep in mind**.

## Upgrading

Run `/outputty:init` again after an upgrade. Each copied file reports `unchanged` or `kept, differs`; the user takes or leaves each diff.
