# outputty — Product

> North Star + Language only — every session reads this file, so it stays small. Where things
> stand → `roadmap.md` · surface + machinery → `architecture.md` · the past → `lessons.md`.
> Every ✅ claim is verified by a run.

## North Star

A **single spec-driven Claude Code plugin applied to every project**, so
it is versioned and installable instead of copy-pasted into each repo's CLAUDE.md.

It exists to end tool fragmentation. Before outputty, the same jobs were spread across four
overlapping systems (a global work harness, OpenWolf, ponytail, grill-with-docs) that double-logged
decisions and competed for the same space. outputty is the thin spine that sequences the work and
**leans on what the platform already provides instead of reinventing it** — or, as of 0.17.0, instead
of depending on a third-party daemon for it.

Principles:
- **Minimum memory surfaces.** One product doc for decisions; Claude Code's auto-memory for durable
  lessons. Nothing else.
- **Hands-off implementation.** The human is in the loop for intent (spec) and shape (plan), then
  the build runs unattended.
- **Separate business from technical** at the questioning level — never conflate the two.

## Language

- **Layer** — the set of tasks whose deps are all done (`tasks.js ready`); **derived** from the task
  graph, not hand-authored. Layers run in sequence, and **the layer is BUILD's unit of work** — one
  builder builds all its tasks, one QA reviews them together. (Not: wave.)
- **Task** — one unit of work with `deps` + `scope`, a line in the task graph; a retry is a second
  attempt, not a new task. (Not: ripple.)
- **Stage** — a task's optional maturity role (`prototype` / `build` / `sweep`) when a large deliverable
  is split into a `deps` chain over one scope; a **label** that narrates the build, not a scheduler input.
- **Spike** — throwaway SPEC-phase code that answers one empirical question, then is **deleted**. (Not
  `stage: prototype`, which is kept and matured.)
- **Trail** — the per-branch spec thought-trail file. The task graph (`<branch>.tasks.jsonl`) lives
  beside it.
- **Product memory** vs **durable lessons** — product = what/why (outputty, `product.md`, committed);
  lessons = how-to-work-well (Claude Code auto-memory, machine-local).
