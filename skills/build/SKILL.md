---
name: build
description: Builds one ticket, or several in order, to one PR per ticket ready for review, docs last, in this session's worktree; a ticket labelled stack gets one stacked PR per layer instead. Use as /build followed by one or more ticket numbers, or as the procedure a /goal for those tickets follows.
argument-hint: "<number> [<number>...]"
---

# build - one ticket, one PR

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

A ticket lands as one PR: its planning PR, with every layer's commits pushed onto it. Only a ticket labelled `stack` lands as one PR per layer; the user sets that label at planning, and the build never infers it from size.

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

1. Read the ticket: body, labels, comments. Its **Implementation criteria** are the end state.
2. Build the seam that the ticket's `## Solution` names; add none. Find the ticket's **Planning PR** and its `Prototype:` comment per the `tracker` skill.
3. Ask any ruling the body leaves open with `AskUserQuestion` before the first edit.
4. A ruling that changes the interface or the level of the fix, or a class split that changes an interface the ticket does not name, goes back to planning per the `tracker` skill. Tell the user to run `/plan <n>`, and stop.
5. A ticket labelled `spike` is the user's ask for a spike: run it, comment the findings, ship no code, and stop.
6. Before any edit, write each premise the ticket and the planned change rest on into the ticket's `## Assumptions` as `<premise> - checked: <file:line or doc section>`. Check each against current `main`: the docs and rules the project's `CLAUDE.md` names, the **Sibling**, every caller of a changed signature, and the pattern the nearest code follows. A premise that fails on behaviour or shape sends the ticket back to planning, per step 1.4; a count that moved since planning never does.
7. Claim the ticket and move it to `In Progress` per the `tracker` skill.

## 2. Plan the layers

1. Read the docs and rules the project's `CLAUDE.md` names for what the ticket touches, and the files the ticket's **Where** and **Sibling** name.
2. With a prototype, read its diff and its stubs first, listed per the `tracker` skill: its tests are the contract, its code is a draft the build may rewrite, and each stub is work a layer designs.
3. Split the work into layers, docs last.
4. Make each layer leave the program working: `main` would work if the build stopped after it.
5. Follow the ticket's **Gating** line: with `none`, build without a flag. Otherwise gate at construction: the orchestrator passes a parameter, or chooses which class to construct, and a step never reads a flag. When the change cannot be isolated that way, copy the step or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag. Before a flag's default flips, run the tests of every path it gates.
6. Post the plan as a ticket comment, in the shape of `references/plan-comment.md`.
7. Call `advisor` before the first edit.
8. When two shapes both serve the ticket and which is better is unclear, such as the faster one or the cleaner code design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per shape, one after the other, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, build the simpler shape. A choice the ticket, the docs or the nearest code already settles is no judgement call; try nothing else.
9. A build never widens scope. Work that the ticket does not name, however close, is offered to the user as a new ticket and left out of every layer, except what **Code rules** brings in.

## 3. Build each layer

Before the first file edit, start the build branch per the `tracker` skill's PRs: from the prototype when the ticket has one, else from the planning branch. A `stack` ticket starts each layer's branch per Stacked PRs.

For every layer, in order:

1. Before each commit, check that `git branch --show-current` names the branch this layer commits on.
2. List every file the layer will touch, and read each one whole with `Read`, once, before the first edit; never page through a file with `sed` or `rg`. Read a file again only after it changed.
3. Make the edits per the code rules in `~/.claude/rules/code.md`, with their tests, and run the tests the change reaches after each change.
   - Delete the docstring of each unit an edit changes before making the edit, and write a new one after it, from the unit's code and from where the unit is used outside the tests: the old text is not a draft and not a source. Then search the code outside the tests for each caller and each term the new docstring names, and cut what the search does not find.
   - Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
4. Run the repo's format check, lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run the three again. Publish the layer only when all three pass.
5. Push the layer onto the planning PR per the `tracker` skill's PRs, which also give that PR its title and body after the first layer. A `stack` ticket publishes the layer as its own PR per Stacked PRs.
6. Publish or republish the build-story `Artifact` (same file path): one section per layer, under the plan comment's headings, with a flowchart or a gantt chart of what changed and a before/after example under Solution. A UI layer embeds screenshots.

A UI ticket starts the dev or preview server with `--host 0.0.0.0` before the first edit and prints its LAN URL. Show a screenshot or mock before changing a page's look.

## 4. Review once

- After the last code layer, invoke the built-in `/code-review` with effort `high` and `--fix` over the whole build, with the ticket's assumption list: `high --fix Assumptions to verify against the diff: A1 - <premise>. A2 - <premise>.`
- No other review skill, agent or tab runs, except a review the goal adds, such as an independent validator: it runs once per ticket against its Implementation criteria, and again only when a criterion failed.
- Fix a finding that breaks an assumption before the docs layer. Before accepting a fix that changes behaviour, check it against the user docs the project's `CLAUDE.md` names.
- Commit each fix on the build branch and push it. A `stack` ticket commits each fix on the branch of the layer that owns the file, rebases the stack per the `tracker` skill's Stacked PRs, and typechecks every layer.

## 5. Docs layer

1. Use the `documentation` skill. Rewrite each user doc that the project's `CLAUDE.md` names whose behaviour the build changed, and re-run each snippet whose output changed, pasting the real output.
2. Delete the ticket's entry from the not-built-yet doc that `CLAUDE.md` names, and write what the build delivered into the doc a user relies on.
3. `CLAUDE.md` **Language**: fix any term the build made stale.

## 6. Finish

1. Review the build's diff for complexity that crept in beyond the ticket's **Grade**, and simplify it, on the branch of the layer that owns it for a `stack` ticket.
2. Call `advisor` on the finished diff, and fix what it finds.
3. Run every Implementation-criteria case and paste each real output into the PR's **Solution** (a `stack` ticket: the top PR). A failing case goes back to step 3, and every case runs again. Go on only when every case passes and the `tracker` skill's stub list prints nothing.
4. Republish the artifact with the docs section.
5. Report the PR URL (a `stack` ticket: the bottom PR's) and the artifact URL, and offer `/retro` in one line, naming the workflow change that would have prevented the complexity found in step 6.1.
6. Merge on the user's go-ahead, per the `tracker` skill.

## Code rules

Write code per `~/.claude/rules/code.md` and per the rule file of the code's language. In a build:

- Code the ticket touches is brought to them, and a threshold reaches the function the ticket changes; code beyond that is offered as its own ticket.
- They hold at every **Grade**: their structure is never the complexity that step 6.1 removes.

## Several tickets

Several tickets named together are built in the order given: the whole checklist for one ticket on its own planning PR, then the next.

1. When a later ticket's code needs an earlier one's, bring the earlier ticket's planning branch into the later build branch before its first edit.
2. A ticket labelled `stack` stacks its own layers on its own planning PR. Whether tickets stack onto each other follows the user's instruction; without one, each ticket is its own PR.
3. When a question to the user would stop a ticket, at step 1.3, step 1.4 or a stop condition, post it as a ticket comment, commit and push the work so far, park the ticket, and build the next unblocked ticket. Once no unblocked ticket is left, ask every parked question with `AskUserQuestion`, calls back to back, and resume each parked ticket once its question is answered. A ticket sent back to planning is not resumed.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.
- When the goal text has no branch that lets a turn end on an open question, say so in the first reply and give the goal line from the `tickets` skill to set instead.

## Stop conditions

Ask with `AskUserQuestion`, naming the PR and the layers pushed so far:

- A fix fails twice after a real diagnosis. Give both diagnoses.
- A layer cannot leave the program working on its own.
- The layer plan no longer serves the ticket.
- The change breaks something outside the ticket. Name it in one line and offer its fix as its own ticket; never absorb it into a layer.

A broken part that can be its own work: on the user's "branch it", file it as a ticket blocked by this one per the `tracker` skill, move its cases there, revert its commits (a `stack` ticket closes its PR), and continue. A false premise that nothing severs: comment the findings, revert the build's commits on the planning PR (a `stack` ticket closes its layer PRs), send the ticket back to planning, and stop.
