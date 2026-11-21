---
name: plan
description: Plans one ticket with the user - asks until nothing answerable is left, lists where the fix could land, gets the user's pick, then files the ticket. Use as /plan followed by an idea, by the number of a needs-planning ticket, or by a prototype branch, or on "plan this", "let's plan".
argument-hint: "<idea> | <ticket#> | prototype/<name>"
---

# plan - interview, pick, file

Input: an idea, a ticket number labelled `needs-planning`, or a local `prototype/<name>` branch. Output: one ticket that a build session can take, with its end-to-end example, its Implementation criteria and its blockers.

Plan in the worktree this session launched in. Its branch is `git branch --show-current`.

These rules hold for the whole session:

1. **Discuss until go.** Edit no repo file and file no ticket until the user says go. A spike runs as a throwaway file in the scratch folder that the project's `CLAUDE.md` names.
2. **Never widen scope.** When the work reaches past the idea, offer the widening as its own ticket and keep this one to the idea.

## Scratch file

Write what the session learns to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo, at the end of every round: the questions and answers, each spike's result, the pick, and the ticket draft. `<project>` is the directory that holds `memory/`, and `<slug>` is the idea in kebab case or `ticket-<n>`. A restarted session reads it first. Delete it once the ticket is filed.

## Start

1. Read the project's `CLAUDE.md` for where docs, rules and tests live, then the docs and rules it names that the idea touches.
2. `/plan <n>`: read the ticket and its comments per the `tracker` skill. The last comments hold the question that the build could not answer.
3. `/plan prototype/<name>`: read the branch's diff against `main`, its tests and its stubs, listed per the `tracker` skill. The tests are the requirements the user saw working, each stub is a decision for the interview, and the branch shows the place in hand.

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

3. Each round, ask every decision whose prerequisites are settled through `AskUserQuestion`, four per call, calls back to back. List them in the reply first, in this shape, then wait:

```text
**Q1** - **<title>**: <the question, one idea, alternatives if they exist>
Recommend: <your answer, and why in one line>
```

4. A question that depends on an answer still open this round waits for a later round.
5. Find facts yourself: send a codebase hunt to the `Explore` agent and research to `WebFetch`, and keep asking the questions that do not depend on them. The user makes decisions.
6. Give each premise a verdict before building on it: grounded (cite the anchor), absent (say so at once), or unknown (say so, and offer a spike). State inside each question the premise it rests on.
7. Give each alternative an end-to-end example: the input as the user writes it, then its output.
8. When a term is vague or clashes with `CLAUDE.md`'s **Language**, propose one canonical term and name the synonyms it replaces.
9. Probe each boundary with an invented concrete scenario that forces a precise answer.
10. When an answer contradicts the code or an earlier answer, say so at once and ask which is right. When it reverses a written decision, ask about that reversal alone before anything else.
11. Before presenting a binary, name the smallest and the largest alternative. Argue the other side, and rank each objection high, medium or low, citing a source opened this session.
12. Stop when every branch is visited and nothing is silently assumed. Confirm the shared understanding before drafting the ticket.

## Spike

A spike runs only when the user asks for one. It is one throwaway `spike-<slug>` test case that proves or disproves a premise that nothing readable settles, kept out of the suite's tracked files. Decide the observable before running it, record the answer in the scratch file, and stop there.

## Where the fix lands

1. Read the place in hand and list what a fix there changes, named and never counted: the code that moves, the tests that change, any new seam or type, and what breaks for a caller.
2. Read one level up (the caller's interface, or a shape that makes the failure unwritable) and list the same.
3. Present each level with that list, your recommendation first, with one `AskUserQuestion`. Every level not picked becomes one line under the ticket's **Attempted**, with what killed it.
4. Write the picked level's seam into the ticket's `## Solution`, named and signed.
5. Write the ticket's **Where** as the folder the work belongs in, found from every caller, importer and re-export of each changed signature.
6. Ask whether the change ships behind a flag, and write the answer as the ticket's **Gating** line: `none`, or the flag and its construction site.
7. Ask how production-grade the work must be (quick and dirty, working, or production grade), and write the answer as the ticket's **Grade** line.
8. Ask whether the build stacks. The default is one PR, whatever the size; on the user's yes, the ticket gets the `stack` label, and the build opens one PR per layer.

## Fast-path fix

On the user's "build it now", run **Done**, then follow the `build` skill from its claim step in this session.

## Done

Draft the ticket per the `tracker` skill and ask whether it is settled. Leave its `## Assumptions` to the build, except open questions. On a no, go back to the section the objection reopens: Interview for a decision, Where the fix lands for the level. Redraft, then ask again.

The user's go is the only start of the steps below. Copy them into your reply as a `- [ ]` checklist and tick each one as it lands:

1. Write `plans/<YYYY-MM-DD>-<slug>.md` in the repo, once: the user's answers word for word, the research, the spikes, every option and why it was dropped, and the decisions. No ticket, skill or `CLAUDE.md` section points at it. Commit and push the planning branch.
2. Open the planning PR as a draft, per the `tracker` skill.
3. File the ticket per the `tracker` skill, with its blockers, a priority, its **Grade**, its **Planning PR** line and the `stack` label when the user asked for one, and add it to the board. A resumed ticket is edited in place and returned from planning.
4. Write `Part of #<n>` into the planning PR's body. A plan that started from a prototype records the branch on the ticket per the `tracker` skill.
5. Delete the scratch file. Report the ticket number, its blockers and the planning PR URL.
