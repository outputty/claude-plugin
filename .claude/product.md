# outputty - Product

> North Star + Language only. Every session reads this file, so it stays small. Where things stand →
> `roadmap.md` · surface + machinery → `architecture.md` · the past → `lessons.md`. Every ✅ claim is
> verified by a run.

## North Star

A **single spec-driven Claude Code plugin applied to every project**, so it is versioned and
installable instead of copy-pasted into each repo's CLAUDE.md.

It exists to end tool fragmentation. Before outputty, the same jobs were spread across four overlapping
systems (a global work harness, OpenWolf, ponytail, grill-with-docs) that double-logged decisions and
competed for the same space. outputty is the thin spine that sequences the work and **builds on what
the platform already provides instead of reinventing it**, or, as of 0.17.0, instead of depending on a
third-party daemon for it.

Principles:

- **Minimum memory surfaces.** Five product docs for decisions, one per role, read whole; the `tasks`
  MCP server for the task graph and its trails; Claude Code's auto-memory for durable lessons. Nothing
  else. (The count rose from one file to six sets in 0.47.0, the task graph and trails moved to the
  `tasks` MCP at 0.61.0, and 0.66.0 reverted the sets to prose docs read whole. The principle is
  *fewest surfaces*, not *one file*, and a 1,494-line monolith was the thing it protected against.)
- **Hands-off implementation.** The human is in the loop for intent (spec) and shape (plan), then the
  build runs unattended.
- **Separate business from technical** at the questioning level: never conflate the two.

## Language

Every canonical term, one line: the definition, then the rejected synonyms it replaces. Current
vocabulary only; a dead term is deleted (or its story goes to `lessons.md`). Pin a term here **before**
using it in the other docs.

- **Layer** - the set of tasks whose deps are all done (`list_ready`); **derived** from the task graph,
  not hand-authored. Layers run in sequence, and **the layer is BUILD's unit of work**: one builder
  builds all its tasks, one QA reviews them together. (replaces: wave)
- **Task** - one unit of work: a task in the `tasks` MCP server carrying `deps` + `scope` + `tier` +
  `qa` + `spec`, backed by a GitHub Issue. Its trail is the task's comment thread (`append_trail` /
  `get_trail`). A retry is a second attempt, not a new task. (replaces: ripple)
- **Stage** - a task's optional maturity role (`prototype` / `build` / `sweep`) when a large
  deliverable is split into a `deps` chain over one scope; a **label** that narrates the build, not a
  scheduler input.
- **Spike** - throwaway SPEC-phase code that answers one empirical question, then is **deleted**. (Not
  `stage: prototype`, which is kept and matured.)
- **Trail** - a task's spec thought-trail: its comment thread of `decision` / `action` / `note`
  entries in the `tasks` MCP server (`append_trail` / `get_trail`).
- **Product memory** - what/why (outputty, `product.md`, committed), as distinct from **durable
  lessons**, the how-to-work-well kept in Claude Code auto-memory (machine-local).
