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

Load the `github` skill; every `gh` command below is spelled out there. Assign yourself, find the
board item id for `$ARGUMENTS`, and set its Status to `In Progress`.

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

Commit with the issue number in the subject (`<title> (#$ARGUMENTS)`), then open the PR with the
`github` skill's stacked-PR commands: `gh stack init` when this worktree holds no stack yet, otherwise
`gh stack add`, then `gh stack submit --auto`, then `gh pr edit` with a body from
`.github/PULL_REQUEST_TEMPLATE.md` that carries `Closes #$ARGUMENTS`. End your turn with one line:
`PR: <url>`. Do not merge.

## Stop conditions

- A fix that fails twice after a real diagnosis: comment both diagnoses on the issue, label
  `needs-decision`, end with `PR: none - <reason>`.
- A file needed outside the issue's **Where** folder: same.
