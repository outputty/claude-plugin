---
name: build
description: Builds one GitHub ticket to a stack of reviewed draft PRs, one layer each, docs last, in this session's worktree. Use as /build <number>, or as the procedure a /goal for a ticket follows.
---

# build - one ticket, one stack

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Work in a worktree of your own (`claude --worktree ticket-<n>`, or `EnterWorktree`), never the primary checkout.

## 1. Read the ticket

```bash
gh issue view <n> --json title,body,labels
```

The body's **Done when** list is the end state; every case is a check you run before you finish. A ruling the body leaves open is asked now, with `AskUserQuestion`, before any edit.

A ticket labelled `spike` ships no code: run the probe, post the findings as a comment, delete the probe, and stop.

## 2. Claim it

Load the `github` skill; every `gh` command below is spelled out there. Assign yourself, find the board item id for `<n>`, and set its Status to `In Progress`.

## 3. Orient

1. Read `.claude/product.md` and `.claude/architecture.md`, then the files the ticket's **Where** and **Sibling** name, whole. `.claude/rules/code.md` is already in your context; it governs the diff.
2. Run the repo's test command once. A red baseline is not yours to fix: note it in the first PR and continue.
3. Plan the layers: each leaves the program working when merged alone (new path beside old, or behind a flag), sizes to one PR (roughly 100 to 1000 added lines), and the last is **docs**. Post the plan as a comment on the ticket before the first edit:

```markdown
## Layers

1. L1 - <what lands> - <the Done when cases it covers>
2. L2 - <what lands> - <cases>
3. docs - README, docs/, architecture done, product.md swept, examples re-run
```

Call `advisor` before you commit to the plan.

## 4. Build each layer

Per layer, in order:

1. Write its Done when cases as failing tests, then the code that passes them, matching the sibling's shape.
2. Run the repo's test, lint and typecheck commands.
3. Invoke the `Skill` tool with `skill: "code-review"`, effort `medium`. Fix findings that affect correctness or a Done when case; note the rest as skipped. Run the tests again.
4. Commit with the ticket number in the subject (`<title>, L<k> (#<n>)`), then stack it: the first layer adopts the branch you are on (`git branch --show-current`, then `gh stack init <that branch>`); each later layer is `gh stack add feature/<slug>-<n>-l<k>`. Then `gh stack submit --auto`, and `gh pr edit` with a body from `.github/PULL_REQUEST_TEMPLATE.md`; the last layer's body carries `Closes #<n>`.

## 5. The docs layer

The last layer, its own PR, written after every code layer passed review:

1. README and `docs/` for what this ticket changed, per `.claude/rules/docs.md`.
2. `architecture.md`: the entry marked `pending #<n>` is marked `done`; a seam this stack moved is rewritten.
3. `product.md`: the Language section is swept for any term this stack made stale.
4. `examples.md`: a block whose output changed is re-run and its real output pasted.
5. `roadmap.md`: the ticket's paragraph moves under **Shipped**, naming the PRs.
6. Run the `retro` skill on this build; a rule it writes lands in `.claude/rules/` inside this layer.

Before declaring done, run every **Done when** case and paste each real output into the docs PR's **What this looks like**. Call `advisor` once more. Report the stack's bottom PR URL. Do not merge.

## Stop conditions

Each is a question to the user, asked with `AskUserQuestion`, with the stack so far named:

- A fix that fails twice after a real diagnosis: both diagnoses and the second fix.
- A file needed outside the ticket's **Where** folder, or a review finding that reaches outside it.
- A layer that cannot leave the program working on its own.
- The stack no longer serves the ticket or the roadmap.
