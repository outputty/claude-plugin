# BUILD phase — hands-off, run as a dynamic workflow

Goal: execute the approved layers without babysitting. BUILD runs as a **dynamic workflow**
([docs](https://code.claude.com/docs/en/workflows)) that Claude authors fresh each run from the
approved plan — the layer/QA/retry loop lives in a script, so only the final verdict lands back in
the session's context. The only interruption is a double-failure escalation.

## Before launching (main session)

1. **Green baseline.** Run the project's test/build/lint. If it's red, stop and surface it — never
   build on a broken baseline.
2. **Non-overlap check.** Confirm no two tasks *in the same layer* share a scope path. This is what
   makes the shared checkout safe for parallel editors: if two same-layer tasks touch a file they
   belong in different layers — fix the plan and re-gate before launching.
3. **Workflows must be enabled** (Claude Code v2.1.154+). BUILD has **no turn-by-turn fallback** — if
   dynamic workflows are off, stop and tell the user to enable them (`/config` → Dynamic workflows).

## Launch the workflow

Author and run a dynamic workflow implementing the shape below, passing the approved layers as
`args`: `{ layers: [[task, …], …], testCmd }`, each task `{ id, objective, doneCondition, scope, brief }`.
A plugin can't ship a workflow file, so Claude writes it each run from this reference — that *is* the
"dynamic workflow from the spec".

**Every agent in the workflow is pinned to Sonnet 5 at medium effort** (`{ model: 'sonnet', effort: 'medium' }`).

For each Layer in order, each Task fanned out in parallel:

1. **CAST — invent the roles this task needs.** One agent reads the task and returns the roles to run
   it: an **executor** plus the **reviewers** that fit *this* task (a schema migration → a
   data-integrity reviewer; a UI change → an a11y reviewer; a security-touching change → a security
   reviewer). Roles are charters (prompts) invented per task, **not** registered agent types.
2. **EXECUTE — the invented executor edits the task's scope.** Dispatched with
   `agentType: 'task-runner'` (the base worker charter: shared checkout, no git, test-first) plus the
   CAST specialization. Edits land in the shared checkout; the non-overlap check keeps parallel
   editors collision-free — no worktrees.
3. **REVIEW — the invented reviewers QA in parallel.** Two invariant stages always run: **spec
   compliance** (done-condition met; for non-trivial logic a test was written, watched fail, then
   passed; the suite is green on its own exit code; a rename greps clean of the old symbol) and
   **`ponytail-review`** on the diff (over-engineering, reinvented stdlib, dead abstraction, trivial
   tests). Plus whatever task-specific lenses CAST invented. A task passes only if **every** reviewer
   passes.
4. **COMMIT — serial, gated, inside the workflow.** After a layer's tasks all finish edit+review, a
   commit agent commits each **passed** task one at a time (`git add <scope> && git commit`, the
   task's brief as the verbose problem+solution message) — serial because a shared index can't take
   parallel commits — and logs any reported bug to `.wolf/buglog.json`. Then the next Layer starts.
5. **Retry once — root cause first.** A task that fails review is re-cast **once** with the failure
   reason baked in (investigate the root cause; don't blind-retry). Two attempts total.
6. **Escalate on double-fail.** If the retry also fails, the workflow stops and returns that task's
   verdict; the main session surfaces the task, both attempts, and the finding, and waits. Escalated
   tasks are **never** committed. This is the only hands-off interruption.

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off layered BUILD: cast roles, execute, review, serial gated commits.' }
const PIN = { model: 'sonnet', effort: 'medium' } // every agent: Sonnet 5, medium effort

for (const layer of args.layers) {
  const done = await pipeline(layer, task => runTask(task))
  for (const r of done.filter(r => r.pass))                       // serial, gated commits
    await agent(commitCmd(r), { ...PIN, label: `commit:${r.task.id}` })
  if (done.some(r => !r.pass)) return { escalated: done.filter(r => !r.pass) } // stop; session surfaces
}
return { done: true }

async function runTask(task, priorFailure) {
  const cast = await agent(castPrompt(task, priorFailure), { ...PIN, label: `cast:${task.id}`, schema: CAST })
  const work = await agent(cast.executor.charter + brief(task, priorFailure),
    { ...PIN, agentType: 'task-runner', label: task.id, schema: WORK })            // executor edits shared checkout
  const lenses = [specReviewer(task), ponytailReviewer(task), ...cast.reviewers]   // invariants + invented lenses
  const reviews = await parallel(lenses.map(r => () =>
    agent(r.charter + reviewCtx(task, work), { ...PIN, label: `${r.lens}:${task.id}`, schema: VERDICT })))
  if (reviews.every(v => v?.pass)) return { task, work, pass: true }
  if (!priorFailure) return runTask(task, summarize(reviews))     // single root-caused retry
  return { task, work, pass: false, reviews }                     // double-fail → escalate
}
```

> `agent()`'s per-call `model`/`effort` work in the runtime but aren't in the public docs yet — if a
> run ignores the pin, confirm the keys against the script Claude actually generated (saved under
> `~/.claude/projects/…`). `agentType: 'task-runner'` supplies the executor's invariant base charter;
> CAST only specializes it.

## OpenWolf during build

The executor and reviewers check `anatomy.md` before reading files and the project's docs before
guessing a fix. Bugs are reported up and written to `buglog.json` by the commit stage (parallel
writers would race the file). New gotchas/conventions go in `cerebrum.md` — never decisions, those
live in `product.md`.

## Merge step (last — main session, after the workflow returns)

1. Distill the trail into `.claude/product.md`: update North Star / Architecture, **prune** anything
   now stale, keep link references tight.
2. Append a **What was tried** entry: one paragraph — beginning state, the problem, the end state you
   landed on — plus a link to `.claude/trails/<branch>.md`.
3. Update OpenWolf's `anatomy.md` for any files created/renamed/deleted.
4. **Green-gate the merge.** The full test/build/lint suite must pass on the final branch state, then
   mark the draft PR ready (`gh pr ready`) and merge it (`gh pr merge`).
