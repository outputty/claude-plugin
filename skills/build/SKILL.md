---
name: build
description: Builds one ticket, or several in order, to one PR per ticket ready for review, docs last, in this session's worktree; a ticket labelled stack gets one stacked PR per layer instead. Use as /outputty:build followed by one or more ticket numbers, or as the procedure a /goal for those tickets follows.
argument-hint: "<number> [<number>...]"
---

# build

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

A ticket lands as one PR: its planning PR, with every layer's commits pushed onto it. Only a ticket labelled `stack` lands as one PR per layer; the user sets that label at planning.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read the ticket: body, labels, comments. Its **Implementation criteria** are the end state.
  - Build the seam that the ticket's `## Solution` names; add none. Find the ticket's **Planning PR** and its `Prototype:` comment per the `tracker` skill.
  - Ask any ruling the body leaves open with `AskUserQuestion`, four per call, before the first edit.
  - Stop at a ruling that changes the interface or the level of the fix, or a class split that changes an interface the ticket does not name: it goes back to planning per the `tracker` skill. Tell the user to run `/outputty:plan <n>`.
  - Stop at a ticket labelled `spike`: run it, comment the findings, ship no code.
  - Find the ticket's **How to validate**. When it has none, work one out with the user through `AskUserQuestion`, four per call, before the first edit. Run its today-check before the first edit; when the problem does not show, stop and ask the user.
- [ ] 2. Before any edit, write each premise the ticket and the planned change rest on into the ticket's `## Assumptions` as `<premise> - checked: <file:line or doc section>`. Check each against current `main`: the docs and rules the project's `CLAUDE.md` names, the **Sibling**, every caller of a changed signature, and the pattern the nearest code follows.
  - A premise that fails on behaviour or shape sends the ticket back to planning, per step 1; a count that moved since planning never does.
- [ ] 3. Claim the ticket and move it to `In Progress` per the `tracker` skill.
- [ ] 4. Read the docs and rules the project's `CLAUDE.md` names for what the ticket touches, and the files the ticket's **Where** and **Sibling** name.
  - With a prototype, read its diff and its stubs first, listed per the `tracker` skill: its tests are the contract, its code is a draft the build may rewrite, and each stub is work a layer designs.
- [ ] 5. Split the work into layers, docs last, each leaving the program working: `main` would work if the build stopped after it.
- [ ] 6. Follow the ticket's **Gating** line: with `none`, build without a flag. Otherwise gate at construction: the orchestrator passes a parameter, or chooses which class to construct, and a step never reads a flag. When the change cannot be isolated that way, copy the step or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag. Before a flag's default flips, run the tests of every path it gates.
- [ ] 7. Post the plan as a ticket comment, in the shape of [references/plan-comment.md](references/plan-comment.md).
- [ ] 8. Call `advisor` before the first edit.
- [ ] 9. When two shapes both serve the ticket and which is better is unclear, such as the faster one or the cleaner code design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per shape, one after the other, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, build the simpler shape. A choice the ticket, the docs or the nearest code already settles is no judgement call; try nothing else.
- [ ] 10. Start the build branch per the `tracker` skill's PRs: from the prototype when the ticket has one, else from the planning branch. A `stack` ticket starts each layer's branch per Stacked PRs.
- [ ] 11. For every layer, in order, check before each commit that `git branch --show-current` names the branch this layer commits on.
  - List every file the layer will touch, and read each one whole with `Read`, once, before the first edit; read a file again only after it changed.
  - Make the edits per the code rules in `~/.claude/rules/code.md`, with their tests, and run the tests the change reaches after each change.
  - Delete the docstring of each unit an edit changes before making the edit, and write a new one after it, from the unit's code and from where the unit is used outside the tests: the old text is not a draft and not a source. Then search the code outside the tests for each caller and each term the new docstring names, and cut what the search does not find.
  - Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
  - Run the repo's format check, lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run the three again, and publish the layer only when all three pass.
  - Push the layer onto the planning PR per the `tracker` skill's PRs, which also give that PR its title and body after the first layer. A `stack` ticket publishes the layer as its own PR per Stacked PRs.
  - Stop and ask with `AskUserQuestion`, four per call, naming the PR and the layers pushed so far, when a fix fails twice after a real diagnosis (give both diagnoses), a layer cannot leave the program working on its own, the layer plan no longer serves the ticket, or the change breaks something outside the ticket (name it in one line and offer its fix as its own ticket; never absorb it into a layer).
  - On the user's "branch it" for a broken part that can be its own work: file it as a ticket blocked by this one per the `tracker` skill, move its cases there, revert its commits (a `stack` ticket closes its PR), and continue.
  - On a false premise that nothing severs: comment the findings, revert the build's commits on the planning PR (a `stack` ticket closes its layer PRs), send the ticket back to planning, and stop.
  - Publish or republish the build-story `Artifact` (same file path): one section per layer, under the plan comment's headings, with a flowchart or a gantt chart of what changed and a before/after example under Solution. A UI layer embeds screenshots.
- [ ] 12. After the last code layer, invoke the built-in `/code-review` with effort `high` and `--fix` over the whole build, with the ticket's assumption list: `high --fix Assumptions to verify against the diff: A1 - <premise>. A2 - <premise>.`
  - Fix a finding that breaks an assumption before the docs layer, and commit and push each fix. Before accepting a fix that changes behaviour, check it against the user docs the project's `CLAUDE.md` names.
  - A `stack` ticket commits each fix on the branch of the layer that owns the file, rebases the stack per the `tracker` skill's Stacked PRs, and typechecks every layer.
- [ ] 13. Docs layer: use the `documentation` skill. Rewrite each user doc that the project's `CLAUDE.md` names whose behaviour the build changed, and re-run each snippet whose output changed, pasting the real output.
  - Delete the ticket's entry from the not-built-yet doc that `CLAUDE.md` names, and write what the build delivered into the doc a user relies on.
  - Fix any `CLAUDE.md` **Language** term the build made stale.
- [ ] 14. Review the build's diff for complexity that crept in beyond the ticket's **Grade**, and simplify it, on the branch of the layer that owns it for a `stack` ticket.
- [ ] 15. Call `advisor` on the finished diff, and fix what it finds.
- [ ] 16. Run every Implementation-criteria case and the ticket's **How to validate** built-check, and paste each real output into the PR's **Solution** (a `stack` ticket: the top PR). A failing case goes back to step 11, and every case runs again.
  - Go on only when every case passes and the `tracker` skill's stub list prints nothing.
- [ ] 17. Republish the artifact with the docs section.
- [ ] 18. Report in the shape of [references/report.md](references/report.md), and offer `/outputty:retro` in one line, naming the workflow change that would have prevented the complexity found in step 14.
- [ ] 19. Merge on the user's go-ahead, per the `tracker` skill.

## Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.
- When the goal text has no branch that lets a turn end on an open question, say so in the first reply and give the goal line from the `tickets` skill to set instead.

## Several tickets

Several tickets named together are built in the order given: the whole checklist for one ticket on its own planning PR, then the next.

- When a later ticket's code needs an earlier one's, bring the earlier ticket's planning branch into the later build branch before its first edit.
- A ticket labelled `stack` stacks its own layers on its own planning PR. Whether tickets stack onto each other follows the user's instruction; without one, each ticket is its own PR.
- When a question to the user would stop a ticket, at step 1 or a stop condition, post it as a ticket comment, commit and push the work so far, park the ticket, and build the next unblocked ticket. Once no unblocked ticket is left, ask every parked question with `AskUserQuestion`, four per call, calls back to back, and resume each parked ticket once its question is answered. A ticket sent back to planning is not resumed.

## Do

- Write code per `~/.claude/rules/code.md` and per the rule file of the code's language. Code the ticket touches is brought to them, and a threshold reaches the function the ticket changes; code beyond that is offered as its own ticket.
- Keep the code rules at every **Grade**: their structure is never the complexity that step 14 removes.
- Offer work the ticket does not name, however close, as a new ticket, and leave it out of every layer.
- Start the dev or preview server of a UI ticket with `--host 0.0.0.0` before the first edit, print its LAN URL, and show a screenshot or mock before changing a page's look.
- Run only the tests the change reaches.

## Don't

- Don't infer the `stack` label from size.
- Don't widen scope.
- Don't page through a file with `sed` or `rg` in place of reading it.
- Don't run another review skill, agent or tab beside `/code-review`, except a review the goal adds: an independent validator runs once per ticket against its Implementation criteria, and again only when a criterion failed.
- Don't check out the planning branch.

## Glossary

- **Layer** - one step of a build, chosen so the program works after it; the last layer is docs.
- **Seam** - the place in the code where new behaviour plugs in.
- **Sibling** - the existing code nearest to the requirement, which the build copies.
- **Gating** - the ticket's line saying whether the change ships behind a flag, and where it is constructed.
- **Grade** - the ticket's line saying how production-grade the work must be: quick and dirty, working, or production grade.
- **Where** - the ticket's line naming the folder that holds every caller, importer and re-export of each changed signature.
- **Planning PR** - the draft PR that carries the plan record and that the build lands on.
- **Spike** - one test case that proves or disproves an assumption.
- **`advisor`** - the stronger reviewer model a session can consult.
- **Build-story artifact** - the page a build session publishes about what it built.
- **Observable** - the measurement that decides between two shapes, such as run time.
- **Park** - leave a ticket with its question posted and build the next one.
- **Stop-hook turn** - a turn the `/goal` hook gives back because its condition does not hold yet.
- **Not-built-yet doc** - the doc the project's `CLAUDE.md` names for what is open.
- **`L<k>`** - layer number `k` in a commit title.
- **Stack** - one PR per layer on the planning PR, built only for a ticket labelled `stack`.
