---
name: plan
description: 'Plans one ticket with the user and files it. Use as /plan with an idea, a ticket number or a prototype branch, or on "plan this" or "let''s plan".'
argument-hint: "<idea> | <ticket#> | prototype/<name>"
---

# plan

Input: an idea, a ticket number labelled `needs-planning`, or a `prototype/<name>` branch. Output: one ticket a build session can take, with its end-to-end example, its Implementation criteria and its blockers.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. Read the docs and rules the project's `CLAUDE.md` names that the idea touches.
  - `/plan <n>`: read the ticket and its comments per the `tracker` skill; the last comment holds the question the build could not answer.
  - `/plan prototype/<name>`: read the branch's diff against `main`, its tests and its stubs, listed per the `tracker` skill. The tests are the requirements the user saw working; each stub is a decision for the interview.
- [ ] 2. Map the idea as a tree of decisions, each branching into the decisions that depend on it, and open every round with it in the shape of [references/decision-tree.md](references/decision-tree.md).
  - Run the **XY check** first; its branches are the tree's first decision.
- [ ] 3. Each round, ask every decision whose prerequisites are settled through `AskUserQuestion`, four per call, calls back to back, after listing them in the reply in the shape of [references/question.md](references/question.md).
  - Write the questions and answers, each spike's result, the pick and the ticket draft to the scratch file at the end of every round.
- [ ] 4. Stop asking when every branch is visited and nothing is silently assumed.
- [ ] 5. Read the place in hand and list what a fix there changes: the code that moves, the tests that change, any new seam or type, and what breaks for a caller.
- [ ] 6. Read one level up (the caller's interface, or a shape that makes the failure unwritable) and list the same.
- [ ] 7. Present each level with that list through `AskUserQuestion`, four per call, your recommendation first. For a new capability, list the shapes in the order the code rules' **Structure** gives, and recommend the first that works. Every level not picked becomes one line under the ticket's **Attempted**, with what killed it.
- [ ] 8. Write the ticket's `## Solution` as the end state the pick produces: the inputs that change and the outputs once built, and for a new capability the call the user writes. Name no file, symbol or seam; the build finds them.
- [ ] 9. In `AskUserQuestion`, four per call, ask whether the change ships behind a flag and how deep its review goes. Write the answers as the ticket's **Gating** line (`none`, or the flag's name) and its **Review effort** line (`high` by default, or `low` for a ticket the user calls small and self-contained).
- [ ] 10. Ask whether the build stacks; on the user's yes, the ticket gets the `stack` label.
- [ ] 11. Size the work against one build, and ask whether it is filed as one ticket or several. Draft each ticket per the `tracker` skill and ask whether it is settled; leave its `## Assumptions` to the build, except open questions. When the interview gives no **How to validate**, work it out with the user before the ticket is settled.
  - On a no, go back to the step the objection reopens, redraft, and ask again.
- [ ] 12. On the user's yes to the draft, call `advisor` before filing: it checks each claim in the draft against its source, flags anything the problem does not need, and checks the change is the smallest that fixes the root cause. Show what it found, redraft, and ask again; file only on the user's yes to the redraft.
- [ ] 13. On the user's go, file the ticket per the `tracker` skill, with its blockers, a priority, its **Review effort**, its **Base** (`main`, or the prototype branch the plan started from) and the `stack` label when the user asked for one, and add it to the board. A resumed ticket is edited in place and returned from planning.
- [ ] 14. Post the plan record on the ticket as one comment: the user's answers word for word, the research, the spikes, every option and why it was dropped, and the decisions.
- [ ] 15. Delete the scratch file. Report the ticket number and its blockers.

### XY check

Run it before the first round, and again on any decision that works around a constraint an earlier ticket, plan record or session set. A worked case: [references/xy-check.md](references/xy-check.md).

- [ ] 1. Write the ask (Y) and the goal it serves (X), each as the end-to-end example the user would write. When the ask does not state X, make X the first question.
- [ ] 2. Read or run what X touches today, and label each premise per **Do**.
- [ ] 3. Write the least X needs to work, from first principles: its inputs, resources and invariants, such as how many connections one run holds at once.
- [ ] 4. Name each constraint that makes Y hard, and where it was set.
- [ ] 5. Branch into solutions for X, each with its end-to-end example and its cost:
  - Refuse the case: a hard requirement rejects the input behind the constraint, and is relaxed when a user needs it. List this branch every time.
  - Drop Y: X works without it.
  - Build Y as asked.
- [ ] 6. Put the branches into the tree as one decision, the one that makes X work with the least work recommended first, a new restriction included. Each branch not picked becomes one line under the ticket's **Attempted**.

### Fast-path fix

On the user's "build it now", run the **XY check** and draft its recommended branch, the others under **Attempted**; run steps 11 to 15, then open the ticket's build tab per the `herdr` skill's Build case, with its goal line in the shape of the `tickets` skill's goal lines, and stop.

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
- **XY check** - the checklist that holds the ask (Y) against the goal it serves (X) and branches into solutions for X.
- **Fast-path fix** - on the user's "build it now", the planning session files the ticket and opens its build tab at once, skipping the pick.
- **Attempted** - the ticket heading that lists each level not picked and what killed it.
- **Base** - the ticket's line naming the branch the build starts from: `main`, or a prototype branch on GitHub.
- **Stack** - one PR per layer, built only for a ticket labelled `stack`.
