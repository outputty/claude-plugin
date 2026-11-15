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
8. A judgement call is spiked, never assumed: when two shapes both serve the ticket and which is better is unclear, such as the faster one or the cleaner code design, run one fork per shape in parallel, each judged on one observable named beforehand. Commit first, then start each fork with `isolation: "worktree"`: its own worktree from the last commit, so parallel forks never touch one file. Cherry-pick the winning fork's commit from the branch its result names, and remove every fork's worktree. A choice the ticket, the docs or the nearest code already settles is no judgement call; spike nothing else.
9. A build never widens scope. Work that the ticket does not name, however close, is offered to the user as a new ticket and left out of every layer. Bringing code the ticket touches to **Packages**, **Classes**, **Fits in your head** and **Names** is part of the ticket.

## 3. Build each layer

Before the first file edit, start the build branch per the `tracker` skill's PRs: from the prototype when the ticket has one, else from the planning branch. A `stack` ticket instead starts each layer's branch per Stacked PRs: the first from the prototype or the planning branch, each later one from the layer below.

For every layer, in order:

1. Before each commit, check that `git branch --show-current` names the branch this layer commits on.
2. List every file the layer will touch, and read them all in one pass. Then make the edits per **Packages**, **Classes**, **Fits in your head** and **Names** below, their docstrings per **Docstrings**, and their tests, with the tests the change reaches run after each change. Commit each chunk with its test once the run is green: `<type>(<scope>): <title>, L<k> (#<n>)`, Conventional Commits.
3. Run the repo's lint and typecheck commands over the layer. An error counts as pre-existing only when it reproduces on the ticket's base commit. Fix every new error and run both commands again. Publish the layer (item 4) only when both pass.
4. Push the layer onto the planning PR per the `tracker` skill's PRs. After the first layer, give that PR the ticket's title and a body per the `tracker` skill, and mark it ready for review. A `stack` ticket instead publishes the layer as its own PR, ready for review, links it onto the stack, and after the first layer marks the planning PR ready.
5. Publish or republish the build-story `Artifact` (same file path, so the URL stays fixed): one section per layer, under the same five headings as the plan comment, with a gantt chart of what changed and a before/after example under Solution. A UI layer embeds screenshots.

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

1. Run every Implementation-criteria case and paste each real output into the PR's **Solution**; a `stack` ticket pastes into the top PR. A failing case goes back to step 3: fix it, on the layer's branch and with a rebase of the stack for a `stack` ticket, and run every case again. Go on to step 6.2 only when every case passes and the `tracker` skill's stub list prints nothing.
2. Review the build's diff for complexity that crept in beyond the ticket's **Grade**, and simplify it, on the branch of the layer that owns it for a `stack` ticket.
3. Republish the artifact with the docs section, then call `advisor`.
4. Report the PR URL (a `stack` ticket: the bottom PR's) and the artifact URL, and offer `/retro` in one line, naming the workflow change that would have prevented the complexity found in step 2.
5. Merge only when the user types "merge", per the `tracker` skill.

## Packages

Behind the seam the ticket names, build each part as if it were a package that will one day be published on its own: one clear purpose, its concerns kept apart from its neighbours', and callers that depend only on its interface, so another package with the same interface can replace it.

- A helper is a self-contained function: it works from its arguments alone.
- Behaviour that takes several functions is a class, or in a language without classes its nearest form, such as a struct with its methods.
- Code the ticket touches is brought to these rules, to **Classes**, to **Fits in your head** and to **Names**; code beyond it is offered as its own ticket.
- These rules and those three sections hold at every **Grade**: their structure is never the complexity that step 6.2 removes.

## Classes

Every class reads the same way, so a reader who knows one knows them all.

- A class is a declaration or an operation. A declaration says what something is: a constructor and its knobs, and nothing that runs. An operation does one action.
- The members come in one order: the constructor, taking one object always named `config`; the knobs, one noun per setting, each returning a new instance; the lifecycle, in call order; then the private steps, as many as the class needs.
- An operation's lifecycle uses the same five words in every class: `preflight` checks and changes nothing, `start` takes what the work needs, `execute` does the work, `end` finishes it, and `abort` undoes it after a failure. A class leaves out a word it has no use for.
- One action per class. A class that owns several actions is split, one class per action; a split that changes an interface the ticket does not name goes back to planning, per step 1.4.
- A method that users of the package call keeps the product's own word; the five words rule the classes the package's own code calls.

## Fits in your head

After Mark Seemann's [thresholds](https://blog.ploeh.dk/2020/04/13/curb-code-rot-with-thresholds/): seven stands for what a reader can hold at once.

- A function has at most seven paths: one, plus one for each `if`, loop, `case` and `catch`. Operators and optional chains do not count. This follows [his count](https://blog.ploeh.dk/2019/12/09/put-cyclomatic-complexity-to-good-use/) of branching and looping keywords, not a linter's.
- A function fits on [one screen of twenty-four lines](https://blog.ploeh.dk/2019/11/04/the-80-24-rule/); the formatter owns the width.
- A function keeps at most seven things in play: its parameters, its locals and the fields it reads.
- A step is a [command or a query](https://blog.ploeh.dk/2014/08/11/cqs-versus-server-generated-ids/): a command changes state and returns nothing; a query returns data and changes nothing. An orchestrator calls both and may hand back what its queries returned.
- Past a threshold, split: pull a named step out, or split the class by action. A function crosses one only with a one-line comment above it saying why it belongs whole.
- A threshold reaches the function a ticket changes; the rest of the file is offered as its own ticket.

## Names

Continuity comes first: take a name from the **Language** section of the repo's `CLAUDE.md` wherever a term there fits, and keep one word for one concept across code, docstrings, tickets and docs. Beyond that, three rules, from [these naming guidelines](https://dev.to/hyfydistro/intro-to-naming-guidelines-writing-meaningful-variable-names-13j5):

1. A name says why the thing exists, what it does and how it is used, in the trade's term where one fits, else the domain's own word.
2. A name is whole words, sayable and searchable, one per concept and a whole word apart from its neighbours: no abbreviation, numbered series, look-alike characters, noise word, prefix or one-letter plural. A single letter names only the item of a short loop, and the enclosing class, function or module gives the context.
3. A class is named by a noun wide enough for every state it holds, a function by a verb phrase, with `get`, `is` and `has` kept for calls that change nothing, and a raw value by a constant.

## Docstrings

A new or changed exported unit gets a docstring in [Google style](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html): a summary line, then `Args:`, `Returns:`, `Raises:` and `Examples:` as needed. A language with its own doc-comment tags carries the same parts in them. Its words follow **Names**: the repo's **Language** terms first, and one word for one concept.

1. Open with why the unit exists and what it is meant to do, in the simplest words. A docstring that grows long means the unit does too much: split the unit.
2. List its core features only when it is more involved; a simple helper that item 1 explains stops there.
3. Give an example, and say when it applies. When the unit is used in several distinct ways, list one example for each.
4. Leave out what the code already shows.
5. Be brief, but never at the cost of clarity.

## Several tickets

Several tickets named together are built in the order given, one PR each:

1. Run steps 1 to 6 for one ticket on its own planning PR, then start the next.
2. When a later ticket's code needs an earlier one's, merge the earlier ticket's planning branch into the later build branch before its first edit. The later PR's diff shows the earlier commits until the earlier PR merges.
3. Tickets never stack onto each other; a ticket labelled `stack` stacks only its own layers, on its own planning PR.
4. A test watcher started for the first ticket keeps running for the rest.

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
