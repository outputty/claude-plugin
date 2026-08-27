---
name: breakdown
description: Files a settled plan as a GitHub parent issue plus one sub-issue per unit of work, each with numbered done-conditions a fix-issue agent can build cold and /goal can judge. Runs on its own once grill settles, or on "break this down", "file the issues", "create the sub-tasks".
---

# breakdown - one parent issue, N buildable sub-issues

Input: a settled plan (the draft `/grill` produced, or `$ARGUMENTS`). Output: the parent issue, its sub-issues linked with `--parent` and ordered with `--blocked-by`, all on the board at `Todo`.

## 1. Research

Enter plan mode. Read the code the plan touches with the built-in `Explore` agent: the files, the conventions, the test runner, the nearest sibling of each new piece. Nothing is filed on a guess.

## 2. Decompose

Split the plan into units. Each unit:

1. Is buildable cold by an agent that cannot ask a question.
2. Leaves the program working when its PR merges alone (new path beside old, or behind a flag).
3. Sizes to one PR: roughly 100 to 1000 added lines.
4. Has exactly one home in the split, and the split covers the whole plan. Name any remainder.
5. Builds nothing that already exists: "build X" is filed only after X was looked for, and the issue's Problem names what was found.

Order the units by dependency. A unit that needs another's code is `--blocked-by` it.

## 3. Find the check

For each unit, write the numbered **Done when** cases: a command and its expected output, or a check a stranger can run. Case 1 is the repo's canonical example when one exists. When no concrete end-to-end check exists, ask the user for one with `AskUserQuestion`, offering two or three options. Do not skip this: the builder cannot ask.

## 4. Present

Leave plan mode with the list: one line per unit (title, folder, blocked-by, the first done case). The user approves once.

## 5. Write the docs

Before filing: a paragraph in `.claude/roadmap.md` saying why this parent is worth building now, and the architecture delta (new pieces, seams, what flows where) in `.claude/architecture.md`, marked `pending #<parent>` until it ships. A new canonical example goes into `.claude/examples.md`. Commit them on the planning branch.

## 6. File

Load the `github` skill and use its commands verbatim: create the parent, then each sub-issue with `--parent` and `--blocked-by`, each body from `.github/ISSUE_TEMPLATE/task.md` written to the same standard as a reply, then `item-add` every issue to the board. A unit that must go first carries the `priority:high` label. Report the parent number and the sub-issue numbers in dependency order.

## 7. Retro

Run the `retro` skill on this planning session and commit what it writes on the planning branch.
