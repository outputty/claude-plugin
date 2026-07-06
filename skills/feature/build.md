# BUILD phase — hands-off

Goal: execute the approved plan without babysitting. The only interruption is a double-failure
escalation.

## Execute, layer by layer

For each Layer in order:

1. **Dispatch** every Task in the layer in parallel — one `outputty:task-runner` subagent per task
   (Agent tool, `agentType: "task-runner"`). Brief each like a fresh hire: its objective,
   done-condition, and scope only. Each subagent commits its own work when done.
2. **QA gate.** When the layer's tasks return, verify each against its done-condition. Evidence,
   not vibes: run whatever verification the project has (tests, build, lint) and read the output.
   Also check the diff against **ponytail** (over-engineering, unused abstraction, reinvented
   stdlib) using the `ponytail-review` skill.
3. **Retry once.** If a task fails QA, re-dispatch it once as a fresh task, briefed with the
   failure reason. Two attempts total per task.
4. **Escalate on double-fail.** If the retry also fails, STOP. Surface the task, both attempts, and
   the QA finding to the user, and wait. This is the only hands-off interruption.
5. Only start the next Layer once the current one passes.

## OpenWolf during build

Before reading files, check `anatomy.md`. Log any bug you hit or fix to `buglog.json`. Record new
gotchas/conventions in `cerebrum.md`. Do not put decisions there — those are already in `product.md`.

## Merge step (last)

1. Distill the trail into `.claude/product.md`: update North Star / Architecture, **prune** anything
   now stale, keep link references tight.
2. Append a **What was tried** entry: one paragraph — beginning state, the problem, the end state you
   landed on — plus a link to `.claude/trails/<branch>.md`.
3. Update OpenWolf's `anatomy.md` for any files created/renamed/deleted.
4. Merge `feature/<branch>` into the default branch.
