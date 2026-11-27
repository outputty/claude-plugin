---
name: build
description: "Builds one ticket, or several in order, to a PR ready for review, docs last. Use as /build with ticket numbers, when asked to build, implement or finish ticket #n, or under a /goal."
argument-hint: "<number> [<number>...]"
---

# build

`<n>` is the ticket number from `$ARGUMENTS` or the active goal. Build in the worktree this session launched in. Every ticket, board and PR command is in the `tracker` skill.

A ticket lands as one PR, with every layer's commits pushed onto it. Only a ticket labelled `stack` lands as one PR per layer; the user sets that label at planning.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read the ticket: body, labels, comments. Its **Implementation criteria** are the end state.
  - Among the buildable tickets, take the first whose body leaves no ruling open and has a **How to validate**.
  - Send a ticket back when its body leaves a ruling open, has no **How to validate**, or has a ruling that changes the call or the outputs its `## Solution` shows: label it `needs-planning` per the `tracker` skill, start a plan session for it per the `herdr` skill's Plan case with `/plan <n>`, ask the user nothing, and take the next ticket.
  - Stop at a ticket labelled `spike`: run it, comment the findings, ship no code.
  - Run the ticket's **How to validate** before the first edit.
- [ ] 2. Before any edit, write each premise the ticket and the planned change rest on into the ticket's `## Assumptions` as `<premise> - checked: <file:line or doc section>`. Check each against current `main`: the docs and rules the project's `CLAUDE.md` names, the **Sibling**, every caller of a changed signature, and the pattern the nearest code follows.
  - A premise that fails on behaviour or shape sends the ticket back to planning, per step 1; a count that moved since planning never does.
  - Run `git diff <Drafted against>..origin/main --stat` on the paths the ticket names, and note each as changed, unchanged or gone beside its premise.
- [ ] 3. Claim the ticket and move it to `In Progress` per the `tracker` skill.
- [ ] 4. Read the docs and rules the project's `CLAUDE.md` names for what the ticket touches. Find the **Sibling** and the seam, and read them.
  - With a prototype, read its diff and its stubs first, listed per the `tracker` skill: its tests are the contract, its code is a draft the build may rewrite, and each stub is work a layer designs.
- [ ] 5. Split the work into layers, docs last, each leaving the program working: `main` would work if the build stopped after it.
- [ ] 6. Follow the ticket's **Gating** line: with `none`, build without a flag. Otherwise gate at construction: the orchestrator passes a parameter, or chooses which class to construct, and a step never reads a flag. When the change cannot be isolated that way, copy the step or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag. Before a flag's default flips, run the tests of every path it gates.
- [ ] 7. Post the plan as a ticket comment, in the shape of [references/plan-comment.md](references/plan-comment.md).
  - Before you post it, check the plan against what the review will check, each answer from the ticket and from the docs and code you read in steps 2 and 4, and fix or cut the plan until every line has an answer. The answers stay in the comment under Solution as `Checks:`.
  - Commits: each planned commit does one action, with its why in one line, and none passes about 400 code lines.
  - Criteria: each Implementation criterion, with the code that makes it true and the test that proves its example output.
  - New: each file, export, type, dependency and flag the plan adds, with the ticket line or the sibling `file:line` it comes from; an item with neither is cut.
  - Removed: each file or export the plan deletes, with its ticket line or its named replacement.
  - Smallest: the files and functions of the smallest change that meets the criteria; an abstraction with one call site is inlined.
  - Rules: each documented rule the change touches, and how the plan keeps it.
  - Docs: each doc and **Language** term the change touches.
- [ ] 8. Decide whether the ticket can be actioned as written, from steps 1 to 7; call `advisor` before the first edit only when it cannot be decided, or the plan rests on a premise you could not check.
- [ ] 9. When two shapes both serve the ticket and which is better is unclear, such as the faster one or the cleaner code design, name the observable that would decide it and offer a trial. On the user's yes, run one trial fork per shape, each judged on that observable. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit. Cherry-pick the winning trial's commit from the branch its result names, and remove every fork's worktree. Without a yes, build the simpler shape. A choice the ticket, the docs or the nearest code already settles is no judgement call; try nothing else.
- [ ] 10. Start the build branch from the ticket's **Base** per the `tracker` skill's PRs. A `stack` ticket starts each layer's branch per Stacked PRs. Open each PR against the feature branch the prompt names (`Feature branch: <branch>`), and against `main` when it names none.
- [ ] 11. For every layer, in order, check before each commit that `git branch --show-current` names the branch this layer commits on.
  - List every file the layer will touch, and read each one whole with `Read`, once, before the first edit; read a file again only after it changed.
  - Make the edits per the code rules in `~/.claude/rules/outputty-code.md`, with their tests, and run the tests the change reaches after each change.
  - Once the tests prove a change works, read the whole function it sits in and simplify it: split it into an orchestrator and steps, flatten it with guard clauses, and keep each step, a command or a query, to as few jobs as possible, ideally one. Run the tests again.
  - Then read each caller of that function. When a change in the caller lets the function drop a check, a branch or a parameter, make the fix there instead and simplify the function again. A caller change that alters the call or the outputs the ticket's `## Solution` shows goes back to planning, per step 1.
  - Delete the docstring of each unit an edit changes before making the edit, and write a new one after it, from the unit's code and from where the unit is used outside the tests: the old text is not a draft and not a source. Then search the code outside the tests for each caller and each term the new docstring names, and cut what the search does not find.
  - Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits. Keep each commit to one action and, tests, documentation and snapshots aside, to about 400 lines of code: a cleanup is its own commit. Say why the change was made in one sentence under the title.
  - Run the repo's format check and lint commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run both again, and publish the layer only when both pass.
  - Put core functionality first: run the typecheck command and write type-level tests only after the last layer of the ticket, the last PR of a `stack`, unless the ticket is about aligning typechecks.
  - Push the layer per the `tracker` skill's PRs, which open the ticket's PR after the first layer. A `stack` ticket publishes the layer as its own PR per Stacked PRs, and links it into the stack on GitHub in the same turn.
  - Call `advisor` when a fix fails, before the next attempt.
  - When blocked, call `advisor` on the ticket, its Implementation criteria and the blocker. When it finds a part of the ticket that can ship, build that part, edit the ticket to what ships, file the rest as a `needs-planning` ticket with its criteria moved there and a line saying the build cut it, start a plan session for it per the `herdr` skill's Plan case with `/plan <n>`, and wrap the ticket up. When nothing can ship, halt the ticket: commit and push the work so far, comment the state and the blocker on the ticket, label it `needs-planning`, start a plan session for it the same way, and take the next ticket.
  - Before any question to the user, read the open tickets that follow this one - the tickets it blocks, the others in its stack, and any that names its files or terms - and answer it from their bodies: work a following ticket's Implementation criteria carry stays with that ticket, so close this one with the comment `left to #<m>: <the part>`; a gate such as a budget that those criteria state is the gate. Ask only when no following ticket settles it.
  - After `advisor` gave no clear answer and no following ticket settled it, ask through a question session per Questions, naming the PR and the layers pushed so far, when a fix fails twice after a real diagnosis (give both diagnoses), a layer cannot leave the program working on its own, the layer plan no longer serves the ticket, or the change breaks something outside the ticket (name it in one line and list its fix as a follow-up ticket; never absorb it into a layer).
  - On the user's "branch it" for a broken part that can be its own work: list it as a follow-up ticket blocked by this one, move its cases there, revert its commits (a `stack` ticket closes its PR), and continue.
  - On a false premise that nothing severs: comment the findings, close the ticket's PR (a `stack` ticket closes its layer PRs), send the ticket back to planning with its own plan session, and take the next ticket.
  - Publish or republish the build-story `Artifact` (same file path): one section per layer, under the plan comment's headings, with a before/after example under Solution. A UI layer embeds screenshots.
- [ ] 12. Review the build's diff for complexity the Implementation criteria do not need, and simplify it before the review, on the branch of the layer that owns it for a `stack` ticket.
- [ ] 13. After the simplify pass, start a review subagent per the `review` skill on the build's PR, the quick review: the `outputty:review` agent, with the prompt `mode review, PR <n>, base <base>, round 1`, and nothing else; a rerun after a sense check adds `; check: <what it missed>`. It posts every finding as a thread on the PR and returns a `report` and a `next`. Skip it when `git diff --name-only <base>...HEAD`, from the branch the build started from, lists only documentation and test files, snapshots included.
  - Sense-check every report of the review subagent, whatever its thread count and in every mode: 0 threads is not a pass. Read `git diff --stat <base>...HEAD` beside the report's summary. The summary must name what the diff changed, carry a `file:line` for each box it ticked, and list under `Not run` nothing the ticket needs. A report that names nothing of the diff, a run that ended on an error, a missing script or a merged PR, or a summary that could describe any diff is no review: start it again with what it missed named in `check:`. On 0 threads for a diff of 80 or more code lines, or for any stack, open the diff yourself for one concrete rule broken, pattern invented or complexity unjustified, and start the review again naming it when you find one. Print one line, `Sense check: <what the review covered> against <what the diff changed>`.
  - When the review subagent returns, print its `report` as it is, before you touch any thread, then do what its `next` says: it names the commits to split, the threads to address, the recheck to run, or the open threads to leave for the user.
  - Address every thread, listed per the `tracker` skill: fix it with one commit per fix and push, then reply `Fixed in <sha>: <file:line>`; or reply per the Do lines with the pointer that shows the finding wrong. A question in a thread is answered the same way; a thread that asks the user to decide goes to a question session, and its reply says so.
  - Fix each finding, one commit per fix, and judge the changed-files test output. Fix a finding that breaks an assumption before the docs layer, and push each fix. Before accepting a fix that changes behaviour, check it against the user docs the project's `CLAUDE.md` names.
  - A `stack` ticket commits each fix on the branch of the layer that owns the file, and rebases the stack per the `tracker` skill's Stacked PRs.
  - Start a recheck subagent as `next` says, and print each recheck's `report` the same way. Start one only after a fix commit or a reply landed on a thread the last round left open; on `idle`, start none, and send each thread that waits on the user to a question session. Only the recheck closes a thread. Send `READY` when the last recheck says `clean`, or says `idle` with every open thread waiting on a question session, and name those threads in it.
- [ ] 14. Docs layer: use the `documentation` skill. Rewrite each user doc that the project's `CLAUDE.md` names whose behaviour the build changed, and re-run each snippet whose output changed, pasting the real output.
  - Delete the ticket's entry from the not-built-yet doc that `CLAUDE.md` names, and write what the build delivered into the doc a user relies on.
  - Fix any `CLAUDE.md` **Language** term the build made stale.
  - Then start the review subagent in `docs` mode once, address its threads like any other, and start a recheck.
- [ ] 15. Call `advisor` on the finished diff, and fix what it finds.
  - Then run the master review of the whole ticket, once. A ticket of several PRs or layers always gets it; a ticket of one PR gets it when `facts.mjs` lists a reason in `masterAdvised` or you judge the change reaches past its own files. A very small, self-contained ticket skips it: the quick review stands, and you run the project's whole check suite once, not only the files the change touches. A ticket with one PR reviews that PR in mode master. A `stack` ticket opens a draft PR from its top branch into the first layer's base, `gh pr create --draft --base <base> --head <top branch> --title "master review of #<n>" --body "Whole-ticket review of #<n>; never merged."`, which shows the whole diff. Start the `outputty:review` agent with `mode master, PR <pr>, base <base>, round 1`, address its threads like any other, start a recheck by the same rule, file each plan finding (`P<n>`) as a `needs-planning` ticket with its own plan session, and close the draft PR when the recheck says `clean`.
- [ ] 16. Run every Implementation-criteria case and the ticket's **How to validate**, and paste each real output into the PR's **Solution** (a `stack` ticket: the top PR). A failing case goes back to step 11, and every case runs again.
  - Go on only when every case passes and the `tracker` skill's stub list prints nothing.
- [ ] 17. Republish the artifact with the docs section.
- [ ] 18. Report in the shape of [references/report.md](references/report.md), and offer `/outputty:dream` in one line, naming the workflow change that would have prevented the complexity found in step 12.
- [ ] 19. Start a Haiku agent briefed to read the whole PR diff and report three lines: a public API change, possibly breaking functionality, a major refactor. Message `<orchestrator>` with `herdr agent prompt <orchestrator> "READY #<n> PR <pr> into <branch>: <the three lines>"` and no `--wait`; with no `orchestrator` in `herdr agent list` for `$HERDR_WORKSPACE_ID`, start it per the `herdr` skill's Orchestrator case with that line as its prompt. Merge the PR into its feature branch per the `tracker` skill only when a `GO-AHEAD <branch>` is in force or the user said in this session to merge, and the merge does not deploy; otherwise leave the PR open and build the next ticket. A `stack` ticket sends one `READY` for its top PR and merges the stack from it.
  - Then file every idea and distraction in the list as a `needs-planning` ticket per the `tracker` skill, start one plan session for each per the `herdr` skill's Plan case with `/plan <n>`, say each in one line, and follow none of them.
  - A `GO-AHEAD <branch>` from `<orchestrator>`, or in the prompt, covers every PR into that branch until `STOP <branch>` arrives.
- [ ] 20. After the ticket is closed, remove the review's worktree with `git worktree remove --force tmp/review-<pr>` and its `tmp/review-<pr>-*` folders, then send `herdr agent prompt <builder> "/compact drop the work of ticket <n>"`, where `<builder>` is your own name, found in `herdr agent list` by `$HERDR_PANE_ID`, and end the turn; the next ticket of a loop starts after the compaction. Never compact between the PRs of a stack.

### Under a /goal

- When the user reverses a decision that the goal text still states, say the conflict in one line and ask them to run `/goal clear`.
- After two stop-hook turns with no new input, say once what you wait on, then end each turn with no text.
- When the goal text has no branch that lets a turn end on an open question, say so in the first reply and give the goal line from the `tracker` skill to set instead.

### The loop

A goal that names no ticket builds every buildable ticket: the `tracker` skill lists them, the build takes the first, and lists again after its PR is open or merged, until none is buildable. Each ticket follows the whole checklist on its own PR.

### Several tickets

Several tickets named together are built in the order given: the whole checklist for one ticket on its own PR, then the next.

- With a go-ahead in force, or the user's word to merge, merge each ticket's PR into the feature branch as soon as its last recheck says `clean` and its `READY` is sent (a `stack` ticket: its whole stack, from its top PR), and only then take the next ticket, which starts from the feature branch as merged or from its **Base**. Never start a ticket from another ticket's open PR, and never stack PRs of different tickets.
- A ticket labelled `stack` stacks its own layers; every other ticket is its own PR.

### Questions

A question for the user - a stop condition, a ruling the ticket lacks, a review thread that asks the user to decide - goes to a question session, so the happy path stays unblocked. Never ask in the build session.

- Number it `<k>`, post it as a ticket comment, and start the session per the `herdr` skill's Question case with `/plan question <k> from <builder>: <the question, its options and your recommendation>`.
- Go on with the next step the question does not touch, then the next ticket.
- When `ANSWER <k>: <answer and summary>` arrives, apply it where it changes a step, and go on as before where it changes nothing. Wait for it only when no step is left that it does not touch.
- A question session files no ticket.

## Do

- Write code per `~/.claude/rules/outputty-code.md` and per the rule file of the code's language. Code the ticket touches is brought to them; code beyond that is listed as a follow-up ticket.
- Keep the code rules: their structure is never the complexity that step 12 removes.
- On a session running on Fable, never call `advisor`: where a step calls it and a clean context adds value, start a general-purpose agent briefed for that task instead.
- Run a classification task, such as the merge classifier of step 19, on Haiku; run it on Sonnet only for a named exception.
- List work the ticket does not name, however close, as a follow-up ticket, and leave it out of every layer.
- Before you start a plan session for a ticket you send back, cut or halt, post a ticket comment that starts `needs-planning:` with two parts: **Why**, the premise, ruling or constraint that stops the build, with the ticket line or `file:line` that shows it; and **What**, what the ticket now needs given that and the rest of the context: the work left, the choice planning must make and the tickets it touches. Start the session with `/plan <n> Why: <the Why in one sentence>. What: <the What in one sentence>.` so its first message already says why the ticket is back. A session for an idea or distraction carries the idea in its ticket, with the same Why and What.
- When the user corrects the build in a way that matches a plan session this build started, send it there with `herdr agent prompt <plan agent> "<the correction>"`; send nothing to a plan session otherwise.
- Keep the happy path: file no ticket while building. Hold each follow-up in a list - its title, why and its blocker - and file the list per the `tracker` skill only after the PR is open, or merged where step 19 allows it. File one earlier only when the build cannot go on without it.
- Read the following tickets before asking whether a leftover, a gate or a ruling matters: the answer is usually in their Implementation criteria.
- Consult `advisor` to reinforce what exists and to check the work belongs to the big picture: reuse a sibling, trace each addition to the ticket, write less code, write only the tests a criterion needs, commit small.
- Print the `report` of a review, a docs check or a recheck as it is, as soon as its subagent returns: the user reads it to know what the review found.
- Answer each review thread with a reply that holds one pointer: a `file:line` at the pushed head, a commit, a ticket or plan-comment line, or the user's words from this session quoted exactly. With no pointer, reply `no proof` and say the change is removed, or listed as a follow-up ticket; then do it.
- Start the dev or preview server of a UI ticket with `--host 0.0.0.0` before the first edit, print its LAN URL, and show a screenshot or mock before changing a page's look.

## Don't

- Don't infer the `stack` label from size.
- Don't ask the user a question that a following ticket's body answers.
- Don't start a plan session without its reason: the ticket comment and the Why and What of the prompt come first.
- Don't wait for, read or follow a plan session after it starts: list the open tickets after your next PR, and take what is buildable.
- Don't merge into `main`: only the user, or the orchestrator on the user's "merge everything", merges a feature branch.
- Don't ask `advisor` for a way to enable a new pattern, an experiment or an unplanned design.
- Don't invent a pointer, and don't edit the ticket, the plan comment or the pushed history once the review has posted, except to split the commits a `stop` verdict named.
- Don't resolve, close or reopen a review thread: only the review's recheck does.
- Don't start a subagent or fork to implement a layer, however many files it touches or however long the context: the build session makes every edit itself. A fork is for the trial of step 9 only. The only subagents a build starts are the review subagent, its rechecks and the merge classifier of step 19.
- Don't run another review skill, agent or tab beside the `review` skill, except the merge classifier of step 19 and a review the goal adds: an independent validator runs once per ticket against its Implementation criteria, and again only when a criterion failed.

## Glossary

- **Layer** - one step of a build, chosen so the program works after it; the last layer is docs.
- **Seam** - the place in the code where new behaviour plugs in.
- **Sibling** - the existing code nearest to the requirement, which the build copies.
- **Gating** - the ticket's line saying whether the change ships behind a flag, and its name.
- **Base** - the ticket's line naming the branch the build starts from: `main`, or a prototype branch on GitHub.
- **Drafted against** - the ticket's line naming the `main` commit the plan read.
- **Spike** - one test case that proves or disproves an assumption.
- **`advisor`** - the stronger reviewer model a session can consult.
- **Build-story artifact** - the page a build session publishes about what it built.
- **Observable** - the measurement that decides between two shapes, such as run time.
- **Question session** - a background plan session that asks the user one question and answers the builder with `ANSWER <k>`; it files no ticket.
- **Stop-hook turn** - a turn the `/goal` hook gives back because its condition does not hold yet.
- **Not-built-yet doc** - the doc the project's `CLAUDE.md` names for what is open.
- **`L<k>`** - layer number `k` in a commit title.
- **Stack** - one PR per layer, built only for a ticket labelled `stack`.
- **Review** - the `review` skill, run by a review subagent the build starts: it posts its findings as threads on the PR, and only its recheck resolves them.
- **Orchestrator** - the Sonnet session `<orchestrator>`, named `<repo>-orchestrator`, that hears each build's `READY`, creates the batch's feature branch, tells the user, and merges the feature branch into `main` on the user's say.
- **Merge classifier** - the Haiku agent that reads a PR's whole diff and reports a public API change, possibly breaking functionality and a major refactor; its three lines ride in the `READY` message.
- **Feature branch** - the `feature/<slug>` branch the orchestrator creates per batch, which the batch's PRs target and only the user, or the orchestrator on "merge everything", merges into `main`.
- **Go-ahead** - the `GO-AHEAD <branch>` message that lets the build merge every PR into that feature branch until `STOP <branch>`.
