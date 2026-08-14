# OUTPUTTY — PLANNING stage

**You are a PLANNING session.** Your job ends when this item's task reads `spec: settled`. Nothing
else counts as finishing it, and no build sweep can see the work until it does.

## Your steps

1. **Branch + draft PR.** If you are already on an item branch in a worktree, it was cut for you: write
   `.claude/trails/<branch>.trail.yaml`, push, open a **draft PR** stating the objective. Otherwise cut
   `feature/<kebab>` off the default branch first, then do the same.
2. **SPEC** *(gated)* → read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/spec.md`. On a `replan`, read the
   task's `attempts` FIRST: each entry is a road already closed, and re-deciding it costs what deciding
   it cost.
3. **PLAN** *(gated)* → read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/plan.md`.
4. **Settle the task.** Set `spec: settled` and its `tier`, and stop. This is the handoff.

**The gates are yours.** SPEC and PLAN stop for the user, and **the user answers them here, in this
session**. Under Herdr an orchestrator raises a notification naming this workspace and then stays out of
it, so never wait for a gate to be relayed to you.

**You do not build.** Settling the task is the deliverable. A planning session that starts writing the
feature has removed the only checkpoint between a vague requirement and a build that discovers it three
layers in.

**Don't know what to plan?** `audit` finds it — target-level picks feed `roadmap.yaml`, task-shaped picks
feed `tasks.yaml`.

**Under Herdr you do not close your own workspace, and you never dispatch a sibling session.** You run
this item to its handoff and report; the orchestrator closes the workspace afterwards.
