---
name: plan
description: Plans one ticket with the user - grills the idea until nothing answerable is left, spikes every level the fix could land at, gets the user's pick, then files the ticket. Use as /plan <idea> for new work, /plan <ticket#> to resume a ticket labelled needs-planning, or on "plan this", "grill this", "let's plan".
---

# plan - interview, spike, pick, file

Input: an idea, or a ticket number carrying the `needs-planning` label.

Output: one ticket on the board that a build session can take. It carries the interface you and the user agreed, the end state as checkable cases inside Implementation criteria, and what it is blocked by. Layers are the builder's; the ticket carries none.

## Where you are

You are the planning session. Your worktree and your tab were set when this session launched - plan here, in the checkout you are standing in.

This skill opens no tab and starts no session. That is the caller's job, done once, before `/plan` ran. A plan that can open a planning tab opens one from inside every plan it opens.

- `<slug>` is the idea in kebab case, or `ticket-<n>` when resuming a ticket, the same slug the scratch file uses.
- The worktree's own branch is **the planning branch** this skill commits to throughout. Read it with `git branch --show-current`; never compose it from the slug, which drops the `worktree-` prefix the launch adds.
- Planning runs on the session's default model; Sonnet is for builds.

## The scratch file

Everything this session learns is written to `~/.claude/projects/<project>/plans/<slug>.md` as it is learned. The file is outside the repo and never committed.

- `<project>` is the directory Claude Code already uses for this checkout, the one holding `memory/`.
- `<slug>` is the idea in kebab case, or `ticket-<n>`.

It holds:

- the premises and their verdicts
- every question asked and the user's answer
- each spike's question, observable and result
- each researched fact, its source, its domain, and whether it confirms, contradicts or extends the domain's expert skill
- the levels priced under Root, and the pick
- the ticket draft as it stands

Update it at the end of every round. A restarted session reads it first and continues from the last round. Delete it once the ticket is filed.

## Start

1. Read `.claude/product.md`, `.claude/roadmap.md`, `.claude/architecture.md` and `.claude/lessons.md`. Every premise is checked against them.
2. Load the expert skill under `~/.claude/skills/<domain>/` for every domain the idea names. Its lines are priors to re-verify, not facts.
3. `/plan <idea>`: resume the scratch file for the slug if one exists.
4. `/plan <n>`: read the ticket with its comments, per the `tracker` skill.
   - The last comments hold the question the build could not answer; the rounds run on it.
   - Resume the scratch file if one exists; otherwise start one from the ticket body.
   - At the end the ticket is edited in place and `needs-planning` is swapped for `ready`.

## Ask in rounds

The **frontier** is every question answerable now without assuming an open decision. A question that rests on an open decision waits for a later round. A question you cannot yet phrase is **fog**: name it and leave it.

1. Ask the frontier's four to six most decisive questions in one round, each item with your recommendation. An item with alternatives carries an e2e example per alternative: the input as the user writes it, the output labelled real or expected. Park the rest of the frontier and say it is parked. Then wait.
2. Ask every one of that round's questions through `AskUserQuestion`, four per call, calls back to back until the round is asked. The reply carries each question's example and its price; the tool carries the answering. A question left in prose alone is not asked.
3. State inside each question the premise it rests on. A premise the user holds that the code no longer supports is answered from anyway, and naming it is what surfaces it.
4. Each answer expands the frontier. Write the round to the scratch file, recompute, ask the next round.
5. On "I don't understand", "step back", or an answer that re-opens a settled question, stop asking. Re-pitch the whole thing on one page, then ask one confirmation.

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

## Premises

A request and a ticket both carry premises: "we already do X", the cause the ticket names, the fix it asks for. List each and give it a verdict:

1. **Grounded** - you found the code, ran it, or read the measurement. Cite one anchor.
2. **Absent** - it does not exist or does not work that way. Say so at once.
3. **Unknown** - nothing readable settles it; grep `.claude/rules/` and auto-memory first, and cite a question already closed there rather than re-measuring it. Otherwise it is a spike.

A spike is a `spike-<slug>` test in the repo's suite, run as a fork (`subagent_type: "fork"`) in this session's worktree. Two to four candidates that must be built to compare run one fork each, `isolation: "worktree"`. The observable that decides them is written down before any spawn; judge on it, never by reading the diffs.

A probe shaped like the proposal it tests presupposes the answer; shape it neutrally.

⚠ A spike test is deleted the moment its answer is recorded. None reaches a commit.

## Root - every level the fix could land at

The ticket's framing is a premise: verdict its cause and its fix separately. Then walk the levels, per `.claude/architecture.md`'s principles:

1. Spike the place in hand and price it: call sites moved, tests moved, a seam added, a shape broken, and the flag a stack of 200 or more lines builds behind. A breaking change is priced like any other change.
2. Go one level up: the component above, the interface the caller uses, or a shape that makes the failure unwritable. Spike it at the same depth, and repeat until the level above changes nothing.
3. Present every level priced, your recommendation first, with one `AskUserQuestion`. The user's pick closes it; every other level is one line under **Killed** in `.claude/roadmap.md` with what killed it.
4. Spike the picked level's new seam - methods, types, call order - and write it into the ticket's Interface section, named and signed.
   - The builder decides how the seam is implemented, never what it is; a seam invented during build is this step's defect.

## Technique

- Find facts yourself. A codebase hunt goes to the built-in `Explore` agent; research to `WebFetch`.
- Note every researched fact in the scratch file with its source and domain, and its relation to the expert skill: confirms, contradicts, extends.
- "Does X already exist?" is answered before any ticket says "build X". Name what was found and why it does not serve.
- When a term is vague, propose one canonical term and name the synonyms it replaces.
- Probe boundaries with invented concrete scenarios.
- When an answer contradicts an earlier one or the code, say so at once and branch into the decisions the conflict exposes.
- When an answer reverses a decision already written (the ticket, the docs, the scratch file), the next question is that reversal alone, naming what it undoes; nothing is priced, drafted or filed on it until it is confirmed.
- Argue the other side. Rank objections `high` (the plan cannot work as written), `medium` (one named part must change), `low` (worth knowing). Cite each to a source opened this run; drop one you cannot open.
- Explain a failure in four parts: the problem in one sentence, the concrete failing example, the same failure stripped of business logic, then the technical cause. You ran parts 2 and 3.

## Done

The plan ends when every branch is examined and no answerable question remains. "Feels like enough" is not a criterion.

Draft the ticket in the reply in the `.github/ISSUE_TEMPLATE/task.md` shape; `## What should happen`'s before/after is the end-to-end example from `architecture.md`'s pipeline. Ask with one `AskUserQuestion` whether it is settled. On a yes, do the five steps below in the same turn.

### 1. Write the docs

- `.claude/product.md`: the settled capability written in as the product's truth, product language only, no tickets, its terms in a quote block below the paragraph.
- `CLAUDE.md`: a new or changed canonical term added under **Language**, outside the managed block.
- `.claude/roadmap.md`: a line under **Building**: the chunk, and why now.
- `.claude/architecture.md`: the change to its pipeline, patterns or principles, marked `pending #<n>`.
- `.claude/examples.md`: a new canonical example, when one was agreed.

Commit them on the planning branch.

### 2. File the ticket

Use the `tracker` skill: `--label ready`, `--blocked-by` for every ticket that must land first, `priority:high` when it must go next, then `item-add` it to the board.

On a resumed ticket, edit it in place and swap `needs-planning` for `ready`.

### 3. Expert skills

Improve a skill that already exists; create a new one only when no existing skill's domain covers the knowledge. Overlapping skills are two places to keep in sync.

1. From the scratch file, list every domain this session researched. For each, name the existing skill that covers it, or `none`.
2. For each domain, count the facts: confirmed, contradicted, new.
3. Ask with `AskUserQuestion`, `multiSelect: true`, at most four options per question:
   - one option per existing skill with something to change: `improve duckdb: 2 contradicted, 3 new`
   - one option per domain with no skill: `new skill for dlt: 5 facts` (the user can also type a different name)
   - a recommendation on each, and the full list in the reply above the question
4. For each selected **improve**: a contradicted line moves under **Disproven** with the date and the source that overturned it; a new fact becomes one actionable line under Patterns, Rules or Traps; its explanation and source go under `references/`, pointed at from the line; set `Validated`.
5. For each selected **new skill**: first read every existing skill and move any line that belongs to the new domain into it, with its references, so no two skills hold the same claim. Then write `~/.claude/skills/<domain>/SKILL.md` from `~/.claude/skill-template.md`, one tool, vendor or discipline per skill.
6. Commit on the planning branch.

### 4. Retro

Run the `retro` skill on this session and commit what it writes.

### 5. Finish

Push the planning branch and open a PR for it from `.github/PULL_REQUEST_TEMPLATE.md`, a docs-only diff; it is the same review gate as a build's stack, and the human merges it. Delete the scratch file. Report the ticket number, what it is blocked by, and the PR URL.
