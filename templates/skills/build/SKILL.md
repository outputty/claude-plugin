---
name: build
description: Builds one ticket, or several in order, to one PR per ticket ready for review, docs last, in this session's worktree; a ticket labelled stack gets one stacked PR per layer instead. Use as /build followed by one or more ticket numbers, or as the procedure a /goal for those tickets follows.
argument-hint: "<number> [<number>...]"
---

# build - one ticket, one PR

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

A ticket lands as one PR: its planning PR, with every layer's commits pushed onto it. Only a ticket labelled `stack` lands as a stack of PRs, one per layer; the user sets that label at planning, and the build never infers it from size.

When the user names several tickets, build them in that order, one PR each, per **Several tickets** below.

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
2. Build the seam that the ticket's `## Solution` names; add none. Find the ticket's **Planning PR**: the build lands on it. Find its prototype per the `tracker` skill: a `Prototype:` comment names a local branch the build continues.
3. Ask any ruling the body leaves open with `AskUserQuestion` before the first edit.
4. A ruling that changes the interface or the level of the fix goes back to planning per the `tracker` skill. Tell the user to run `/plan <n>`, and stop.
5. A ticket labelled `spike` ships no code: run the probe, comment the findings, stop.
6. Compile the assumptions before any edit: every premise that the ticket and the planned change rest on. Write each as `<premise> - checked: <file:line or doc section>` into the ticket's `## Assumptions`. A premise that fails on behaviour or shape sends the ticket back to planning, per step 4; a count that moved since planning never does. Check each one against current `main`:
   - the docs and rules that the project's `CLAUDE.md` names under where things live;
   - the code's established practice: the **Sibling**, every caller of a changed signature, and the pattern that the nearest code already follows.
7. Claim the ticket and set its board Status to `In Progress`.

## 2. Plan the layers

1. Read the project's `CLAUDE.md` for where docs, rules and tests live, then the docs and rules it names that the ticket touches, and the files that the ticket's **Where** and **Sibling** name.
2. With a prototype, read its diff and `rg -n "TODO: stub"` first: its tests are the contract, its code is a draft the build may rewrite, and each stub is work a layer designs.
3. Split the work into layers, docs last. Without the `stack` label, every layer is commits on the planning PR, whatever the size. With it, every layer is its own PR, stacked on the planning PR.
4. Make each layer leave the program working: `main` would work if the build stopped after it.
5. Follow the ticket's **Gating** line: with `none`, build without a flag.
6. Post the plan as a ticket comment, in this shape and nothing else. Add `Flag: <FLAG_NAME>` under Solution when the ticket is gated.

````markdown
## Problem

<the problem, as this build will solve it, in one line>

## Assumptions

- <premise> - checked: <how> | not checked

## Solution

```lang
<the call the user writes> // <the output once every layer lands>
```

1. L1 - <what lands> - <cases it serves>
2. L2 - <what lands> - <cases it serves>
3. docs - <the docs this build changes>

## Attempted

None.

## Next

L1 starts now.
````

7. Call `advisor` before the first edit.
8. A build never widens scope. Work that the ticket does not name, however close, is offered to the user as a new ticket and left out of every layer.

## 3. Build each layer

Before the first file edit, start the build branch per the `tracker` skill's PRs: from the prototype when the ticket has one, else from the planning branch. A `stack` ticket instead starts each layer's branch per Stacked PRs: the first from the prototype or the planning branch, each later one from the layer below.

For every layer, in order:

1. Before each commit, check that `git branch --show-current` names the branch this layer commits on.
2. List every file the layer will touch, and read them all in one pass. Then make the edits and their tests, and run the tests once. Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
3. Run the repo's lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run both commands again. Publish the layer (item 4) only when both pass.
4. Push the layer onto the planning PR per the `tracker` skill's PRs. After the first layer, give that PR the ticket's title and a body per the `tracker` skill, and mark it ready for review. A `stack` ticket instead publishes the layer as its own PR, ready for review, links it onto the stack, and after the first layer marks the planning PR ready.
5. Publish or republish the build-story `Artifact` (same file path, so the URL stays fixed): one section per layer, under the same five headings as the plan comment, with a call-stack graph of what changed and a before/after example under Solution. A UI layer embeds screenshots.

A UI ticket starts the dev or preview server with `--host 0.0.0.0` before the first edit, restarts it after each UI commit, and prints its LAN URL. Show a screenshot or mock before changing a page's look.

## 4. Review once

After the last code layer, invoke the built-in `/code-review` with effort `high` and `--fix` over the whole build; no other review skill, agent or tab runs, and pass the ticket's assumption list in its arguments: `high --fix Assumptions to verify against the diff: A1 - <premise>. A2 - <premise>.` A finding that breaks an assumption is fixed before the docs layer. Before accepting a fix that changes behaviour, check it against the user docs that the project's `CLAUDE.md` names. Commit each fix on the build branch and push it. A `stack` ticket commits each fix on the branch of the layer that owns the file, rebases the stack per the `tracker` skill's Stacked PRs, and typechecks every layer.

## 5. Docs layer

1. Use the `documentation` skill for README and `docs/` changes.
2. Read the project's `CLAUDE.md` for where docs live. Rewrite each user doc it names whose behaviour the build changed, and re-run each snippet in them whose output changed, pasting the real output.
3. Delete the ticket's entry from the not-built-yet doc that `CLAUDE.md` names, and rewrite what the build delivered into the doc a user relies on.
4. `CLAUDE.md` **Language**: fix any term the build made stale.
5. Each doc this layer touched: bring its `## Contents` list in step with its `##` headings, where it has one.

## 6. Finish

1. Run every Implementation-criteria case and paste each real output into the PR's **Solution**; a `stack` ticket pastes into the top PR. A failing case goes back to step 3: fix it, on the layer's branch and with a rebase of the stack for a `stack` ticket, and run every case again. Go on to step 6.2 only when every case passes and `rg -n "TODO: stub"` prints nothing.
2. Review the build's diff for complexity that crept in beyond the ticket's **Grade**, and simplify it, on the branch of the layer that owns it for a `stack` ticket.
3. Republish the artifact with the docs section, then call `advisor`.
4. Report the PR URL (a `stack` ticket: the bottom PR's) and the artifact URL, and offer `/retro` in one line, naming the workflow change that would have prevented the complexity found in step 2.
5. Merge only when the user types "merge", per the `tracker` skill.

## Several tickets

Several tickets named together are built in the order given, one PR each:

1. Run steps 1 to 6 for one ticket on its own planning PR, then start the next.
2. When a later ticket's code needs an earlier one's, merge the earlier ticket's planning branch into the later build branch before its first edit. The later PR's diff shows the earlier commits until the earlier PR merges.
3. Tickets never stack onto each other; a ticket labelled `stack` stacks only its own layers, on its own planning PR.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`. The session cannot clear its own goal.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.

## Stop conditions

Ask with `AskUserQuestion`, naming the PR and the layers pushed so far:

- A fix fails twice after a real diagnosis. Give both diagnoses.
- A layer cannot leave the program working on its own.
- The layer plan no longer serves the ticket.
- The change breaks something outside the ticket. Name it in one line and offer its fix as its own PR; never absorb it into a layer.

A broken part that can be its own work: on the user's "branch it", file it as a ticket `--blocked-by` this one, move its cases there, revert its commits (a `stack` ticket closes its PR), and continue. A false premise that nothing severs: comment the findings, revert the build's commits on the planning PR (a `stack` ticket closes its layer PRs), send the ticket back to planning, and stop.
