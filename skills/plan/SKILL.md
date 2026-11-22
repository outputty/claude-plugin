---
name: plan
description: Plans one ticket with the user - asks until nothing answerable is left, lists where the fix could land, gets the user's pick, then files the ticket. Use as /plan followed by an idea, by the number of a needs-planning ticket, or by a prototype branch, or on "plan this", "let's plan".
argument-hint: "<idea> | <ticket#> | prototype/<name>"
---

# plan - interview, pick, file

Input: an idea, a ticket number labelled `needs-planning`, or a local `prototype/<name>` branch. Output: one ticket a build session can take, with its end-to-end example, its Implementation criteria and its blockers.

The planning branch is the one this session's worktree is on (`git branch --show-current`).

These rules hold for the whole session:

1. **Discuss until go.** Edit no repo file and file no ticket until the user says go.
2. **Never widen scope.** When the work reaches past the idea, offer the widening as its own ticket and keep this one to the idea.

## Scratch file

Write the questions and answers, each spike's result, the pick and the ticket draft to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo, at the end of every round. `<project>` is the directory that holds `memory/`; `<slug>` is the idea in kebab case or `ticket-<n>`. A restarted session reads it first.

## Start

1. Read the docs and rules the project's `CLAUDE.md` names that the idea touches.
2. `/plan <n>`: read the ticket and its comments per the `tracker` skill; the last comment holds the question the build could not answer.
3. `/plan prototype/<name>`: read the branch's diff against `main`, its tests and its stubs, listed per the `tracker` skill. The tests are the requirements the user saw working; each stub is a decision for the interview.

## Interview

1. Map the idea as a tree of decisions; each decision branches into the decisions that depend on it.
2. Open every round with that tree, redrawn short: `✓` settled, `→` asked this round, `○` waiting on the node above it.
   - Always show every top-level decision, with its answer once settled.
   - Expand only the branches that last round and this round touched.
   - Hide an answered question below the top level.

```text
#42 CSV export                         round 4
├─ ✓ Q1 output format       CSV, RFC 4180
├─ ✓ Q2 where it runs       a CLI command
│   ├─ → Q9 stream or buffer    asking now (grew from Q7: files over 1 GB)
│   └─ ○ Q10 progress output     waits on Q9
├─ → Q4 column order        asking now
└─ ○ Q6 gating              waits on Q9
```

3. Each round, ask every decision whose prerequisites are settled through `AskUserQuestion`, four per call, calls back to back. In a session over several tickets, ask about one ticket per reply. List them in the reply first, in this shape, then wait:

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

4. Send a codebase hunt to the `Explore` agent and research to `WebFetch`, and keep asking the questions that do not depend on them. A choice no user of the product sees, such as a test fixture or harness wiring, is yours: decide it and list it in the ticket.
5. Label each premise before building on it: grounded (cite the anchor), absent (say so at once), or unknown (say so, and offer a spike). State inside each question the premise it rests on.
6. Give each alternative an end-to-end example: the input as the user writes it, then its output.
7. When a term is vague or clashes with `CLAUDE.md`'s **Language**, propose one canonical term and name the synonyms it replaces.
8. Probe each boundary with a concrete scenario from the user's real use, never an invented edge case.
9. When an answer contradicts the code or an earlier answer, say so and ask which is right. Ask about the reversal of a written decision alone, before anything else.
10. Before presenting a binary, name the smallest and the largest alternative. Argue the other side, and rank each objection high, medium or low, citing a source opened this session.
11. Stop when every branch is visited and nothing is silently assumed.

## Spike

A spike runs only when the user asks for one. Decide the observable before it runs, and record the answer in the scratch file.

## Where the fix lands

1. Read the place in hand and list what a fix there changes, named and never counted: the code that moves, the tests that change, any new seam or type, and what breaks for a caller.
2. Read one level up (the caller's interface, or a shape that makes the failure unwritable) and list the same.
3. Present each level with that list through one `AskUserQuestion`, your recommendation first. For a new capability, list the shapes in the order the code rules' **Structure** gives, and recommend the first that works. Every level not picked becomes one line under the ticket's **Attempted**, with what killed it.
4. Write the picked level's seam into the ticket's `## Solution`, named and signed.
5. Write the ticket's **Where** as the folder that holds every caller, importer and re-export of each changed signature.
6. In one `AskUserQuestion`, ask whether the change ships behind a flag and how production-grade the work must be. Write the answers as the ticket's **Gating** line (`none`, or the flag and its construction site) and its **Grade** line (quick and dirty, working, or production grade).
7. Ask whether the build stacks; on the user's yes, the ticket gets the `stack` label.

## Fast-path fix

On the user's "build it now", run **Done**, then follow the `build` skill from its claim step in this session.

## Done

Size the work against one build, and ask whether it is filed as one ticket or several. Draft each ticket per the `tracker` skill and ask whether it is settled; leave its `## Assumptions` to the build, except open questions. On a no, go back to the section the objection reopens, redraft, and ask again.

The user's go is the only start of the steps below. Copy them into your reply as a `- [ ]` checklist and tick each one as it lands:

1. Write `plans/<YYYY-MM-DD>-<slug>.md` in the repo, once: the user's answers word for word, the research, the spikes, every option and why it was dropped, and the decisions. No ticket, skill or `CLAUDE.md` section points at it. Commit and push the planning branch.
2. Open the planning PR as a draft, per the `tracker` skill.
3. File the ticket per the `tracker` skill, with its blockers, a priority, its **Grade**, its **Planning PR** line and the `stack` label when the user asked for one, and add it to the board. A resumed ticket is edited in place and returned from planning.
4. Write `Part of #<n>` into the planning PR's body. A plan that started from a prototype records the branch on the ticket per the `tracker` skill.
5. Delete the scratch file. Report the ticket number, its blockers and the planning PR URL.
