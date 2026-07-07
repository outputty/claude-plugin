# BUILD phase — hands-off, one dynamic workflow

Goal: execute the approved task graph without babysitting.

**BUILD is a single call to the Workflow tool** — an actual Claude Code dynamic workflow
([docs](https://code.claude.com/docs/en/workflows)), the thing that renders a workflow view and runs
`agent()`/`pipeline()`/`parallel()` in the background. Claude authors the script fresh each run from
the approved graph and passes it to the Workflow tool. **Do NOT emulate it by dispatching subagents
with the Agent tool turn-by-turn — a list of running subagents instead of a workflow view is exactly
the failure this replaces.** One Workflow call; the layer/QA/retry loop lives inside the script; only
the final verdict returns to the session.

## Before launching (main session)

1. **Green baseline.** Run the project's test/build/lint. If it's red, stop and surface it — never
   build on a broken baseline.
2. **Derive the layers.** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json` is
   `args.layers`. `schedule` already enforces non-overlap (a same-layer scope clash fails loud as a
   missing dep) and rejects cycles — there is no manual overlap check to do.
3. **Workflows must be enabled** (Claude Code v2.1.154+). BUILD has **no turn-by-turn fallback** — if
   dynamic workflows are off, stop and tell the user to enable them (`/config` → Dynamic workflows).

## Run the workflow

Call the Workflow tool with a script implementing the shape below, passing
`args = { layers, testCmd, plugin }` — `layers` from step 2, `plugin = ${CLAUDE_PLUGIN_ROOT}` (so the
in-workflow agents can shell out to `tasks.js`), each task `{ id, title, brief, scope }`. A plugin
can't ship a workflow file, so Claude authors it each run from this reference — that *is* the dynamic
workflow from the spec.

**Every agent in the workflow is pinned to Sonnet 5 at medium effort** (`{ model: 'sonnet', effort: 'medium' }`).

For each Layer in order, each Task fanned out in parallel:

1. **CAST — invent the roles this task needs.** One agent reads the task and returns the roles to run
   it: an **executor** plus the **reviewers** that fit *this* task (a schema migration → a
   data-integrity reviewer; a UI change → an a11y reviewer; a security-touching change → a security
   reviewer). Roles are charters (prompts) invented per task, **not** registered agent types.
2. **EXECUTE — the invented executor edits the task's scope.** The prompt is a fixed two-rule prefix —
   *edit only this task's scope; never run git or `tasks.js` (the commit stage does)* — plus
   test-first and the CAST specialization. Edits land in the shared checkout; the derived layers are
   scope-disjoint, so parallel editors don't collide — no worktrees.
3. **REVIEW — the invented reviewers QA in parallel.** Two invariant stages always run: **spec
   compliance** (done-condition met; for non-trivial logic a test was written, watched fail, then
   passed; the suite is green on its own exit code; a rename greps clean of the old symbol) and
   **`ponytail-review`** on the diff (over-engineering, reinvented stdlib, dead abstraction, trivial
   tests). Plus whatever task-specific lenses CAST invented. A task passes only if **every** reviewer
   passes.
4. **COMMIT — serial, gated, inside the workflow.** After a layer's tasks all finish edit+review, a
   commit agent commits each **passed** task one at a time (`git add <scope> && git commit`, the
   task's brief as the verbose problem+solution message) and marks it done in the graph
   (`tasks.js close <id>`) — serial because a shared index can't take parallel commits. Work
   discovered mid-task is filed as a new task (`tasks.js add <id> <title> --deps … --from <task>`).
   Then the next Layer starts.
5. **Retry once — root cause first.** A task that fails review is re-cast **once** with the failure
   reason baked in (investigate the root cause; don't blind-retry). Two attempts total.
6. **Escalate on double-fail.** If the retry also fails, the workflow stops and returns that task's
   verdict; the main session surfaces the task, both attempts, and the finding, and waits. Escalated
   tasks are **never** committed. This is the only hands-off interruption.
7. **Drain discovered work.** After the planned layers, run `tasks.js ready --json`; while it returns
   tasks, run them as another layer (same cast/execute/review/commit). This drains work discovered
   *during* this build (executors/reviewers filing `tasks.js add --from`). Stop when `ready` is empty.
   (Human PR-review comments land *after* the build — see the Review pass below.)

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off task-graph BUILD: cast, execute, review, serial gated commits, drain discovered work.' }
const PIN = { model: 'sonnet', effort: 'medium' }                 // every agent: Sonnet 5, medium
const bd = `node "${args.plugin}/skills/outputty/tasks.js"`      // graph engine; commit agents shell out to it
const EXECUTOR_RULES = "Edit ONLY this task's scope — never widen it. Test-first for non-trivial logic. Never run git or tasks.js; the commit stage does."

async function runLayer(layer) {
  const done = await pipeline(layer, task => runTask(task))
  for (const r of done.filter(r => r.pass))                       // serial commit + close (+ file discovered work)
    await agent(commitCloseCmd(r, bd), { ...PIN, label: `commit:${r.task.id}` })
  return done.filter(r => !r.pass)                                // [] = clean
}

for (const layer of args.layers) {                                // planned layers
  const failed = await runLayer(layer)
  if (failed.length) return { escalated: failed }
}
let more                                                           // drain discovered-from + review tasks
while ((more = await readySet(bd)).length) {                       // an agent runs `bd ready --json`
  const failed = await runLayer(more)
  if (failed.length) return { escalated: failed }
}
return { done: true }

async function runTask(task, priorFailure) {
  const cast = await agent(castPrompt(task, priorFailure), { ...PIN, label: `cast:${task.id}`, schema: CAST })
  const work = await agent(EXECUTOR_RULES + '\n' + cast.executor.charter + brief(task, priorFailure),
    { ...PIN, label: task.id, schema: WORK })                                      // executor edits shared checkout
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
> `~/.claude/projects/…`). The executor's invariants live in `EXECUTOR_RULES`; CAST only specializes.

## OpenWolf during build

Reading `anatomy.md` for navigation and `openwolf bug search <term>` before a fix are fine. **Never
write `.wolf/` by hand** — OpenWolf's own hooks own its files. There is no bug-logging step here.

## Review pass (main session, after the workflow returns — hands-off, before merge)

BUILD is one Workflow call, so it can't pause for a human; review therefore happens *after* it
returns. The human reviews the finished PR whenever they like. If they leave comments, turn each into
a task (`tasks.js add <id> <title> --from <reviewed task>`) and **re-invoke the BUILD workflow** — a
fresh Workflow call drains them through the same cast/execute/review/commit path. Repeat until the PR
is clean, then run the merge step. If no review is wanted, skip straight to merge — the default is
fully hands-off.

## Merge step (last — main session, after the workflow returns)

1. Distill the trail into `.claude/product.md`: update North Star / Architecture, **prune** anything
   now stale, keep link references tight.
2. Append a **What was tried** entry: one paragraph — beginning state, the problem, the end state you
   landed on — plus a link to `.claude/trails/<branch>.md`.
3. **Refresh OpenWolf's map:** run `openwolf scan` (never hand-edit `anatomy.md`).
4. If the change alters user-facing behaviour, install, or the flow, **update the README via the
   `outputty-documentation` skill** (per the standing rule — apply the ruleset, don't hand-edit).
5. **Green-gate the merge.** The full test/build/lint suite must pass on the final branch state and
   `openwolf scan --check` must be clean; then mark the draft PR ready (`gh pr ready`) and merge it
   (`gh pr merge`).
