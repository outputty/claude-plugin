---
name: init
description: Wires outputty into a repo and fills its product docs - installs the block, rules, templates and settings, then drafts product.md, architecture.md, roadmap.md, examples.md and the first rules from what the repo already says, one file at a time, each settled with the user in a Q&A round. Run once; run again after a plugin upgrade to refresh the block and re-check the docs. Idempotent.
disable-model-invocation: true
---

# init - install, then fill the docs with the user

Input: a repo, brownfield or empty. Output: the managed block in `CLAUDE.md`, `.claude/rules/`, `.claude/settings.json`, the two `.github/` templates, four product docs whose every section the user has settled, and a PR carrying it all.

Everything this session learns is written, as it is learned, to `~/.claude/projects/<project>/plans/init.md` outside the repo (the directory that holds `memory/`); a restarted session reads it first and continues from the last settled file. Delete it when the PR opens.

## 1. Install the files

Every template lives under `${CLAUDE_PLUGIN_ROOT}/templates/`. Install each with `Read`, `Write` and `Edit`; run no shell for the copying. Print one line per file: `<path>: created | unchanged | kept, differs from <template> | block replaced | block appended`.

1. **`CLAUDE.md`** - read `templates/CLAUDE.block.md`. No file: write the block. Both markers present: replace everything from `<!-- outputty:begin` through `<!-- outputty:end -->`; text outside stays byte for byte. No markers: append a blank line and the block.
2. **Created when absent, kept when present**: `templates/rules/{code,docs,issues}.md` → `.claude/rules/`; `templates/ISSUE_TEMPLATE/task.md` → `.github/ISSUE_TEMPLATE/task.md`; `templates/PULL_REQUEST_TEMPLATE.md` → `.github/PULL_REQUEST_TEMPLATE.md`. A present file is the repo's own; compare and report.
3. **`.claude/settings.json`** - read `templates/settings.json` and the repo's file; write the union: every template key set, `permissions.allow|deny|ask` unioned, every other repo key preserved. Invalid JSON is a stop: name the file, ask the user to fix it.
4. **The four docs** - `templates/docs/{product,roadmap,architecture,examples}.md` → `.claude/`. A missing file gets the template. A present file is **not** overwritten; step 3 maps it.

## 2. Read the repo once

Dispatch, in parallel, one `Explore` agent per source, each returning findings with `file:line`:

1. **README and `docs/`** - what the project claims to do and for whom; the runnable snippets it carries; the install and check commands.
2. **Code** - the top-level entry points, the public interface of each package or module, the boundaries between them, how a caller overrides a default, the test runner and the lint command.
3. **Git history** (`git log --oneline -200`, merge commits, reverts) - what was tried and abandoned, and what killed it.
4. **Existing instruction files** - `CLAUDE.md` outside the markers, `AGENTS.md`, `.cursorrules`, `.claude/lessons*`, any old `product.md`, `architecture.md`, `roadmap.md`, `examples.md`: every standing rule and every decision they state, verbatim with its location.

Write the findings to the scratch file under one heading per source.

## 3. Fill each doc, one at a time, in this order

For each of `product.md`, `architecture.md`, `roadmap.md`, `examples.md`, then `.claude/rules/`:

1. **Draft.** From the findings, fill every section of the template. The template's own instruction lines say what each section holds; a section the findings do not cover is drafted as a question, not a guess. When the repo already had this doc in another shape, map each of its paragraphs into the template's sections, and list what did not fit under **Unplaced** at the end of the draft.
2. **Present** the draft in the reply, then one numbered round of questions, each with a recommendation, in the `/plan` shape: a section the findings could not fill, a claim two sources disagree on, an unplaced paragraph and where it should go or that it is dead, a decision the old doc made that the new shape has no home for. Every claim in the draft carries its `file:line`; one that has none is a question.
3. **Wait** for the user's answers. Update the draft and the scratch file. Repeat the round until no question is left, then write the file and print `<path>: settled`.
4. **`.claude/rules/`**: every standing rule found in step 2.4 becomes a candidate line in the matching rules file (code, docs, issues), presented as a numbered list with keep / drop / reword per line. The user answers; kept lines land with today's date. The old file that held them is left for the user to delete.

`product.md` comes first because every later question is checked against its North Star and Language.

## 4. Finish

1. Add the repo's test, lint and typecheck commands (from step 2.2) to `permissions.allow`.
2. Create the labels: `gh label create ready --color 0e8a16 --force`, `gh label create priority:high --color b60205 --force`, `gh label create needs-planning --color d93f0b --force`.
3. Write the board line under **This repo** in `CLAUDE.md`, outside the markers: `Board: <org>/<number> (project id <id>) · Status field <id>: Todo <id> · In Progress <id> · Done <id>`. The `github` skill's last section prints the ids; no board is a question to the user.
4. Run every fenced block in `.claude/examples.md`; its real output goes into the doc.
5. Commit on `chore/outputty-init`, open a PR with the `github` skill's stack commands or `gh pr create --body-file`, and delete the scratch file. Every doc section the user did not settle is listed in the PR body under **Keep in mind**.
