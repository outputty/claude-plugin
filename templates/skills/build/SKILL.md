---
name: build
description: Builds one GitHub ticket to a stack of draft PRs, one layer each, docs last, in this session's worktree. Use as /build <number>, or as the procedure a /goal for a ticket follows.
---

# build - one ticket, one stack

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

## 1. Read and claim

1. Read the ticket: body, labels, comments. The end state is its **Implementation criteria**; each checkable case is a command you run before finishing.
2. If the planning session left a scratch file or spike for this ticket, read it; build that shape.
3. Ask any ruling the body leaves open with `AskUserQuestion` before the first edit.
4. A ruling that changes the interface or the level of the fix goes back to planning: comment the question, label the ticket `needs-planning`, tell the user to run `/plan <n>`, and stop.
5. A ticket labelled `spike` ships no code: run the probe, comment the findings, stop.
6. Claim the ticket and set its board Status to `In Progress`.

## 2. Plan the layers

1. Read `.claude/product.md`, `.claude/architecture.md`, and the files that the ticket's **Where** and **Sibling** name. Run the test command once; a red baseline goes in the first PR body.
2. Under 200 added lines: one PR with code and docs together. At 200 or more: a stack, one draft PR per layer, docs last.
3. Keep `main` working after every merge. Put the new path behind a flag only when a layer would otherwise break it.
4. Post the plan as a ticket comment: the end-to-end example the stack delivers, then one line per layer naming its job and the cases it serves.
5. Call `advisor` before the first edit.

## 3. Build each layer

For every layer, in order:

1. Run `gh stack add <branch>` before the layer's first file edit. Before each commit, check that `git branch --show-current` names this layer's branch.
2. Write the code and its tests. Commit each green chunk with its test: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
3. Run the repo's test, lint and typecheck commands.
4. Publish the layer as a draft PR from `.github/PULL_REQUEST_TEMPLATE.md`. Only the last layer's body carries `Closes #<n>`.
5. Publish or republish the build-story `Artifact` (same file path, so the URL stays fixed): one section per layer, with its job, a call-stack graph of what changed, and a before/after example. A UI layer embeds screenshots.

A UI ticket starts the dev or preview server with `--host 0.0.0.0` before the first edit, restarts it after each UI commit, and prints its LAN URL. Show a screenshot or mock before changing a page's look.

## 4. Review once

After the last code layer, invoke `code-review` with effort `high` and `--fix` over the whole stack. Commit each fix on the branch of the layer that owns the file, rebase the stack, and typecheck every layer.

## 5. Docs layer

1. Use the `documentation` skill for README and `docs/` changes.
2. `architecture.md`: delete the `pending #<n>` marker, and rewrite what the stack changed.
3. `product.md`: rewrite each section whose behaviour changed.
4. `examples.md`: re-run each block whose output changed, and paste the real output.
5. `roadmap.md`: delete the ticket's **Next** line.
6. `CLAUDE.md` **Language**: fix any term the stack made stale.

## 6. Finish

1. Run every Implementation-criteria case and paste each real output into the last PR's **What this looks like**.
2. Republish the artifact with the docs section, then call `advisor`.
3. Report the bottom PR URL and the artifact URL.
4. Merge only when the user types "merge": run `gh stack merge`. A merge to a branch that deploys is the user's call in this session.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`. The session cannot clear its own goal.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.

## Stop conditions

Ask with `AskUserQuestion`, naming the stack so far:

- A fix fails twice after a real diagnosis. Give both diagnoses.
- A layer cannot leave the program working on its own.
- The stack no longer serves the ticket.

A broken part that can be its own work: on the user's "branch it", file it as a ticket `--blocked-by` this one, move its cases there, close its draft, and continue. A false premise that nothing severs: comment the findings, close the open drafts, label the ticket `needs-planning`, and stop.
