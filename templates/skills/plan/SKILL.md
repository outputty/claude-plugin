---
name: plan
description: Plans one ticket with the user - asks until nothing answerable is left, spikes where the fix could land, gets the user's pick, then files the ticket. Use as /plan <idea>, /plan <ticket#> for a needs-planning ticket, or on "plan this", "let's plan".
---

# plan - interview, spike, pick, file

Input: an idea, or a ticket number labelled `needs-planning`. Output: one ticket that a build session can take, with its end-to-end example, its Implementation criteria and its blockers.

Plan in the worktree this session launched in. Its branch is `git branch --show-current`.

## Scratch file

Write what the session learns to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo, at the end of every round: the questions and answers, each spike's result, the pick, and the ticket draft. `<project>` is the directory that holds `memory/`, and `<slug>` is the idea in kebab case or `ticket-<n>`. A restarted session reads it first. Delete it once the ticket is filed.

## Start

1. Read `.claude/product.md`, `.claude/architecture.md` and `.claude/roadmap.md`.
2. `/plan <n>`: read the ticket and its comments per the `tracker` skill. The last comments hold the question that the build could not answer.

## Interview

1. Map the idea as a tree of decisions; each decision branches into the decisions that depend on it.
2. Open every round with that tree, redrawn: `✓` settled with its answer, `→` asked this round, `○` waiting on the node above it. The first round shows the whole tree you expect to walk; later rounds show where answers grew or cut branches.

```text
#42 CSV export                        round 2
├─ ✓ Q1 output format     CSV, RFC 4180
├─ → Q3 where it runs     asking now
│   └─ ○ Q5 stream or buffer  waits on Q3
├─ → Q4 column order      asking now
└─ ○ Q6 gating            waits on Q3
```

3. Each round, ask every decision whose prerequisites are settled through `AskUserQuestion`, four per call, calls back to back. List them in the reply first, in this shape, then wait:

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

4. A question that depends on an answer still open this round waits for a later round.
5. Find facts yourself: send a codebase hunt to the `Explore` agent and research to `WebFetch`, and keep asking the questions that do not depend on them. The user makes decisions; never ask them for a fact you can look up.
6. Give each premise a verdict before building on it: grounded (cite the anchor), absent (say so at once), or unknown (a spike). State inside each question the premise it rests on.
7. Give each alternative an end-to-end example: the input as the user writes it, then its output.
8. When a term is vague or clashes with `CLAUDE.md`'s **Language**, propose one canonical term and name the synonyms it replaces.
9. Probe each boundary with an invented concrete scenario that forces a precise answer.
10. When an answer contradicts the code or an earlier answer, say so at once and ask which is right. When it reverses a written decision, ask about that reversal alone before anything else.
11. Before presenting a binary, name the smallest and the largest alternative. Argue the other side, and rank each objection high, medium or low, citing a source opened this session.
12. Stop when every branch is visited and nothing is silently assumed. Confirm the shared understanding before drafting the ticket.

## Spike

A premise that nothing readable settles is a spike: a `spike-<slug>` test in the repo's suite. Decide the observable before running it, and record the answer in the scratch file.

## Where the fix lands

1. Spike the place in hand and price it: call sites, tests, seams, breaks.
2. Spike one level up (the caller's interface, or a shape that makes the failure unwritable), at the same depth.
3. Present each level priced, your recommendation first, with one `AskUserQuestion`. Every level not picked becomes one line under **Killed** in `.claude/roadmap.md`.
4. Write the picked level's seam into the ticket's `## Solution`, named and signed.
5. Derive the ticket's **Where** by grepping every caller, importer and re-export of each changed signature.
6. Ask whether the change ships behind a flag, and write the answer as the ticket's **Gating** line: `none`, or the flag and its construction site.

## Fast-path fix

When the picked spike is already the complete fix, ask: build it now, or file it for a separate `/build`. On "build it now", file the ticket, then follow the `build` skill from its claim step in this session.

## Done

Draft the ticket per the `tracker` skill and ask whether it is settled. On a yes:

1. File it per the `tracker` skill, with its blockers and a priority, and add it to the board. A resumed ticket is edited in place and returned from planning.
2. Add a line under **Next** in `.claude/roadmap.md`. Mark the change in `.claude/architecture.md` as `pending #<n>`.
3. Commit, push, and open a PR per the `tracker` skill.
4. Delete the scratch file. Report the ticket number, its blockers and the PR URL.
