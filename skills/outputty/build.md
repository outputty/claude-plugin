# BUILD phase — hands-off

Goal: execute the approved plan without babysitting. The only interruption is a double-failure
escalation.

## Execute, layer by layer

**Baseline first.** Before the first Layer, confirm the project's test/build/lint suite is green.
If it's already red, stop and surface that — never build on a broken baseline.

For each Layer in order:

1. **Dispatch** every Task in the layer in parallel — one `outputty:task-runner` subagent per task
   (Agent tool, `agentType: "task-runner"`). Brief each like a fresh hire: its objective,
   done-condition, and scope only. Subagents are **pure workers** — they edit files and report back;
   they do NOT run git. Parallel commits into the one shared checkout corrupt each other's index, so
   committing is the orchestrator's job (step 5), serially, after QA.
2. **QA gate — two stages, evidence not vibes.**
   - **Stage 1 — spec compliance.** Does the task meet its done-condition? For non-trivial logic it
     passes only if a **test was written first, watched fail, then passed** (test-first — skip the
     literal delete-and-rewrite ceremony, just require the failing-then-passing test). Run the
     project's test/build/lint on its own exit code and read the output — a red suite is a fail, not
     a judgment call. On a rename, `grep` the old symbol across code + docs; a stale reference fails.
   - **Stage 2 — quality.** Run `ponytail-review` on the diff (over-engineering, unused abstraction,
     reinvented stdlib). Tests earn their place: prune don't add, no trivial/schema-only tests, and
     every test is full end-to-end or unit — never a partial e2e.
3. **Retry once — root cause first.** If a task fails QA, don't blind-retry: investigate the root
   cause, then re-dispatch it once as a fresh task briefed with the failure reason. Two attempts total.
4. **Escalate on double-fail.** If the retry also fails, STOP — and treat it as a signal the *design*
   may be wrong, not just the code. Surface the task, both attempts, and the QA finding to the user,
   and wait. This is the only hands-off interruption.
5. **Commit the layer serially.** Once every task in the layer passes QA, YOU (the orchestrator) make
   one commit per task — scoped to that task's files, with the task's brief as the verbose
   problem+solution message — then push once, and log any reported bugs to `.wolf/buglog.json`. Never
   let parallel workers commit into the shared checkout. Only then start the next Layer.

## OpenWolf during build

Before reading files, check `anatomy.md`; before attempting a fix, check the project's docs/READMEs
(via anatomy) rather than guessing. Log any bug you hit or fix to `buglog.json`. Record new
gotchas/conventions in `cerebrum.md`. Do not put decisions there — those are already in `product.md`.

## Merge step (last)

1. Distill the trail into `.claude/product.md`: update North Star / Architecture, **prune** anything
   now stale, keep link references tight.
2. Append a **What was tried** entry: one paragraph — beginning state, the problem, the end state you
   landed on — plus a link to `.claude/trails/<branch>.md`.
3. Update OpenWolf's `anatomy.md` for any files created/renamed/deleted.
4. **Green-gate the merge.** The full test/build/lint suite must pass on the final branch state, then
   mark the draft PR ready (`gh pr ready`) and merge it (`gh pr merge`).
