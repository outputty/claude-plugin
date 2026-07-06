# PLAN phase — architecture into layers/tasks, gated

Goal: a dependency-ordered build plan the BUILD phase can execute hands-off.

## Produce

1. **Architecture delta.** What in `product.md`'s Architecture changes or is added. Keep it lazy
   (ponytail): reuse before build, no speculative structure.
2. **Task breakdown.** Each task has: objective, a concrete done-condition (checkable, not "improve
   X"), scope (files/paths), and dependencies. Granularity: small enough for one subagent to hold
   from a self-contained brief.
3. **Layers.** Group tasks with no unmet dependencies into a Layer. Layer 1 = no deps; Layer 2 =
   depends only on Layer 1; etc. Layers run in sequence, tasks within a layer in parallel.

Write the plan (layers + tasks) into `.claude/trails/<branch>.md` under a `## Plan` heading.

## Gate

Present the layers and tasks to the user. Wait for an explicit OK. If they change scope, revise the
trail and re-present. This is the last gate — after it, BUILD runs unattended.
