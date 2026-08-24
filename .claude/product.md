# outputty - Product

> Keep it short.

## North Star

A **single spec-driven Claude Code plugin applied to every project**, versioned and installable instead
of copy-pasted into each repo's CLAUDE.md. One spine sequences the work, so overlapping tools stop
competing for the same space.

It **builds on the platform**, never reinventing what the platform already provides.

Principles:

- **Minimum memory surfaces.** Fewest surfaces, not one file.
- **Hands-off implementation.** The human is in the loop for intent (spec) and shape (plan), then the
  build runs unattended.
- **Separate business from technical** at the questioning level: never conflate the two.

## Language

- **Layer** - one step of the dependency-ordered decomposition that `schedule` derives from the task
  graph, never hand-authored. (replaces: wave)
- **Slot** - one of the dispatcher's three concurrent children. A slot refills the moment its child
  returns, so dispatch is continuous rather than batched. (replaces: the dispatch wave)
- **Task** - one unit of work in the `tasks` MCP server, backed by a GitHub Issue. A retry is a second
  attempt, not a new task. (replaces: ripple)
- **Stage** - a task's optional maturity label (`prototype`, `build`, `sweep`) along a `deps` chain over
  one scope; it narrates the build, never a scheduler input.
- **Spike** - throwaway SPEC-phase code that answers one empirical question, then is **deleted**. (Not
  `stage: prototype`, which is kept and matured.)
- **Trail** - a task's thread of `decision`, `action` and `note` entries in the `tasks` MCP server.
- **Product memory** - the what and the why of the product: the committed `.claude/` docs. Never a home
  for how-to-work lessons.
