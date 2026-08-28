---
name: grill
description: Stress-tests a plan or idea by asking the whole answerable frontier at once, each question with a recommendation, until nothing answerable is left, then files it as one ticket. Use when the user asks to sharpen, challenge, interrogate or grill a plan, or to plan a ticket. Not for reviewing a diff (/code-review).
---

# grill - interview until the frontier is empty

Input: the plan or the idea. Output: one ticket on the board that a `build` agent can take cold: the interface you and the user agreed, the end state as numbered Done when cases, and what it is blocked by. Layers are the builder's; the ticket carries none.

Read `.claude/product.md`, `.claude/roadmap.md` and `.claude/architecture.md` before the first question. Every premise is checked against them, and a decision that changes one of them is written into it when it settles.

## Ask in rounds

The **frontier** is every question that is answerable now without assuming an open decision. A question that rests on an open decision waits for a later round. A question you cannot yet phrase is **fog**: name it and leave it.

1. Ask the whole frontier in one numbered round, each item with your recommendation. Then wait.
2. Put every question in the reply as prose. `AskUserQuestion` renders two to four labels and buries the rest, so it carries only a gate: the opening shape confirmation and the final "settled?".
3. Each answer expands the frontier; recompute and ask the next round.

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

## Premises

A request and a ticket both carry premises: "we already do X", the cause the ticket names, the fix it asks for. List each and give it a verdict:

1. **Grounded** - you found the code, ran it, or read the measurement. Cite one anchor.
2. **Absent** - it does not exist or does not work that way. Say so at once.
3. **Unknown** - nothing readable settles it. Grep `.claude/rules/` and auto-memory first; a question already closed there is cited, not re-measured. Otherwise it is a spike, not a discussion: write a `spike-<slug>` test in the repo's suite, run it, and feed the answer back.

A spike runs as a fork (`subagent_type: "fork"`) in this session's worktree. Two to four candidates that must be built to compare run one fork each, `isolation: "worktree"`, and the observable that decides them is written down before any spawn. Judge on the observable, never by reading the diffs. A probe shaped like the proposal it tests presupposes the answer; shape it neutrally. ⚠ A spike test is deleted the moment its answer is recorded; none reaches a commit.

## Root - every place the fix could land

The ticket's framing is a premise: verdict its cause and its fix separately. Then walk the places:

1. Spike the place in hand and price it: call sites moved, tests moved, a seam added, a shape broken. A breaking change is priced like any other change.
2. Ask "where else could this be solved?": one step closer to the root, in a different unit, or in a shape that makes the failure unwritable. Spike it at the same depth.
3. Repeat until the question names nothing new.

Present every place priced, your recommendation first. The user's pick closes it; every other place is one line under **Killed** in `.claude/roadmap.md` with what killed it.

## Technique

- Find facts yourself. A codebase hunt goes to the built-in `Explore` agent; research to `WebFetch`. A researched fact worth keeping past this session goes to auto-memory as `type: reference`.
- "Does X already exist?" is answered before any unit says "build X". Name what was found and why it does not serve.
- When a term is vague, propose one canonical term and name the synonyms it replaces.
- Probe boundaries with invented concrete scenarios.
- When an answer contradicts an earlier one or the code, say so at once and branch into the decisions the conflict exposes.
- Argue the other side. Rank objections `high` (the plan cannot work as written), `medium` (one named part must change), `low` (worth knowing). Cite each to a source opened this run, and drop one you cannot open. Name one materially different shape that reaches the same goal.
- Explain a failure in four parts: the problem in one sentence, the concrete failing example, the same failure stripped of business logic, then the technical cause. You ran parts 2 and 3.

## Done

The grill ends when every branch is examined and no answerable question remains. "Feels like enough" is not a criterion. Then draft the ticket in the reply, in the `.github/ISSUE_TEMPLATE/task.md` shape, and ask with one `AskUserQuestion` whether it is settled. On a yes, in the same turn:

1. Write the docs: a paragraph in `.claude/roadmap.md` on why this is worth building now, the architecture delta in `.claude/architecture.md` marked `pending #<n>`, and a new canonical example in `.claude/examples.md` when one was agreed. Commit them on the planning branch.
2. File the ticket with the `github` skill: `--label ready`, `--blocked-by` for every ticket that must land first, `priority:high` when it must go next, then `item-add` it to the board.
3. Run the `retro` skill on this session and commit what it writes.

Report the ticket number and what it is blocked by.
