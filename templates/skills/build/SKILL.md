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
6. Compile the assumptions before any edit: every premise that the ticket and the planned change rest on. Write each as `<premise> - checked: <file:line or doc section>` into the ticket's `## Assumptions`. A premise that fails on behaviour or shape sends the ticket back to planning, per step 1.4; a count that moved since planning never does. Check each one against current `main`:
   - the docs and rules that the project's `CLAUDE.md` names under where things live;
   - the code's established practice: the **Sibling**, every caller of a changed signature, and the pattern that the nearest code already follows.
7. Claim the ticket and set its board Status to `In Progress`.

## 2. Plan the layers

1. Read the project's `CLAUDE.md` for where docs, rules and tests live, then the docs and rules it names that the ticket touches, and the files that the ticket's **Where** and **Sibling** name.
2. With a prototype, read its diff and its stubs, listed per the `tracker` skill, first: its tests are the contract, its code is a draft the build may rewrite, and each stub is work a layer designs.
3. Split the work into layers, docs last. Without the `stack` label, every layer is commits on the planning PR, whatever the size. With it, every layer is its own PR, stacked on the planning PR.
4. Make each layer leave the program working: `main` would work if the build stopped after it.
5. Follow the ticket's **Gating** line: with `none`, build without a flag. Otherwise gate at construction: the orchestrator passes a parameter, or chooses which class to construct, and a step never reads a flag. When the change cannot be isolated that way, copy the step or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag. Before a gate's default flips, run the whole suite under the new default.
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
8. When two shapes both serve the ticket and which is better is unclear, such as the faster one or the cleaner code design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per shape, one after the other, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, build the simpler shape. A choice the ticket, the docs or the nearest code already settles is no judgement call; try nothing else.
9. A build never widens scope. Work that the ticket does not name, however close, is offered to the user as a new ticket and left out of every layer, except what **Code rules** brings in.

## 3. Build each layer

Before the first file edit, start the build branch per the `tracker` skill's PRs: from the prototype when the ticket has one, else from the planning branch. A `stack` ticket instead starts each layer's branch per Stacked PRs: the first from the prototype or the planning branch, each later one from the layer below.

For every layer, in order:

1. Before each commit, check that `git branch --show-current` names the branch this layer commits on.
2. List every file the layer will touch, and read each one whole with `Read`, once, before the first edit. Read a file again only after it changed. Then make the edits per the code rules in `~/.claude/rules/code.md`, and their tests, with the tests the change reaches run after each change. Delete the docstring of each unit an edit changes before making the edit, and write a new one after it, from the unit's code and from where the unit is used outside the tests: the old text is not a draft and not a source. Then search the code outside the tests for each caller and each term the new docstring names, and cut what the search does not find. Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
3. Run the repo's format check, lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run the three commands again. Publish the layer (step 3.4) only when all three pass.
4. Push the layer onto the planning PR per the `tracker` skill's PRs. After the first layer, give that PR the ticket's title and a body per the `tracker` skill, and mark it ready for review. A `stack` ticket instead publishes the layer as its own PR, ready for review, links it onto the stack, and after the first layer marks the planning PR ready.
5. Publish or republish the build-story `Artifact` (same file path): one section per layer, under the plan comment's headings, with a flowchart or a gantt chart of what changed and a before/after example under Solution. A UI layer embeds screenshots.

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

1. Review the build's diff for complexity that crept in beyond the ticket's **Grade**, and simplify it, on the branch of the layer that owns it for a `stack` ticket.
2. Call `advisor` on the finished diff, and fix what it finds.
3. Run every Implementation-criteria case and paste each real output into the PR's **Solution**; a `stack` ticket pastes into the top PR. A failing case goes back to step 3: fix it, on the layer's branch and with a rebase of the stack for a `stack` ticket, and run every case again. Go on to step 6.4 only when every case passes and the `tracker` skill's stub list prints nothing.
4. Republish the artifact with the docs section.
5. Report the PR URL (a `stack` ticket: the bottom PR's) and the artifact URL, and offer `/retro` in one line, naming the workflow change that would have prevented the complexity found in step 6.1.
6. Merge on the user's go-ahead, which stands for later builds in the session until it is withdrawn, per the `tracker` skill.

## Code rules

Write code per `~/.claude/rules/code.md` and per the rule file of the code's language. These lines place those rules in a build:

- They apply behind the seam the ticket names.
- Code the ticket touches is brought to them, and a threshold reaches the function the ticket changes; code beyond that is offered as its own ticket.
- A class split that changes an interface the ticket does not name goes back to planning, per step 1.4.
- They hold at every **Grade**: their structure is never the complexity that step 6.1 removes.

## Several tickets

Several tickets named together are built in the order given, one PR each:

1. Run the whole checklist for one ticket on its own planning PR, then start the next.
2. When a later ticket's code needs an earlier one's, bring the earlier ticket's planning branch into the later build branch before its first edit. The later PR's diff shows the earlier commits until the earlier PR merges.
3. Tickets never stack onto each other; a ticket labelled `stack` stacks only its own layers, on its own planning PR.
4. A test watcher started for the first ticket keeps running for the rest.
5. When a question to the user would stop a ticket, at step 1.3, step 1.4 or a stop condition, post it as a ticket comment, commit and push the work so far, park the ticket, and build the next unblocked ticket. Once no unblocked ticket is left, ask every parked question with `AskUserQuestion`, calls back to back, and resume each parked ticket once its question is answered. A ticket sent back to planning is not resumed.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.
- A review the goal adds beyond step 4, such as an independent validator, runs once per ticket against its Implementation criteria, and runs again only when a criterion failed.
- When the goal text has no branch that lets a turn end on an open question, say so in the first reply and give the goal line from the `tickets` skill to set instead.

## Stop conditions

Ask with `AskUserQuestion`, naming the PR and the layers pushed so far:

- A fix fails twice after a real diagnosis. Give both diagnoses.
- A layer cannot leave the program working on its own.
- The layer plan no longer serves the ticket.
- The change breaks something outside the ticket. Name it in one line and offer its fix as its own ticket; never absorb it into a layer.

A broken part that can be its own work: on the user's "branch it", file it as a ticket `--blocked-by` this one, move its cases there, revert its commits (a `stack` ticket closes its PR), and continue. A false premise that nothing severs: comment the findings, revert the build's commits on the planning PR (a `stack` ticket closes its layer PRs), send the ticket back to planning, and stop.
