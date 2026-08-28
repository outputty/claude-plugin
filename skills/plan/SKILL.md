---
name: plan
description: Plans one ticket with the user - grills the idea until nothing answerable is left, spikes every level the fix could land at, gets the user's pick, then files the ticket. Use as /plan <idea> for new work, /plan <ticket#> to resume a ticket labelled needs-planning, or on "plan this", "grill this", "let's plan".
---

# plan - interview, spike, pick, file

Input: an idea, or a ticket number carrying the `needs-planning` label. Output: one ticket on the board that a build session can take: the interface you and the user agreed, the end state as numbered Done when cases, and what it is blocked by. Layers are the builder's; the ticket carries none.

## The scratch file

Everything this session learns is written, as it is learned, to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo and never committed. `<project>` is the directory Claude Code already uses for this checkout (the one holding `memory/`); `<slug>` is the idea in kebab case, or `ticket-<n>`. It holds: the premises and their verdicts, every question asked and the user's answer, each spike's question, observable and result, the places priced under Root, the pick, and the ticket draft as it stands. Update it at the end of every round. A session that restarts reads it first and continues from the last round instead of asking again. Delete it once the ticket is filed.

## Start

1. Read `.claude/product.md`, `.claude/roadmap.md` and `.claude/architecture.md`. Every premise is checked against them, and a decision that changes one is written into it when it settles. Load the repo's domain skill (`.claude/skills/<domain>/`) whose description names the idea's domain; its `references/` are read only when the body points there.
2. `/plan <idea>`: look for an existing scratch file for the slug; resume it if found.
3. `/plan <n>`: `gh issue view <n> --json title,body,labels,comments`. The last comments hold the question the build could not answer. Resume the scratch file if one exists; otherwise start one from the ticket body. The rounds below run on that question, and the ticket is edited in place at the end (`gh issue edit <n> --body-file`, then `--remove-label needs-planning --add-label ready`).

## Ask in rounds

The **frontier** is every question that is answerable now without assuming an open decision. A question that rests on an open decision waits for a later round. A question you cannot yet phrase is **fog**: name it and leave it.

1. Ask the whole frontier in one numbered round, each item with your recommendation. Then wait.
2. Put every question in the reply as prose. `AskUserQuestion` renders two to four labels and buries the rest, so it carries only a gate: the opening shape confirmation, the Root pick, and the final "settled?".
3. Each answer expands the frontier; write the round to the scratch file, recompute, ask the next round.

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

## Root - every level the fix could land at

The ticket's framing is a premise: verdict its cause and its fix separately. Then walk the levels, per `.claude/architecture.md`'s principles:

1. Spike the place in hand and price it: call sites moved, tests moved, a seam added, a shape broken. A breaking change is priced like any other change.
2. Go one level up: the component above, the interface the caller uses, or a shape that makes the failure unwritable. Spike it at the same depth. Repeat until the level above changes nothing.
3. Present every level priced, your recommendation first, with one `AskUserQuestion`. The user's pick closes it; every other level is one line under **Killed** in `.claude/roadmap.md` with what killed it.

## Technique

- Find facts yourself. A codebase hunt goes to the built-in `Explore` agent; research to `WebFetch`. Before researching a tool, vendor or discipline, load its expert skill from `.claude/skills/<domain>/` if one exists; what it says is a prior to re-verify, not a fact. Every researched fact is noted in the scratch file with its source and the domain it belongs to, and whether it confirms, contradicts or extends what the expert skill said.
- "Does X already exist?" is answered before any ticket says "build X". Name what was found and why it does not serve.
- When a term is vague, propose one canonical term and name the synonyms it replaces.
- Probe boundaries with invented concrete scenarios.
- When an answer contradicts an earlier one or the code, say so at once and branch into the decisions the conflict exposes.
- Argue the other side. Rank objections `high` (the plan cannot work as written), `medium` (one named part must change), `low` (worth knowing). Cite each to a source opened this run, and drop one you cannot open.
- Explain a failure in four parts: the problem in one sentence, the concrete failing example, the same failure stripped of business logic, then the technical cause. You ran parts 2 and 3.

## Done

The plan ends when every branch is examined and no answerable question remains. "Feels like enough" is not a criterion. Draft the ticket in the reply in the `.github/ISSUE_TEMPLATE/task.md` shape, with the end-to-end example from `architecture.md`'s pipeline as case 1 of Done when, and ask with one `AskUserQuestion` whether it is settled. On a yes, in the same turn:

1. Write the docs: a paragraph in `.claude/roadmap.md` on why this is worth building now; the change to `.claude/architecture.md`'s pipeline or principles, marked `pending #<n>`; a new canonical example in `.claude/examples.md` when one was agreed. Commit them on the planning branch.
2. File the ticket with the `github` skill: `--label ready`, `--blocked-by` for every ticket that must land first, `priority:high` when it must go next, then `item-add` it to the board. On a resumed ticket, edit it in place and swap `needs-planning` for `ready`.
3. **Expert skills.** From the scratch file's researched facts, list every domain touched this session: one the repo has no skill for yet, one whose skill was found wrong or outdated (a fact it stated was disproven this session), one whose skill was insufficient (a fact it did not hold). Ask with `AskUserQuestion`, `multiSelect: true`, one option per domain, at most four per question, each label naming the action (`create dlt`, `update duckdb: 2 disproven, 3 new`, `create snowflake`), with a recommendation. The full list stays in the reply above the question. For each selected domain: create `.claude/skills/<domain>/SKILL.md` from `${CLAUDE_PLUGIN_ROOT}/templates/SKILL.md`, or update the existing one: a disproven claim moves to its **Disproven** section with the date and the source that overturned it, a new fact joins Patterns, Rules or Traps with its source under References, and the **Validated** date is set. One skill per tool, vendor or discipline; a fact about dlt goes in `dlt`, not in a warehouse skill. Commit on the planning branch.
4. Run the `retro` skill on this session and commit what it writes.
5. Delete the scratch file.

Report the ticket number and what it is blocked by.
