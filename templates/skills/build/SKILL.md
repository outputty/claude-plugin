---
name: build
description: Builds one GitHub ticket to a stack of reviewed draft PRs, one layer each, docs last, in this session's worktree. Use as /build <number>, or as the procedure a /goal for a ticket follows.
---

# build - one ticket, one stack

`<n>` is the ticket number from `$ARGUMENTS` or the active goal.

Work in a worktree of your own, never the primary checkout: `claude --worktree ticket-<n> --model sonnet`, `EnterWorktree`, or the Herdr tab `/tickets` opened for you. A build runs on Sonnet; the layers are mechanical once planned, and the Fable advisor covers the judgement calls. Opus is for planning.

## 1. Read the ticket

```bash
gh issue view <n> --json title,body,labels
```

The body's **Done when** list is the end state. Every case is a check you run before you finish.

A body with no **Done when** list, only a `## Layers` list naming other issue numbers, is a folded epic.

- For each named number: `gh issue view <layer-n> --json body,stateReason,comments`.
- A `CLOSED` layer with `stateReason: NOT_PLANNED` and a "Folded into #<n>… Closed, not built" comment is not finished. Its body carries the real brief and Done when list, for you to re-plan as this ticket's layer in step 3.4.
- Never read that `CLOSED` state as the ticket being done.

A ruling the body leaves open is asked now with `AskUserQuestion`, before any edit.

A ruling that reopens the plan (a different interface, a different level to solve it at) goes back to planning: comment the question on the ticket, send it back per the `tracker` skill, then hand it off per the `tickets` skill's **A needs-planning pick** (a fresh Herdr tab when inside Herdr, otherwise tell the user to run `/plan <n>`), and stop this build.

A ticket labelled `spike` ships no code: run the probe, post the findings as a comment, delete the probe, and stop.

## 2. Claim it

Load the `tracker` skill; every `gh` command below is spelled out there.

Assign yourself. Find the board item id for `<n>` and set its Status to `In Progress`.

## 3. Orient

1. Read `.claude/product.md` and `.claude/architecture.md`, then the files the ticket's **Where** and **Sibling** name, whole.
2. Load the expert skill under `~/.claude/skills/<domain>/` for the ticket's domain. `.claude/rules/code.md` is already in your context; it governs the diff.
3. Run the repo's test command once. A red baseline is not yours to fix: note it in the first PR and continue.
4. Plan the layers.
   - Each leaves the program working when merged alone: new path beside old, or behind a flag.
   - Each sizes to one PR, roughly 100 to 1000 added lines.
   - The last layer is **docs**.
5. Post the plan as a comment on the ticket before the first edit:

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
3. Invoke the `Skill` tool with `skill: "code-review"`, effort `medium`. Fix findings that affect correctness or a Done when case, note the rest as skipped, then run the tests again.
4. Commit with the ticket number in the subject: `<title>, L<k> (#<n>)`.
5. Stack it, per the `tracker` skill's **Stacked PRs**: the first layer starts the stack from the branch you are on, each later layer adds one.
6. Publish the layer as a draft PR and set its body from `.github/PULL_REQUEST_TEMPLATE.md`, per the same section; the last layer's body carries `Closes #<n>`.

## 5. The docs layer

The last layer, its own PR, written after every code layer passed review:

1. README and `docs/` for what this ticket changed, per `.claude/rules/docs.md`.
2. `architecture.md`: the entry marked `pending #<n>` is marked `done`; a seam this stack moved is rewritten.
3. `product.md`: the Language section is swept for any term this stack made stale.
4. `examples.md`: a block whose output changed is re-run and its real output pasted.
5. `roadmap.md`: the ticket's paragraph moves under **Shipped**, naming the PRs.
6. Run the `retro` skill on this build. A rule it writes lands in `.claude/rules/` inside this layer.

Before declaring done:

1. Run every **Done when** case and paste each real output into the docs PR's **What this looks like**.
2. Call `advisor` once more.
3. Report the stack's bottom PR URL. Do not merge.

## Stop conditions

Each is a question to the user, asked with `AskUserQuestion`, with the stack so far named. An answer of "plan it" is the `needs-planning` handoff in step 1.

- A fix that fails twice after a real diagnosis: both diagnoses and the second fix.
- A file needed outside the ticket's **Where** folder, or a review finding that reaches outside it.
- A layer that cannot leave the program working on its own.
- The stack no longer serves the ticket or the roadmap.
