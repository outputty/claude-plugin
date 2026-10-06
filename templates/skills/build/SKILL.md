---
name: build
description: Builds one ticket, or several in order, to one stack of PRs ready for review, one layer each, docs last, in this session's worktree. Use as /build followed by one or more ticket numbers, or as the procedure a /goal for those tickets follows.
argument-hint: "<number> [<number>...]"
---

# build - one ticket, one stack

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

When the user names several tickets, build them in that order as one stack, per **Several tickets** below.

Copy this checklist into your first reply and tick each item as it lands:

```
- [ ] 1. Read and claim
- [ ] 2. Plan the layers
- [ ] 3. Build each layer
- [ ] 4. Review once
- [ ] 5. Docs layer
- [ ] 6. Finish
```

## 1. Read and claim

1. Read the ticket: body, labels, comments. The end state is its **Implementation criteria**; each checkable case is a command you run before finishing.
2. Build the seam that the ticket's `## Solution` names; add none. Find the ticket's **Planning PR**: every layer stacks on it.
3. Ask any ruling the body leaves open with `AskUserQuestion` before the first edit.
4. A ruling that changes the interface or the level of the fix goes back to planning per the `tracker` skill. Tell the user to run `/plan <n>`, and stop.
5. A ticket labelled `spike` ships no code: run the probe, comment the findings, stop.
6. Compile the assumptions before any edit: every premise that the ticket and the planned change rest on. Write each as `<premise> - checked: <file:line or doc section>` into the ticket's `## Assumptions`. A premise that fails on behaviour or shape sends the ticket back to planning, per step 4; a count that moved since planning never does. Check each one against current `main`:
   - `.claude/architecture.md`, `.claude/product.md` and the other `.claude/` docs;
   - the code's established practice: the **Sibling**, every caller of a changed signature, and the pattern that the nearest code already follows.
7. Claim the ticket and set its board Status to `In Progress`.

## 2. Plan the layers

1. Read `.claude/product.md`, `.claude/architecture.md`, and the files that the ticket's **Where** and **Sibling** name.
2. Under 200 added lines: one PR with code and docs together, on the planning PR. At 200 or more: a stack on the planning PR, one PR per layer, docs last.
3. Make each layer deployable on its own: `main` works after it merges.
4. Follow the ticket's **Gating** line: with `none`, build without a flag.
5. Post the plan as a ticket comment, in this shape and nothing else. Add `Flag: <FLAG_NAME>` under Solution when the ticket is gated.

````markdown
## Problem

<the problem, as this stack will solve it, in one line>

## Assumptions

- <premise> - checked: <how> | not checked

## Solution

```lang
<the call the user writes> // <the output once every layer lands>
```

1. L1 - <what lands> - <cases it serves>
2. L2 - <what lands> - <cases it serves>
3. docs - <the docs this stack changes>

## Attempted

None.

## Next

L1 starts now.
````

6. Call `advisor` before the first edit.
7. Start the repo's test suite in watch mode in the background (the repo's own watcher, or Wallaby where the repo uses it). Read its output after every change, and keep it green.

## 3. Build each layer

For every layer, in order:

1. Start the layer per the `tracker` skill's Stacked PRs before its first file edit: the first layer from the planning branch, each later one from the layer below. Before each commit, check that `git branch --show-current` names this layer's branch.
2. Write the code and its tests. Commit each chunk with its test once the watcher shows it green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
3. Run the repo's lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run both commands again. Publish the layer (item 4) only when both pass.
4. Publish the layer as its own PR, ready for review, its body per the `tracker` skill, and link it onto the stack. After the first layer, mark the planning PR ready.
5. Publish or republish the build-story `Artifact` (same file path, so the URL stays fixed): one section per layer, under the same five headings as the plan comment, with a call-stack graph of what changed and a before/after example under Solution. A UI layer embeds screenshots.

A UI ticket starts the dev or preview server with `--host 0.0.0.0` before the first edit, restarts it after each UI commit, and prints its LAN URL. Show a screenshot or mock before changing a page's look.

## 4. Review once

After the last code layer, invoke `code-review` with effort `high` and `--fix` over the whole stack, and pass the ticket's assumption list in its arguments: `high --fix Assumptions to verify against the diff: A1 - <premise>. A2 - <premise>.` A finding that breaks an assumption is fixed before the docs layer. Before accepting a fix that changes behaviour, check it against `.claude/product.md`. Commit each fix on the branch of the layer that owns the file, rebase the stack per the `tracker` skill's Stacked PRs, and typecheck every layer.

## 5. Docs layer

1. Use the `documentation` skill for README and `docs/` changes.
2. `architecture.md`: delete the `pending #<n>` marker, and rewrite what the stack changed.
3. `product.md`: rewrite each section whose behaviour changed.
4. `examples.md`: re-run each block whose output changed, and paste the real output.
5. `roadmap.md`: delete the ticket's **Next** line. A gated ticket adds its flag under **Open gates**; a ticket that promotes or drops a gate deletes that line.
6. `CLAUDE.md` **Language**: fix any term the stack made stale.
7. Each doc this layer touched: bring its `## Contents` list in step with its `##` headings.

## 6. Finish

1. Run every Implementation-criteria case and paste each real output into the last PR's **Solution**. A failing case goes back to step 3 on the branch of the layer that owns it: fix it, rebase the stack, and run every case again. Go on to step 6.2 only when every case passes.
2. Republish the artifact with the docs section, then call `advisor`.
3. Report the bottom PR URL and the artifact URL, and offer `/retro` in one line.
4. Merge only when the user types "merge", per the `tracker` skill.

## Several tickets

Several small tickets named together become one stack, built in the order given:

1. Stack every ticket's planning PR first, in the given order, per the `tracker` skill: the first ticket's is the bottom, and each later one is rebased onto the one below. Resolve a conflict between two planning PRs by keeping both changes.
2. Run steps 1 to 3 per ticket, in order: compile and check its assumptions, claim it, post its plan comment, and build its layers. The first ticket's first layer starts from the last planning branch; every later layer starts from the layer below.
3. Skip step 4 and step 5 per ticket. After the last ticket's last code layer, run step 4 once over the whole stack with every ticket's assumptions, then step 5 once for every ticket together.
4. In step 6, run every ticket's Implementation-criteria cases. The top PR's body names `Closes #<n>` once per ticket.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`. The session cannot clear its own goal.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.

## Stop conditions

Ask with `AskUserQuestion`, naming the stack so far:

- A fix fails twice after a real diagnosis. Give both diagnoses.
- A layer cannot leave the program working on its own.
- The stack no longer serves the ticket.
- The change breaks something outside the ticket. Name it in one line and offer its fix as its own PR; never absorb it into a layer.

A broken part that can be its own work: on the user's "branch it", file it as a ticket `--blocked-by` this one, move its cases there, close its PR, and continue. A false premise that nothing severs: comment the findings, close the open PRs, send the ticket back to planning, and stop.
