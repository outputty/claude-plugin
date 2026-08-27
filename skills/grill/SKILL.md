---
name: grill
description: Stress-tests a plan or idea by asking the whole answerable frontier at once, each question with a recommendation, until nothing answerable is left. Use when the user asks to sharpen, challenge, interrogate or grill a plan, and as the interview before /breakdown files issues. Not for reviewing a diff (/code-review).
---

# grill - interview until the frontier is empty

Input: the plan or the idea. Output: a settled understanding, written into the reply as the draft of a parent issue (`.github/ISSUE_TEMPLATE/task.md` shape), handed to `breakdown` on the user's yes.

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
3. **Unknown** - nothing readable settles it. It is a spike, not a discussion: write a `spike-<slug>` test in the repo's suite, run it, and feed the answer back.

A spike runs as a fork (`subagent_type: "fork"`) in this session's worktree. Two to four candidates that must be built to compare run one fork each, `isolation: "worktree"`, and the observable that decides them is written down before any spawn. Judge on the observable, never by reading the diffs.

## Technique

- Find facts yourself. A codebase hunt goes to the built-in `Explore` agent; research to `WebFetch`.
- When a term is vague, propose one canonical term and name the synonyms it replaces.
- Probe boundaries with invented concrete scenarios.
- When an answer contradicts an earlier one or the code, say so at once and branch into the decisions the conflict exposes.
- Argue the other side. Rank objections `high` (the plan cannot work as written), `medium` (one named part must change), `low` (worth knowing). Cite each to a source opened this run, and drop one you cannot open. Name one materially different shape that reaches the same goal.
- Explain a failure in four parts: the problem in one sentence, the concrete failing example, the same failure stripped of business logic, then the technical cause. You ran parts 2 and 3.

## Done

The grill ends when every branch is examined and no answerable question remains. "Feels like enough" is not a criterion. Then draft the parent issue in the reply and ask, with one `AskUserQuestion`, whether it is settled. On a yes, invoke the `breakdown` skill in the same turn with the draft as its input; the user types nothing further until `breakdown` presents the split.
