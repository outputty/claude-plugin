---
name: init
description: Scaffolds outputty into a repo - copies the skills, the output style, the rules, the product docs and the templates into the checkout, where the repo owns and edits them, then fills the docs with the user one file at a time and turns the repo's domain knowledge into expert skills the user picks. Run once; run again after a scaffold upgrade to see what drifted. Idempotent.
disable-model-invocation: true
---

# init - scaffold, then fill the docs with the user

Input: a repo, brownfield or empty.

Output: the repo's own copy of everything outputty is, four product docs the user has settled section by section, the expert skills the user chose, and a PR carrying it all. After this, the repo edits its copy; the plugin is only this command.

Progress is written to `~/.claude/projects/<project>/plans/init.md`, outside the repo. A restarted session reads it first and continues from the last settled file. Delete it when the PR opens.

## 1. Copy the scaffold

Every file lives under `${CLAUDE_PLUGIN_ROOT}/templates/`. Copy each with `Read`, `Write` and `Edit`; run no shell for the copying.

Print one line per file: `<path>: created | unchanged | kept, differs from <template> | block replaced | block appended`.

1. **`CLAUDE.md`** - read `templates/CLAUDE.block.md`.
   - No file: write the block.
   - Both markers present: replace everything from `<!-- outputty:begin` through `<!-- outputty:end -->`; text outside stays untouched.
   - No markers: append a blank line and the block.
2. **User level, created when absent, kept when present** - files about how you work, living once under `~/.claude/`. A present file is yours: compare it to the template and report.
   - `templates/skills/{plan,tickets,build,retro,herdr}/SKILL.md` → `~/.claude/skills/<name>/SKILL.md`; `herdr` is how a session is opened in a new tab, and loads in every repo.
   - `templates/skills/tracker/SKILL.md` → `~/.claude/skills/tracker/SKILL.md`, after the tracker question in step 1.5.
   - `templates/rules/*.md` → `~/.claude/rules/`: `code`, `docs`, `issues` are preferences, not repo facts.
   - `templates/output-styles/outputty.md` → `~/.claude/output-styles/outputty.md`.
   - `templates/expert-skill.md` → `~/.claude/skill-template.md`.
   - Expert skills, written in step 3b, land under `~/.claude/skills/<domain>/`.
3. **Repo level, created when absent, kept when present.** These are outputs about this repo.
   - `templates/ISSUE_TEMPLATE/task.md` and `templates/PULL_REQUEST_TEMPLATE.md` → `.github/`.
   - `templates/docs/*.md` → `.claude/`; step 3 maps a present one.
   - `.claude/rules/` starts empty; step 3 and `retro` fill it with rules true here only.
4. **`.claude/settings.json`** - read the template and the repo's file, then write the union.
   - Every template key is set.
   - The output style is turned on globally, not here: read `~/.claude/settings.json`, set `"outputStyle": "outputty"`, write it back with every other key preserved, and report `~/.claude/settings.json: outputStyle set`; one global setting covers every repo.
   - `permissions.allow|deny|ask` are unioned.
   - Every other repo key is preserved.
   - Invalid JSON is a stop: name the file and ask the user to fix it.
5. **The tracker, once per machine.** Ask with `AskUserQuestion`: GitHub Issues (the shipped implementation), or another tracker, named in Other.
   - GitHub: copy the shipped skill to `~/.claude/skills/tracker/`.
   - Another: rewrite the shipped skill to that tracker with the user, keeping every heading of **The contract** and replacing every command, then save it there.
   - A `~/.claude/skills/tracker/` already present is kept and reported; ask only whether it is still the right tracker.
   - Repo-specific ids (board, labels) go in this repo's `CLAUDE.md` under **This repo**, never in the skill.
6. **Existing repo-level copies from an earlier scaffold.** Look for `.claude/skills/{plan,tickets,build,retro,tracker,herdr}/`, `.claude/skills/*-expert/` or any other `.claude/skills/<domain>/`, `.claude/output-styles/outputty.md`, `.claude/skill-template.md`, and `.claude/rules/*.md`.
   - Present every file found in one `AskUserQuestion`, `multiSelect: true`, four per question, each with a recommendation: selected means **move to `~/.claude/`**, unselected means **keep in the repo**. The full list stays in the reply above the question.
   - A moved file that differs from its user-level twin is merged with the user, line by line, so no claim is held twice.
   - A rules file can be mixed: on "split", ask again per line, selected = global, unselected = this repo.
   - A moved file is deleted from the repo in the same commit.

## 2. Read the repo once

Dispatch one `Explore` agent per source, in parallel. Each returns findings with `file:line`.

1. **Documentation, wherever it lives** - every Markdown, text and doc file (`fd -e md -e mdx -e txt -e rst`, plus any folder the README points at). Per file:
   - what it claims about the project
   - the runnable snippets it carries
   - the install and check commands
   - whether it teaches a domain rather than this repo: a curriculum, a comparison, a standards write-up, an expert knowledgebase, a section true of a dozen projects
2. **Code** - the entry points, the public interface of each package or module, the boundaries between them, how a caller overrides a default, the test runner and the lint command.
3. **Git history** (`git log --oneline -200`, merges, reverts) - what was tried and abandoned, and what killed it.
4. **Existing instruction files** - `CLAUDE.md` outside the markers, any agent-instruction file (`AGENTS.md`, `.cursorrules`, their kin), and any earlier product docs or lessons files found in 1. Every standing rule and decision, verbatim with its location.

Write the findings to the scratch file, one heading per source.

## 3. Fill each doc, one at a time

Order: `product.md`, `architecture.md`, `roadmap.md`, `examples.md`, then `.claude/rules/`. `product.md` comes first because every later question is checked against its North Star and Language.

Per doc:

1. **Draft** every section of the template from the findings; the template's own comment says what each section holds. A section the findings do not cover is drafted as a question, not a guess.
2. **Map an old doc.** When the repo already had this doc in another shape, place each of its paragraphs into the template's sections. What does not fit goes under **Unplaced** at the end of the draft.
3. **Present** the draft in the reply, every claim with its `file:line`, then one numbered round of questions with recommendations in the `/plan` shape. A question is: an unfilled section, a claim two sources disagree on, an unplaced paragraph, a decision the old doc made that the new shape has no home for, a claim with no location.
4. **Wait** for the answers, then update the draft and the scratch file; repeat until no question is left. Write the file and print `<path>: settled`.

### The rules

Every standing rule found in step 2.4 becomes a candidate line. Present them as a numbered list, keep / drop / reword per line, each with the file it lands in. Kept lines land with today's date; the old file that held them is left for the user to delete.

Then ask the scope, `AskUserQuestion` with `multiSelect: true`, four lines per question, each with a recommendation: selected means **every repo** (`~/.claude/rules/`), unselected means **this repo only** (`.claude/rules/`). A rule that would hold in a repo that does not exist yet is global; one that names this codebase's files, seams or conventions is the repo's.

Where a rule lands, at either level:

- A rule that applies to every file goes in one of the shipped files: `code.md`, `issues.md`, or `docs.md`.
- A rule about one language or one folder goes in its own file named for the topic, with `paths:` frontmatter: `typescript.md` with `paths: ["**/*.{ts,tsx}"]`, `testing.md` with `paths: ["**/*.test.*"]`, `migrations.md` with `paths: ["db/**"]`.
- A path-scoped rule loads when a matching file is read, and not otherwise.
- A claim lives in exactly one place: the block, one rule file, or one skill. Two places contradict, and Claude picks one arbitrarily.
- The unscoped files at both levels plus the block stay under 200 lines together; past that, `/doctor` proposes trims.
- User-level rules load before the repo's, so a repo rule wins a conflict; a claim still lives in one place only.

After the first matching read, `/context` lists the rule under Memory files. That is the check that a `paths:` pattern works.

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

For each selected domain, write `~/.claude/skills/<domain>/SKILL.md` from `~/.claude/skill-template.md`:

- the description says when a ticket needs it
- the body is self-contained for quick judgements: one actionable line per pattern, rule or trap, a few hundred lines at most, generic to the domain
- the explanations, worked cases and source files move under `references/`, each pointed at from the line it explains
- a claim that appears in two candidates is written once

A domain skill loads itself when `/plan` or `/build` meets a ticket in its domain.

## 4. Finish

1. Add the repo's test, lint and typecheck commands (from step 2.2) to `permissions.allow`.
2. Create the tracker's labels, per the `tracker` skill.
3. Write the board line under **This repo** in `CLAUDE.md`, outside the markers, per the `tracker` skill. No board is a question to the user.
4. Run every fenced block in `.claude/examples.md`; its real output goes into the doc.
5. Commit on `chore/outputty-init` and open a PR. Every doc section the user did not settle is listed in the PR body under **Keep in mind**.
6. Delete the scratch file.

## Upgrading

Run `/outputty:init` again after a scaffold upgrade. Every copied file reports `unchanged` or `kept, differs from <template>`; the diff is the user's to take or leave, file by file.
