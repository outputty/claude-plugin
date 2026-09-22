---
name: plan
description: Plans one ticket with the user - asks until nothing answerable is left, spikes where the fix could land, gets the user's pick, then files the ticket. Use as /plan <idea>, /plan <ticket#> for a needs-planning ticket, or on "plan this", "let's plan".
---

# plan - ask, spike, pick, file

Input: an idea, or a ticket number labelled `needs-planning`. Output: one ticket that a build session can take, with its end-to-end example, its Implementation criteria and its blockers.

Plan in the worktree this session launched in. Its branch is `git branch --show-current`.

## Scratch file

Write what the session learns to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo, at the end of every round: the questions and answers, each spike's result, the pick, and the ticket draft. `<project>` is the directory that holds `memory/`, and `<slug>` is the idea in kebab case or `ticket-<n>`. A restarted session reads it first. Delete it once the ticket is filed.

## Start

1. Read `.claude/product.md`, `.claude/architecture.md` and `.claude/roadmap.md`.
2. `/plan <n>`: read the ticket and its comments per the `tracker` skill. The last comments hold the question that the build could not answer.

## Ask in rounds

1. Ask the questions answerable now through `AskUserQuestion`, listed in the reply first in this shape:

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

2. A question that depends on an open answer waits for the next round.
3. When an answer reverses a written decision, ask about that reversal alone before anything else.

## Spike

A premise that nothing readable settles is a spike: a `spike-<slug>` test in the repo's suite. Decide the observable before running it, and record the answer in the scratch file.

## Where the fix lands

1. Spike the place in hand and price it: call sites, tests, seams, breaks.
2. Spike one level up (the caller's interface, or a shape that makes the failure unwritable), at the same depth.
3. Present each level priced, your recommendation first, with one `AskUserQuestion`. Every level not picked becomes one line under **Killed** in `.claude/roadmap.md`.
4. Write the picked level's seam into `## What should happen`, named and signed.

## Fast-path fix

When the picked spike is already the complete fix, ask: build it now, or file it for a separate `/build`. On "build it now", file the ticket, then follow the `build` skill from its claim step in this session.

## Done

Draft the ticket per the `tracker` skill and ask whether it is settled. On a yes:

1. File it per the `tracker` skill, with its blockers and a priority, and add it to the board. A resumed ticket is edited in place and returned from planning.
2. Add a line under **Next** in `.claude/roadmap.md`. Mark the change in `.claude/architecture.md` as `pending #<n>`.
3. Commit, push, and open a PR per the `tracker` skill.
4. Delete the scratch file. Report the ticket number, its blockers and the PR URL.
