---
name: build
description: Builds one GitHub ticket to a stack of reviewed draft PRs, one layer each, docs last, in this session's worktree. Use as /build <number>, or as the procedure a /goal for a ticket follows.
---

# build - one ticket, one stack

`<n>` is the ticket number from `$ARGUMENTS` or the active goal.

Work in a worktree of your own, never the primary checkout: `claude --worktree ticket-<n> --model sonnet`, `EnterWorktree`, or the Herdr tab `/tickets` opened for you per the `herdr` skill, which starts `claude --worktree` inside it. A build runs on Sonnet; the layers are mechanical once planned, and the Fable advisor covers the judgement calls. Opus is for planning.

## 1. Read the ticket

Load the `tracker` skill; every ticket, board and PR command below is spelled out there. Read the ticket: body, labels, comments.

The body's **Done when** list is the end state. Every case is a check you run before you finish.

A body with no **Done when** list, only a `## Layers` list naming other issue numbers, is a folded epic.

- For each named number, read the layer's state per the `tracker` skill.
- A layer closed as not planned, with a "Folded into #<n>… Closed, not built" comment, is not finished. Its body carries the real brief and Done when list, for you to re-plan as this ticket's layer in step 3.4.
- Never read that closed state as the ticket being done.

A ruling the body leaves open is asked now with `AskUserQuestion`, before any edit.

A ruling that reopens the plan (a different interface, a different level to solve it at) goes back to planning: comment the question on the ticket, send it back per the `tracker` skill, then hand it off per the `herdr` skill's plan case (a new tab alongside this one when inside Herdr, otherwise tell the user to run `/plan <n>`), and stop this build.

A ticket labelled `spike` ships no code: run the probe, post the findings as a comment, delete the probe, and stop.

## 2. Claim it

Claim the ticket, find its board item, and set its Status to `In Progress`, per the `tracker` skill.

## 3. Orient

1. Read `.claude/product.md` and `.claude/architecture.md`, then the files the ticket's **Where** and **Sibling** name, whole.
2. Load the expert skill under `~/.claude/skills/<domain>/` for the ticket's domain. `.claude/rules/code.md` is already in your context; it governs the diff.
3. Run the repo's test command once. A red baseline is not yours to fix: note it in the first PR and continue.
4. Plan the layers. The happy path on `main` keeps working at every merge; that is what the plan protects.
   - Under 200 added lines in total: one PR, code, docstrings and docs together, no plan comment. Skip to step 4 with one layer and fold step 5 into it.
   - At 200 or more: a stack. The new path is built behind one flag, the repo's own config or option mechanism when it has one, else an environment variable named `<REPO>_<FEATURE>=1`. The old path is untouched until the enable layer.
   - Each layer sizes to one PR, roughly 100 to 1000 added lines, and carries its own docstrings.
   - Every Done when case runs end to end with the flag on, from the first layer that can serve it.
   - The last code layer is **enable**: the flag and the old path are deleted, the cases run without the flag. A stack that ends without it is a stop condition.
   - The last layer is **docs**, its own PR whatever its size.
5. Post the plan as a comment on the ticket before the first edit:

```markdown
## Layers

Flag: `<REPO>_<FEATURE>=1`

1. L1 - <what lands> - <the Done when cases it covers>
2. L2 - <what lands> - <cases>
3. enable - flag and old path deleted - every case without the flag
4. docs - README, docs/, architecture done, product.md swept, examples re-run
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

The last layer, its own PR in a stack and the same PR in a single-PR ticket, written after every code layer passed review:

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

Each is a question to the user, asked with `AskUserQuestion`, with the stack so far named. The goal line's open-question branch lets the turn end on it. An answer of "plan it" is the `needs-planning` handoff in step 1.

- A fix that fails twice after a real diagnosis: both diagnoses and the second fix.
- A file needed outside the ticket's **Where** folder, or a review finding that reaches outside it.
- A layer that cannot leave the program working on its own.
- A stack about to end without its enable layer.
- The stack no longer serves the ticket or the roadmap.

## When a layer cannot be built

A merged layer is never unwound; it left the program working. Only open drafts close.

**The broken part is severable** - it can be its own line of work while the rest of the ticket still serves. Ask "branch it, or stop?" with the finding named. On "branch it":

1. File a ticket for the broken part per the `tracker` skill: the findings so far, the Done when cases it takes with it, `--blocked-by` this ticket.
2. Amend this ticket: those cases move to the new ticket, and the plan comment gains the change.
3. Close the broken layer's draft with a comment naming the new ticket, and delete its branch.
4. Continue with every layer that does not need it, enable and docs included. The docs PR closes this ticket on what it still covers.

**The premise is false and nothing severs** - no question. In one turn:

1. Comment on the ticket: the findings, what they break, and the recommendation, rescope or close, with the merged layers named.
2. Close every open draft in the stack.
3. Label the ticket `needs-planning`, per the `tracker` skill.
4. Report the build as impossible to complete and stop. The user runs `/plan <n>` or closes it; nothing closes on its own.
