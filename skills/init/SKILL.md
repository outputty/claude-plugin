---
name: init
description: Wires outputty into a repo and fills its product docs. Installs the block, rules, templates and settings, then drafts product.md, architecture.md, roadmap.md, examples.md and the first rules from what the repo already says, one file at a time, each settled with the user in a Q&A round. Turns the repo's domain knowledge into expert skills the user picks. Run once; run again after a plugin upgrade. Idempotent.
disable-model-invocation: true
---

# init - install, then fill the docs with the user

Input: a repo, brownfield or empty.

Output: the managed block in `CLAUDE.md`, `.claude/rules/`, `.claude/settings.json`, the two `.github/` templates, four product docs whose every section the user has settled, the expert skills the user chose, and a PR carrying it all.

Progress is written to `~/.claude/projects/<project>/plans/init.md`, outside the repo. A restarted session reads it first and continues from the last settled file. Delete it when the PR opens.

## 1. Install the files

Every template lives under `${CLAUDE_PLUGIN_ROOT}/templates/`. Install each with `Read`, `Write` and `Edit`; run no shell for the copying. Print one line per file: `<path>: created | unchanged | kept, differs from <template> | block replaced | block appended`.

1. **`CLAUDE.md`** - read `templates/CLAUDE.block.md`. No file: write the block. Both markers present: replace everything from `<!-- outputty:begin` through `<!-- outputty:end -->`, text outside untouched. No markers: append a blank line and the block.
2. **Created when absent, kept when present** - `templates/rules/*.md` → `.claude/rules/`; `templates/ISSUE_TEMPLATE/task.md` and `templates/PULL_REQUEST_TEMPLATE.md` → `.github/`. A present file is the repo's own; compare and report.
3. **`.claude/settings.json`** - read the template and the repo's file; write the union. Every template key is set; `permissions.allow|deny|ask` are unioned; every other repo key is preserved. Invalid JSON is a stop: name the file, ask the user to fix it.
4. **The four docs** - `templates/docs/*.md` → `.claude/`. A missing file gets the template. A present file is not overwritten; step 3 maps it.

## 2. Read the repo once

Dispatch one `Explore` agent per source, in parallel. Each returns findings with `file:line`.

1. **Documentation, wherever it lives** - every Markdown, text and doc file (`fd -e md -e mdx -e txt -e rst`, plus any folder the README points at). Per file: what it claims about the project, the runnable snippets, the install and check commands, and whether it teaches a domain rather than this repo. A curriculum, a comparison, a standards write-up, an expert knowledgebase, or a section true of a dozen projects teaches a domain.
2. **Code** - the entry points, the public interface of each package or module, the boundaries between them, how a caller overrides a default, the test runner and the lint command.
3. **Git history** (`git log --oneline -200`, merges, reverts) - what was tried and abandoned, and what killed it.
4. **Existing instruction files** - `CLAUDE.md` outside the markers, any agent-instruction file (`AGENTS.md`, `.cursorrules`, their kin), and any earlier product docs or lessons files found in 1. Every standing rule and decision, verbatim with its location.

Write the findings to the scratch file, one heading per source.

## 3. Fill each doc, one at a time

Order: `product.md`, `architecture.md`, `roadmap.md`, `examples.md`, then `.claude/rules/`. `product.md` comes first because every later question is checked against its North Star and Language.

Per doc:

1. **Draft.** Fill every section of the template from the findings. The template's own comment says what each section holds. A section the findings do not cover is drafted as a question, not a guess.
2. **Map an old doc.** When the repo already had this doc in another shape, place each of its paragraphs into the template's sections. What does not fit goes under **Unplaced** at the end of the draft.
3. **Present** the draft in the reply, every claim with its `file:line`. Then one numbered round of questions with recommendations, in the `/plan` shape: an unfilled section, a claim two sources disagree on, an unplaced paragraph, a decision the old doc made that the new shape has no home for. A claim with no location is a question.
4. **Wait** for the answers. Update the draft and the scratch file. Repeat until no question is left. Write the file and print `<path>: settled`.

For `.claude/rules/`: every standing rule found in step 2.4 becomes a candidate line. Present them as a numbered list, keep / drop / reword per line, each with the file it lands in. Kept lines land with today's date. The old file that held them is left for the user to delete.

Where a rule lands:

- A rule that applies to every file goes in one of the shipped files: `code.md`, `issues.md`, or `docs.md`.
- A rule about one language or one folder goes in its own file named for the topic, with `paths:` frontmatter: `typescript.md` with `paths: ["**/*.{ts,tsx}"]`, `testing.md` with `paths: ["**/*.test.*"]`, `migrations.md` with `paths: ["db/**"]`. A path-scoped rule loads when a matching file is read, and not otherwise.
- A claim lives in exactly one place: the block, one rule file, or one skill. Two places contradict, and Claude picks one arbitrarily.
- The unscoped files plus the block stay under 200 lines together; past that, `/doctor` proposes trims.

After the first matching read, `/context` lists the rule under Memory files; that is the check that a `paths:` pattern works.

## 3b. Domain knowledge becomes expert skills

Candidates are the files step 2.1 marked as teaching a domain. No path is assumed.

Group them one per tool, vendor or discipline (`dlt`, `dbt`, `duckdb`, `snowflake`, `dimensional-modelling`). Two candidates merge only when their findings could be swapped unnoticed. Two distinct tools are never one skill.

Ask with `AskUserQuestion`, `multiSelect: true`:

- one question per four domains
- each option a domain by its slug, with the files behind it and their line count in the description
- a merge the grouping proposed stated in the label: `dimensional-modelling, merging docs/lessons/01-09 and .claude/experts/warehouse-loading.md`
- a recommendation on the ones worth keeping
- the full candidate list in the reply above the question

The user selects the domains that become skills. An unselected domain is dropped; its files stay where they are and are named in the PR body.

For each selected domain, write `.claude/skills/<domain>/SKILL.md` from `${CLAUDE_PLUGIN_ROOT}/templates/SKILL.md`:

- the description says when a ticket needs it
- the body is self-contained for quick judgements: one actionable line per pattern, rule or trap, a few hundred lines at most, generic to the domain
- the explanations, worked cases and source files move under `references/`, each pointed at from the line it explains
- a claim that appears in two candidates is written once

A domain skill loads itself when `/plan` or `/build` meets a ticket in its domain.

## 4. Finish

1. Add the repo's test, lint and typecheck commands (from step 2.2) to `permissions.allow`.
2. Create the labels: `gh label create ready --color 0e8a16 --force`, `gh label create priority:high --color b60205 --force`, `gh label create needs-planning --color d93f0b --force`.
3. Write the board line under **This repo** in `CLAUDE.md`, outside the markers: `Board: <org>/<number> (project id <id>) · Status field <id>: Todo <id> · In Progress <id> · Done <id>`. The `github` skill's last section prints the ids. No board is a question to the user.
4. Run every fenced block in `.claude/examples.md`; its real output goes into the doc.
5. Commit on `chore/outputty-init` and open a PR (`gh pr create --body-file`). Every doc section the user did not settle is listed in the PR body under **Keep in mind**. Delete the scratch file.
