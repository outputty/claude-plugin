# outputty - Roadmap

Why each target is worth building.

## Live

### Queue-driven dispatch (no master pane)

A standing orchestrator pane costs one always-on session per repo. Half its work is pane ceremony and
half is deterministic bookkeeping. Its relay of a child's verdict cannot add information, by its own
contract. It is also the single point that must stay alive for the queue to move at all. Every shipped
product in this space converged on the queue as the coordinator, with no supervising agent above the
fleet. Replace it. Claims carry heartbeats and lane filters in the tasks server. An attended
`outputty:start` session wave-dispatches unattended background build children on a one-minute loop.
Children close or refile their own tickets, and the channel is deleted. Builds stay single-writer per
child, so within-layer parallelism stays deferred with the agent-teams row below. Ticket set:
[docs/queue-driven-dispatch.tickets.md](../docs/queue-driven-dispatch.tickets.md).

### Agent-teams BUILD backend

Parallelism today spans build sessions, never the tasks inside one layer. An agent-teams backend would
run a layer's tasks side by side in one session. Deferred until agent teams leave experimental and gain
resumption.

## Shipped

1. **Flow spine (branch → SPEC → PLAN → BUILD → master QA → merge)** - pre-0.47; stages became skills at
   0.54.0
2. **Product memory (five prose docs by role)** - pre-0.47; prose form at 0.66.0
3. **Roadmap-rework transfer (product=why, roadmap=what, tasks=how)** -
   [#90](https://github.com/outputty/claude-plugin/pull/90)
4. **Action-first output rules** - [#89](https://github.com/outputty/claude-plugin/pull/89)
5. **Laygo-session corrections** - [#88](https://github.com/outputty/claude-plugin/pull/88)
6. **Hands-off BUILD (the session builds every layer itself)** - 0.48.0
7. **Grilling (simple, plus the advanced expert and adversary panel)** - pre-0.47
8. **SPEC spike (a `spike-<slug>` test in the repo's own suite)** - 0.13.7
9. **Discovery front-end (`audit` + playbook)** - pre-0.47
10. **Guards (secret files, dangerous commands, write boundary)** - 0.54.0
11. **Docs + diagram skills (`documentation`, `diagram`)** - pre-0.47
12. **Master QA reads whole files** - 0.54.0
13. **Herdr-native orchestration** - 0.53.0
14. **The bare-minimum cut** - 0.52.0-0.53.0
15. **Two-stage flow** - 0.54.0
16. **Skills-only conversion (no hooks; init writes the block)** - 0.54.0
17. **QA gradation + full-diff review** - 0.55.0
18. **Generic reviewer + skills at dispatch** - 0.56.0
19. **Task graph + derived layers (`tasks.js`)** - superseded 0.61.0 by the `tasks` MCP server
20. **Task graph in the trail, task state per file** - superseded 0.61.0 by the `tasks` MCP server
21. **Prose revert (product memory back to Markdown; `docs.js` deleted)** - 0.66.0

## Killed

1. **`docs.js` query tool over YAML records** - 0.66.0
2. **SIMULATE (design-fork permutations)** - 0.33.0
3. **Session→domain-skill mining (`extract-expertise`)** - 0.33.0
4. **Spike node on the committed flow diagram** - 0.53.0
