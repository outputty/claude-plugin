---
name: fix-issue
description: Builds one GitHub issue to an open, reviewed PR in the current worktree. Invoked as /fix-issue <number> by the build session's fix-issue agent, or by hand.
disable-model-invocation: true
---

# fix-issue - one issue, one PR

Build issue `$ARGUMENTS`. One plain command per Bash call: read what it printed, then type that value
into the next call.

## 1. Read the issue

```bash
gh issue view $ARGUMENTS --json title,body,labels
```

The body's **Done when** list is the contract. Every case is a check you will run. A ruling the body
leaves open is a stop: comment the question on the issue, add the label `needs-decision`, and end
your turn. A dispatched agent cannot ask.

## 2. Claim it

```bash
gh issue edit $ARGUMENTS --add-assignee @me
```

Move its board item to `In Progress` (board number, Status field id and option ids are in CLAUDE.md
under **This repo**):

```bash
gh project item-list <board#> --owner <org> --format json --jq '.items[] | select(.content.number == $ARGUMENTS) | .id'
```

```bash
gh project item-edit --id <item id> --project-id <project id> --field-id <status field id> --single-select-option-id <In Progress id>
```

## 3. Build it

1. Read the files the issue's **Where** and **Sibling** name, whole.
2. Write each **Done when** case as a failing test first.
3. Write the code that passes it, matching the sibling's shape.
4. Run the repo's test, lint and typecheck commands from its CLAUDE.md or manifest.

Call `advisor` before you commit to an approach, and again before you declare done.

## 4. Review once

Invoke the `Skill` tool with `skill: "code-review"`, effort `medium`. Fix findings that affect
correctness or a **Done when** case; note the rest as skipped. Run the tests again.

## 5. Ship

Commit with the issue number in the subject, push, and open the PR from the template:

```bash
git add <the files this issue touched>
```

```bash
git commit -m "<title> (#$ARGUMENTS)"
```

```bash
gh stack add feature/issue-$ARGUMENTS
```

```bash
gh stack submit --auto
```

The PR body follows `.github/PULL_REQUEST_TEMPLATE.md` and carries `Closes #$ARGUMENTS`. End your turn
with one line: `PR: <url>`. Do not merge.

## Stop conditions

- A fix that fails twice after a real diagnosis: comment both diagnoses on the issue, label
  `needs-decision`, end with `PR: none - <reason>`.
- A file needed outside the issue's **Where** folder: same.
