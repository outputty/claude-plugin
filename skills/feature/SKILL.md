---
name: feature
description: Drive a feature or change from intent to shipped code using the outputty spec-driven flow — grill business + technical goals, plan into layers/tasks, then build hands-off. Use whenever the user asks to build, add, change, refactor, or fix something non-trivial, or says "outputty", "spec this", "scope this", or "let's build X".
---

# outputty — feature flow

You are orchestrating a spec-driven flow. Three phases, one feature branch. You hold the
orchestration; the detail for each phase lives in a sibling file you `Read` **when you enter that
phase** (progressive disclosure — do not read all three up front).

## Preconditions

- OpenWolf must be initialised (`.wolf/`). The SessionStart hook already enforces this; if you were
  told work is blocked, stop and have the user run `openwolf init`.
- `.claude/product.md` was injected at session start. It is the North Star + Architecture. Trust it
  as current; it is pruned, not append-only.

## Vocabulary (use these exact words)

- **Layer** — a batch of tasks with no unmet dependencies, dispatched in parallel. Layers run
  strictly in sequence.
- **Task** — one unit of work = one subagent dispatch. A retry is a second task, not a new one.
- **Trail** — the per-branch file `.claude/trails/<branch>.md`. Holds the scoping thought-trail,
  the plan's layers/tasks, and build outcomes. Layers live inside a trail.

## Flow

1. **Cut the branch.** One branch for the whole cycle: `feature/<kebab-desc>` off the default
   branch. Create `.claude/trails/<branch>.md`.
2. **SPEC** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/feature/spec.md` and follow it.
3. **PLAN** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/feature/plan.md` and follow it.
4. **BUILD** *(hands-off)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/feature/build.md` and follow it.
5. **Merge step** (end of BUILD) — distill the trail into `product.md`, prune stale content, append
   the "What was tried" entry, then merge the branch to the default branch.

## Standing rules (all phases)

- **ponytail governs the build.** Laziest working diff, stdlib/native/existing-dep before new code,
  no speculative abstraction. It is an active dependency — defer to it, don't re-derive it.
- **OpenWolf owns operational memory.** Check `anatomy.md` before reading files; log bugs to
  `buglog.json`; put gotchas/conventions/preferences in `cerebrum.md`. **Decisions do NOT go in
  cerebrum** — they go in `product.md`.
- **Gates are real.** SPEC and PLAN stop for the user. BUILD is hands-off: the only interruption is
  escalating a task that fails QA twice.
