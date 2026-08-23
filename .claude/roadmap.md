# outputty - Roadmap

Why each target is worth building.

## Live

### Agent-teams BUILD backend

Parallelism spans tickets, never the tasks inside one layer. An agent-teams backend would run a
layer's tasks side by side in one session. Still deferred, and queue-driven dispatch did not touch it. None
of the four conditions has moved: experimental and off by default, LLM-orchestrated rather than
deterministic, no resumption, lagging task status. A layer is packed by shared folder on purpose, so
fanning it out parallelises the set chosen for maximum file overlap.

## Shipped

1. **Queue-driven dispatch (no master pane)** - 0.78.0-0.80.0
2. **Flow spine (branch → SPEC → PLAN → BUILD → master QA → merge)** - pre-0.47; stages became skills at
   0.54.0
3. **Product memory (five prose docs by role)** - pre-0.47; prose form at 0.66.0
4. **Roadmap-rework transfer (product=why, roadmap=what, tasks=how)** -
   [#90](https://github.com/outputty/claude-plugin/pull/90)
5. **Action-first output rules** - [#89](https://github.com/outputty/claude-plugin/pull/89)
6. **Laygo-session corrections** - [#88](https://github.com/outputty/claude-plugin/pull/88)
7. **Hands-off BUILD (the session builds every layer itself)** - 0.48.0
8. **Grilling (simple, plus the advanced expert and adversary panel)** - pre-0.47
9. **SPEC spike (a `spike-<slug>` test in the repo's own suite)** - 0.13.7
10. **Discovery front-end (`audit` + playbook)** - pre-0.47
11. **Guards (secret files, dangerous commands, write boundary)** - 0.54.0
12. **Docs + diagram skills (`documentation`, `diagram`)** - pre-0.47
13. **Master QA reads whole files** - 0.54.0
14. **Herdr-native orchestration** - 0.53.0
15. **The bare-minimum cut** - 0.52.0-0.53.0
16. **Two-stage flow** - 0.54.0
17. **Skills-only conversion (no hooks; init writes the block)** - 0.54.0
18. **QA gradation + full-diff review** - 0.55.0
19. **Generic reviewer + skills at dispatch** - 0.56.0
20. **Task graph + derived layers (`tasks.js`)** - superseded 0.61.0 by the `tasks` MCP server
21. **Task graph in the trail, task state per file** - superseded 0.61.0 by the `tasks` MCP server
22. **Prose revert (product memory back to Markdown; `docs.js` deleted)** - 0.66.0

## Killed

1. **`docs.js` query tool over YAML records** - 0.66.0
2. **SIMULATE (design-fork permutations)** - 0.33.0
3. **Session→domain-skill mining (`extract-expertise`)** - 0.33.0
4. **Spike node on the committed flow diagram** - 0.53.0
