---
name: plan
description: Plans one ticket with the user - asks until nothing answerable is left, lists where the fix could land, gets the user's pick, then files the ticket. Use as /outputty:plan followed by an idea, by the number of a needs-planning ticket, or by a prototype branch, or on "plan this", "let's plan".
argument-hint: "<idea> | <ticket#> | prototype/<name>"
---

# plan

Input: an idea, a ticket number labelled `needs-planning`, or a local `prototype/<name>` branch. Output: one ticket a build session can take, with its end-to-end example, its Implementation criteria and its blockers. The planning branch is the one this session's worktree is on (`git branch --show-current`).

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read the docs and rules the project's `CLAUDE.md` names that the idea touches.
  - `/outputty:plan <n>`: read the ticket and its comments per the `tracker` skill; the last comment holds the question the build could not answer.
  - `/outputty:plan prototype/<name>`: read the branch's diff against `main`, its tests and its stubs, listed per the `tracker` skill. The tests are the requirements the user saw working; each stub is a decision for the interview.
- [ ] 2. Map the idea as a tree of decisions, each branching into the decisions that depend on it, and open every round with it in the shape of [references/decision-tree.md](references/decision-tree.md).
- [ ] 3. Each round, ask every decision whose prerequisites are settled through `AskUserQuestion`, four per call, calls back to back, after listing them in the reply in the shape of [references/question.md](references/question.md).
  - Write the questions and answers, each spike's result, the pick and the ticket draft to the scratch file at the end of every round.
- [ ] 4. Stop asking when every branch is visited and nothing is silently assumed.
- [ ] 5. Read the place in hand and list what a fix there changes: the code that moves, the tests that change, any new seam or type, and what breaks for a caller.
- [ ] 6. Read one level up (the caller's interface, or a shape that makes the failure unwritable) and list the same.
- [ ] 7. Present each level with that list through `AskUserQuestion`, four per call, your recommendation first. For a new capability, list the shapes in the order the code rules' **Structure** gives, and recommend the first that works. Every level not picked becomes one line under the ticket's **Attempted**, with what killed it.
- [ ] 8. Write the picked level's seam into the ticket's `## Solution`, named and signed, and the ticket's **Where** as the folder that holds every caller, importer and re-export of each changed signature.
- [ ] 9. In `AskUserQuestion`, four per call, ask whether the change ships behind a flag and how production-grade the work must be. Write the answers as the ticket's **Gating** line (`none`, or the flag and its construction site) and its **Grade** line (quick and dirty, working, or production grade).
- [ ] 10. Ask whether the build stacks; on the user's yes, the ticket gets the `stack` label.
- [ ] 11. Size the work against one build, and ask whether it is filed as one ticket or several. Draft each ticket per the `tracker` skill and ask whether it is settled; leave its `## Assumptions` to the build, except open questions. When the interview gives no **How to validate**, work it out with the user before the ticket is settled.
  - On a no, go back to the step the objection reopens, redraft, and ask again.
- [ ] 12. On the user's go, write `plans/<YYYY-MM-DD>-<slug>.md` in the repo, once: the user's answers word for word, the research, the spikes, every option and why it was dropped, and the decisions. Commit and push the planning branch.
- [ ] 13. Open the planning PR as a draft, per the `tracker` skill.
- [ ] 14. File the ticket per the `tracker` skill, with its blockers, a priority, its **Grade**, its **Planning PR** line and the `stack` label when the user asked for one, and add it to the board. A resumed ticket is edited in place and returned from planning.
- [ ] 15. Write `Part of #<n>` into the planning PR's body. A plan that started from a prototype records the branch on the ticket per the `tracker` skill.
- [ ] 16. Delete the scratch file. Report the ticket number, its blockers and the planning PR URL.

## Fast-path fix

On the user's "build it now", run steps 11 to 16, then open the ticket's build tab per the `herdr` skill's Build case, with its goal line in the shape of the `tickets` skill's goal lines, and stop.

## Do

- Edit no repo file and file no ticket until the user says go.
- Write the scratch file to `~/.claude/projects/<project>/plans/<slug>.md`, outside the repo; `<project>` is the directory that holds `memory/`, and `<slug>` is the idea in kebab case or `ticket-<n>`. A restarted session reads it first.
- Offer a widening of scope as its own ticket and keep this one to the idea.
- Send a codebase hunt to the `Explore` agent and research to `WebFetch`, and keep asking the questions that do not depend on them.
- Decide a choice no user of the product sees, such as a test fixture or harness wiring, and list it in the ticket.
- Label each premise before building on it: grounded (cite the anchor), absent (say so at once), or unknown (say so, and offer a spike). State inside each question the premise it rests on.
- Propose one canonical term when a term is vague or clashes with `CLAUDE.md`'s **Language**, and name the synonyms it replaces.
- Probe each boundary with a concrete scenario from the user's real use.
- Say so when an answer contradicts the code or an earlier answer, and ask which is right. Ask about the reversal of a written decision alone, before anything else.
- Name the smallest and the largest alternative before presenting a binary, argue the other side, and rank each objection high, medium or low, citing a source opened this session.
- Decide the observable before a spike runs, and record its answer in the scratch file.

## Don't

## Glossary

- **Spike** - one test case that proves or disproves an assumption.
- **Seam** - the place in the code where new behaviour plugs in.
- **Round** - one reply that shows the decision tree and asks every ready question.
- **Fast-path fix** - on the user's "build it now", the planning session files the ticket and opens its build tab at once, skipping the pick.
- **Attempted** - the ticket heading that lists each level not picked and what killed it.
- **Planning PR** - the draft PR that carries the plan record and that the build lands on.
- **Stack** - one PR per layer on the planning PR, built only for a ticket labelled `stack`.
