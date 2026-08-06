---
type: Roadmap
title: outputty — Roadmap
description: Feature status, one row per feature, deps ordered.
timestamp: 2026-08-06
---

# outputty — Roadmap

> One row per feature. Live rows link their plan (`trails/<branch>.md`); shipped rows their PR.
> The story lives in PRs and `lessons.md` — never here.

## Where things stand

Shipped and stable at **0.13.7**: the full flow (SPEC → PLAN → BUILD → merge), the discovery front-end,
and the memory/guard layer. Current focus is coherence of the instruction set itself after a fast
0.11→0.13 run; the open items below are known, not in progress.

| Feature | Status | Depends on | Notes |
|---|---|---|---|
| Flow spine (`outputty`: branch → SPEC → PLAN → BUILD → merge) | ✅ shipped | — | gated SPEC + PLAN; hands-off BUILD |
| Product memory (`product.md` + `product-template.md`) | ✅ shipped | — | one memory surface; ✅ claims verified by a run |
| Task graph + derived layers (`tasks.js`) | ✅ shipped | flow spine | deps authored, layers derived; cycle + scope-clash fail loud |
| Hands-off BUILD (orchestrator → build agent → its own QA, ≤3 rounds) | ✅ shipped | task graph | tiered models pinned in charters; test-first DoD |
| Grilling (simple + advanced expert/adversary panel) | ✅ shipped | flow spine | engine of SPEC |
| SPEC spike (throwaway, scratchpad) | ✅ shipped | grilling | 0.13.7; optional + triggered |
| SIMULATE (design-fork permutations) | ✅ shipped | PLAN | read-only reports |
| Discovery front-end (`audit` + playbook) | ✅ shipped | product memory | feeds this roadmap + SPEC |
| Guards + hooks (environment, dangerous cmds, secrets) | ✅ shipped | — | see `docs/security.md` |
| Docs/diagram/review skills | ✅ shipped | — | `documentation`, `-diagram`, `-review` |
| Session→domain-skill mining (`extract-expertise`) | ✅ shipped | — | skill authored 0.14.0; **never run end-to-end yet** — first real run is the validation |
| `docs/flow.svg` spike node | 📋 planned | SPEC spike | diagram is otherwise current (0.13.9); adding a spike node needs layout work |
| Agent-teams BUILD backend | 📋 planned | — | deferred until it exits experimental + gains resumption (see History) |
