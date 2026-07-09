# BUILD phase — hands-off, one dynamic workflow

Goal: execute the approved task graph without babysitting.

**BUILD runs as a single Claude Code dynamic workflow** — the `Workflow` tool (a real built-in tool)
runs `agent()`/`pipeline()`/`parallel()` in the background and returns one verdict. Claude authors the
script fresh each run from the approved graph. **Do NOT emulate it by dispatching subagents with the
Agent tool turn-by-turn — a list of running subagents instead of a workflow is exactly the failure
this replaces.** The layer/QA/retry loop lives inside the script; only the final verdict returns to the
session.

Two facts about launching it — both the **user's** to set, because a skill can neither self-trigger a
workflow nor skip its approval ([docs](https://code.claude.com/docs/en/workflows)):
- **The trigger is a user opt-in.** A dynamic workflow starts from the user's prompt (`ultracode`, or
  "use a workflow" / "run a workflow") or the session setting `/effort ultracode` — not from this
  skill's text. So BUILD is *launched by the user*, not fired silently by the flow.
- **Unattended-from-run-one is the permission mode's call, not `ultracode`'s alone**
  ([docs table](https://code.claude.com/docs/en/workflows#approve-the-plan-before-it-runs)): **default /
  accept-edits** prompt *every* run until the user picks **"Yes, and don't ask again for this workflow in
  this project"**; **auto** prompts on first launch only and skips it entirely when `ultracode` is on;
  **bypass-permissions / `claude -p` / Agent SDK** never prompt. So hands-off from the first run means
  bypass / `-p` / SDK, or auto + `ultracode` — in default mode `ultracode` still shows the launch prompt
  once (then "don't ask again" silences the rest).

## Before launching (main session)

1. **Green baseline.** Run the project's test/build/lint. If it's red, stop and surface it — never
   build on a broken baseline.
2. **Derive the layers.** Run `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`
   and keep the output — you'll **embed** it in the workflow script (next section). `schedule` already
   enforces non-overlap (a same-layer scope clash fails loud as a missing dep) and rejects cycles —
   there is no manual overlap check to do.
3. **Workflows enabled, then handed to the user to launch.** Dynamic workflows must be on (Claude Code
   v2.1.154+, `/config` → Dynamic workflows) — if off, stop and tell the user to enable them; there is
   **no turn-by-turn fallback**. Then hand the launch over: tell them to start BUILD with **`ultracode`
   in the prompt** (or `/effort ultracode` for the session) — that triggers the workflow. Whether it
   *also* skips the launch prompt is their permission mode's call (bypass / `claude -p` / SDK never
   prompt; auto skips it under `ultracode`; default / accept-edits prompt once, where **"Yes, and don't
   ask again for this workflow in this project"** silences later runs). Approving that first launch is
   expected, not a failure.

## Run the workflow

Call the Workflow tool with a script implementing the shape below. **Embed the layers and the plugin
path directly in the script as literals — do NOT pass them via `args`.** Inline `args` can reach the
script as a JSON *string* (not an object), making `args.layers` undefined and crashing the run on the
first line. You already have both values in the session: the `schedule --json` output from step 2, and
`${CLAUDE_PLUGIN_ROOT}` — write them into the script text (each task is `{ id, title, brief, scope, lenses? }`).
A plugin can't ship a workflow file, so Claude authors it each run from this reference — that *is* the
dynamic workflow from the spec.

**Model policy — two tiers.** Executors and the commit step run on **Sonnet 5 / medium**
(`{ model: 'sonnet', effort: 'medium' }`) — scoped grunt work. The reviewers **set neither
`model` nor `effort`**, so they inherit the session's model and effort: the QA gate is the hands-off
build's only safety net, so it runs as strong as whatever the user launched with. Workflow agents
inherit the session model unless a call overrides it
([docs](https://code.claude.com/docs/en/workflows#cost)) — so *dropping* an executor's override only
makes that agent pricier, never the review weaker (the safe direction to fail).

For each Layer in order, each Task fanned out in parallel:

1. **EXECUTE — a static executor edits the task's scope.** No per-task casting step. The prompt is a
   fixed prefix — *edit only this task's scope; test-first for non-trivial logic; never run git or
   `tasks.js` (the commit stage does)* — plus the task's brief. Edits land in the shared checkout; the
   derived layers are scope-disjoint, so parallel editors don't collide — no worktrees.
2. **REVIEW — a static panel QA's in parallel, scoped to the task's diff.** Two invariant reviewers
   always run: **spec compliance** (done-condition met; for non-trivial logic a test was written,
   watched fail, then passed; the suite is green on its own exit code; a rename greps clean of the old
   symbol) and **`ponytail-review`** (over-engineering, reinvented stdlib, dead abstraction, trivial
   tests). Plus one reviewer per **lens PLAN named on the task** (`task.lenses` — `a11y`, `security`,
   `data-integrity`, …); most tasks name none. **Only the spec reviewer runs the suite** — it is the
   independent authority, re-running fresh rather than trusting the executor. `ponytail-review` and the
   lens reviewers read **only the task's scoped diff** (`git diff -- <scope>`, so a sibling task's
   uncommitted work never bleeds in) and **never run tests/typecheck**. A task passes only if **every**
   reviewer passes. (One suite run per task in review, not one per reviewer — the redundant
   re-verification was the build's biggest hidden cost.)
3. **COMMIT — one serial commit agent per layer, gated.** After a layer's tasks all finish
   edit+review, a **single** commit agent commits each **passed** task one at a time
   (`git add <scope> && git commit`, the task's brief as the verbose problem+solution message) and
   marks it done (`tasks.js close <id>`) — one agent, serial inside it, because a shared index can't
   take parallel commits and a per-task commit agent would each pay the full boot cost for one `git`
   call. It stages **only each task's scope** (never `git add -A`) and **never aborts on a dirty tree**
   — OpenWolf's hooks keep `.wolf/` perpetually dirty, so a "clean tree" precondition would refuse
   *every* commit. It returns which task ids actually committed+closed; `runLayer` escalates any
   passed-but-uncommitted task instead of moving on (a silently-skipped commit leaves the task open and
   the drain loop would rebuild finished work). Work discovered mid-task is filed as a new task
   (`tasks.js add <id> <title> --deps … --from <task>`). Then the next Layer starts.
4. **Retry once — root cause first.** A task that fails review is re-run **once** with the failure
   reason baked in (investigate the root cause; don't blind-retry). Two attempts total.
5. **Escalate on double-fail.** If the retry also fails, the workflow stops and returns that task's
   verdict; the main session surfaces the task, both attempts, and the finding, and waits. Escalated
   tasks are **never** committed. This is the only interruption the *workflow logic* raises — but the
   one-time launch approval (**Before launching**, above) and any shell/web/MCP call an agent makes
   that isn't in the allowlist can also prompt, so allowlist the build's commands up front. (File edits
   don't prompt: workflow subagents run in `acceptEdits`.)
6. **Drain discovered work.** After the planned layers, run `tasks.js ready --json`; while it returns
   tasks, run them as another layer (same execute/review/commit). Guard it: the drain builds **only
   `discovered_from` tasks** — if an *original* task ever surfaces in `ready`, its layer's commit didn't
   close it, so escalate rather than rebuild it. Stop when `ready` is empty. (Human PR-review comments
   land *after* the build — see the Review pass below.)

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off task-graph BUILD: execute, scoped review, one serial gated commit per layer, drain discovered work.' }
const EXEC = { model: 'sonnet', effort: 'medium' }               // executors + commit: cheap grunt. Reviewers set NO model/effort → inherit the session (strong QA gate).
const LAYERS = [ /* paste the `tasks.js schedule --json` output here as a literal — never read from args. Each task: { id, title, brief, scope, lenses? } */ ]
const bd = 'node "<PLUGIN_ROOT>/skills/outputty/tasks.js"'       // <PLUGIN_ROOT> = the literal ${CLAUDE_PLUGIN_ROOT}
const EXECUTOR_RULES = "Edit ONLY this task's scope — never widen it. Test-first for non-trivial logic. Never run git or tasks.js; the commit stage does."

async function runLayer(layer) {
  const done = await pipeline(layer, task => runTask(task))
  const passed = done.filter(r => r.pass)
  let committed = []
  if (passed.length) {                                            // ONE commit agent per layer — serial commits inside it, not one agent per task
    const c = await agent(commitLayerCmd(passed, bd), { ...EXEC, label: `commit:${layer.map(t => t.id).join(',')}`, schema: COMMIT })
    committed = c?.committed || []                                // ids it actually committed + closed
  }
  const uncommitted = passed.filter(r => !committed.includes(r.task.id)).map(r => ({ ...r, pass: false }))  // passed but not committed = HARD stop
  return [...done.filter(r => !r.pass), ...uncommitted]           // [] = clean; anything here escalates
}

for (const layer of LAYERS) {                                     // planned layers (embedded, not args)
  const failed = await runLayer(layer)
  if (failed.length) return { escalated: failed }
}
let more                                                           // drain discovered-from + review tasks
while ((more = await readySet(bd)).length) {                      // an agent runs `bd ready --json`
  const strays = more.filter(t => !t.discovered_from)            // an original in `ready` = its commit never closed it
  if (strays.length) return { escalated: strays.map(task => ({ task, reason: 'original un-closed after its layer — commit failed' })) }
  const failed = await runLayer(more)
  if (failed.length) return { escalated: failed }
}
return { done: true }

async function runTask(task, priorFailure) {
  const work = await agent(EXECUTOR_RULES + brief(task, priorFailure),
    { ...EXEC, label: task.id, schema: WORK })                                     // static executor: Sonnet/medium, edits shared checkout
  const panel = [specReviewer(task), ponytailReviewer(task), ...(task.lenses || []).map(lensReviewer)]  // spec runs the suite; ponytail + lenses read `git diff -- <scope>` only
  const reviews = await parallel(panel.map(r => () =>
    agent(r.charter + reviewCtx(task, work), { label: `${r.lens}:${task.id}`, schema: VERDICT })))              // reviewers: inherit session (strong)
  if (reviews.every(v => v?.pass)) return { task, work, pass: true }
  if (!priorFailure) return runTask(task, summarize(reviews))     // single root-caused retry
  return { task, work, pass: false, reviews }                     // double-fail → escalate
}
```

> Per-call `model`/`effort` are real `agent()` options, but silently optional: an agent with neither
> reverts to your **session** model+effort — under `ultracode` that's Opus-at-xhigh everywhere, not
> Sonnet. **Verify before a long run:** if a launch-approval card shows, use **View raw script** to
> confirm executors carry `EXEC`; under hands-off (`ultracode`/bypass) it runs immediately, so open the
> saved script (path prints at launch under `~/.claude/projects/…`) and edit + relaunch if the routing's
> off. The executor's invariants live in `EXECUTOR_RULES`; there is no casting step — PLAN names any
> extra review lenses per task.

## OpenWolf during build

Reading `anatomy.md` for navigation and `openwolf bug search <term>` before a fix are fine. **Never
write `.wolf/` by hand** — OpenWolf's own hooks own its files. There is no bug-logging step here.
Those hooks fire after **every** agent action, so the working tree is never clean during a build:
**never gate a commit on a clean `git status`** — scope the `git add` and ignore the rest.

## Review pass (main session, after the workflow returns — hands-off, before merge)

BUILD is one Workflow call, so it can't pause for a human; review therefore happens *after* it
returns. The human reviews the finished PR whenever they like. If they leave comments, turn each into
a task (`tasks.js add <id> <title> --from <reviewed task>`) and **re-invoke the BUILD workflow** — a
fresh Workflow call drains them through the same execute/review/commit path. Repeat until the PR
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
5. **Finalize the PR via `outputty-review`.** Run its definition-of-done over the branch, then write
   the PR body in its enforced format (`.github/pull_request_template.md`) — summary bullets, one
   section each in the same order, before/after JSON for any output change.
6. **Green-gate the merge.** The full test/build/lint suite must pass on the final branch state and
   `openwolf scan --check` must be clean; then mark the draft PR ready (`gh pr ready`) and merge it
   (`gh pr merge`).
