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
   *also* skips the launch prompt is their permission mode's call — the breakdown is in the two launch
   facts above. Approving that first launch is expected, not a failure.

## Run the workflow

Call the Workflow tool with a script implementing the shape below. **Embed the layers and the plugin
path directly in the script as literals — do NOT pass them via `args`.** Inline `args` can reach the
script as a JSON *string* (not an object), making `args.layers` undefined and crashing the run on the
first line. You already have both values in the session: the `schedule --json` output from step 2, and
`${CLAUDE_PLUGIN_ROOT}` — write them into the script text (each task is `{ id, title, brief, contract?, scope, lenses?, complex? }`).
A plugin can't ship a workflow file, so Claude authors it each run from this reference — that *is* the
dynamic workflow from the spec.

**Model policy.** The **executor defaults to Haiku 4.5** (`{ model: 'haiku', effort: 'medium' }`) — the
cheapest tier for scoped grunt work — and rises to **Sonnet 5** (`{ model: 'sonnet', effort: 'medium' }`)
only when the task is **complex** (PLAN sets `complex: true`) or the executor is **re-running to address
QA's findings** (the retry). The **QA agent runs on Sonnet 5** (`{ model: 'sonnet' }`, effort inherits
the session) — it is the hands-off build's only safety net, so it never drops below Sonnet. The commit
agent runs on Haiku (mechanical). Note the subagent `model` param is **family-only** —
`haiku`/`sonnet`/`opus`/`fable`, you pick a family, **not a pinned sub-version** (proven by running it:
a specific id like `claude-sonnet-4-6` is rejected). So `'sonnet'` means "the current Sonnet family",
not a version you choose.

For each Layer in order, each Task fanned out in parallel:

1. **EXECUTE — the `outputty-builder` agent edits the task's scope.** A registered agent (dispatched by
   `agentType`), so the workflow supplies only the task's brief — the boundary rules, the laziest-working-diff
   discipline, and the **self-gate** (validate own work against the done-condition with evidence, self-correct,
   hand off only when green) live in its charter ([`agents/outputty-builder.md`](../../agents/outputty-builder.md)).
   It runs on **Haiku 4.5** by default, and on **Sonnet 5** when the task is `complex` (PLAN's call) or it's the
   retry (addressing QA's findings). Edits land in the shared checkout; the derived layers are scope-disjoint,
   so parallel editors don't collide — no worktrees.
2. **REVIEW — one QA agent runs the checks in sequence.** A single `outputty-qa` agent (Sonnet 5)
   reviews the task's **scoped diff** and runs the definition-of-done in a fixed order: **spec
   compliance** (done-condition met and the `contract` satisfied; for non-trivial logic a test derived
   from the contract, watched fail, then passed; the suite green on its own exit code; a rename greps
   clean of the old symbol) → **over-engineering review**
   (reinvented stdlib, dead abstraction, avoidable dependency, trivial tests) → **each PLAN-named lens**
   (`task.lenses` — `a11y`/`security`/`data-integrity`; most tasks name none). One agent, one read of
   the diff, one structured verdict (`{ pass, checks }`) — it passes only if **every** check passes.
   (One QA agent per task, not a panel of three each re-reading the diff and re-running the suite — that
   redundancy was the build's biggest hidden cost. It keeps the executor↔reviewer boundary; it just
   collapses the three reviewers into one sequence.)
3. **COMMIT — one serial commit agent per layer, gated.** After a layer's tasks all finish edit+review,
   a **single** commit agent (Haiku — mechanical) commits each **passed** task one at a time
   (`git add <scope> && git commit`) and marks it done (`tasks.js close <id>`) — serial because a shared
   index can't take parallel commits. The message is built from the task **title + the executor's
   one-line work summary** (problem+solution), **not** the full brief re-embedded. It stages **only each
   task's scope** (never `git add -A`) and **never aborts on a dirty tree** — OpenWolf's hooks keep
   `.wolf/` perpetually dirty, so a "clean tree" precondition would refuse *every* commit. It returns
   which task ids actually committed+closed; `runLayer` escalates any passed-but-uncommitted task
   instead of moving on (a silently-skipped commit leaves the task open and the drain loop would rebuild
   finished work). Work discovered mid-task is filed as a new task
   (`tasks.js add <id> <title> --deps … --from <task>`). Then the next Layer starts.
4. **Retry once — root cause first.** A task that fails QA is re-run **once** with the verdict's findings
   baked in — on **Sonnet 5** now (addressing QA concerns), investigating the root cause, not
   blind-retrying. Two attempts total.
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
7. **Master QA — one whole-diff check vs `product.md`.** After the graph drains, a single Sonnet agent
   reviews the **whole build's diff against `product.md`** (North Star + Architecture) — catching
   cross-task drift the scoped per-task QA can't see (a change that passes every task in isolation yet
   pulls the design away from its intent). Pass → the workflow returns. Fail → escalate like a
   double-fail; nothing merges.

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off task-graph BUILD: execute, single-agent QA, one serial gated commit per layer, drain discovered work, master QA vs product.md.' }
const bd = 'node "<PLUGIN_ROOT>/skills/outputty/tasks.js"'       // <PLUGIN_ROOT> = the literal ${CLAUDE_PLUGIN_ROOT}
const LAYERS = [ /* paste `tasks.js schedule --json` here as a literal — never read from args. Task: { id, title, brief, contract?, scope, lenses?, complex? } */ ]
const execModel = (task, retry) => ({ model: (retry || task.complex) ? 'sonnet' : 'haiku', effort: 'medium' })  // Haiku default; Sonnet if complex or retry
const COMMIT = { model: 'haiku', effort: 'medium' }             // commit agent: mechanical grunt

async function runLayer(layer) {
  const done = await pipeline(layer, task => runTask(task))
  const passed = done.filter(r => r.pass)
  let committed = []
  if (passed.length) {                                           // ONE commit agent per layer — serial commits inside it, not one per task
    const c = await agent(commitLayerCmd(passed, bd), { ...COMMIT, label: `commit:${layer.map(t => t.id).join(',')}`, schema: COMMIT_OUT })
    committed = c?.committed || []                               // ids it actually committed + closed (message = title + work summary, not the brief)
  }
  const uncommitted = passed.filter(r => !committed.includes(r.task.id)).map(r => ({ ...r, pass: false }))  // passed but not committed = HARD stop
  return [...done.filter(r => !r.pass), ...uncommitted]          // [] = clean; anything here escalates
}

for (const layer of LAYERS) {                                    // planned layers (embedded, not args)
  const failed = await runLayer(layer)
  if (failed.length) return { escalated: failed }
}
let more                                                          // drain discovered-from + review tasks
while ((more = await readySet(bd)).length) {                     // an agent runs `bd ready --json`
  const strays = more.filter(t => !t.discovered_from)           // an original in `ready` = its commit never closed it
  if (strays.length) return { escalated: strays.map(task => ({ task, reason: 'original un-closed after its layer — commit failed' })) }
  const failed = await runLayer(more)
  if (failed.length) return { escalated: failed }
}
// Master QA: one whole-diff check vs product.md after the graph drains — catches cross-task drift the
// scoped per-task QA (which only ever sees one task's diff) can't see.
const master = await agent(masterQaPrompt(bd), { model: 'sonnet', label: 'master-qa', schema: QA_VERDICT })
if (!master?.pass) return { escalated: [{ reason: 'master QA: build drifts from product.md', verdict: master }] }
return { done: true }

async function runTask(task, priorFailure) {
  const work = await agent(brief(task, priorFailure),
    { ...execModel(task, !!priorFailure), agentType: 'outputty-builder', label: task.id, schema: WORK })  // rules+discipline+self-gate live in the charter
  const v = await agent(qaPrompt(task, work),                                      // ONE QA agent runs spec -> over-engineering review -> lenses in order
    { model: 'sonnet', agentType: 'outputty-qa', label: `qa:${task.id}`, schema: QA_VERDICT })  // Sonnet floor; effort inherits session
  if (v?.pass) return { task, work, pass: true }
  if (!priorFailure) return runTask(task, v)                     // single retry — executor now Sonnet, briefed with v's findings
  return { task, work, pass: false, verdict: v }                 // double-fail → escalate
}
```

> `qaPrompt(task, work)` hands the `outputty-qa` agent only the scoped diff, the done-condition, the
> task's `contract`, and `task.lenses`; the check sequence lives in the agent's own charter ([`agents/outputty-qa.md`](../../agents/outputty-qa.md)),
> so the workflow supplies *what* to check, not *how*. Per-call `model`/`effort` are real `agent()`
> options: `execModel` picks **Haiku** unless the task is `complex` or it's the retry (then **Sonnet**);
> the QA agent is pinned **Sonnet** so QA never drops below it (effort inherits the session). The
> subagent `model` param is **family-only** (`haiku`/`sonnet`/`opus`/`fable`), not a pinned sub-version.
> **Verify before a long run:** if a launch-approval card shows, use **View raw script** to confirm the
> executor is Haiku and QA is Sonnet; under hands-off (`ultracode`/bypass) it runs immediately, so open
> the saved script (path prints at launch under `~/.claude/projects/…`) and edit + relaunch if the
> routing's off.

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
5. **Retrospect — after the branch's last functional changes, before the PR finalizes.** Persist only
   what would speed the next cycle or avert a repeat mistake — distil, route, prune. Run it too when a
   cycle ends *without* merging (escalation, abandonment): failed cycles carry the richest lessons.
   - **Reflect on what the session actually holds:** the trail, any escalation verdicts that reached
     you, the user's corrections from the gated phases, and docs you fetched in-session. (BUILD's
     internals — clean retries, subagent fetches — never return to the session; don't pretend to mine
     them.) Keep a lesson only if knowing it at the next cycle's start would have saved time or averted
     a mistake.
   - **Route** per the always-on memory-routing rule: decisions are already distilled; facts OpenWolf's
     hooks captured are already home. Your one active write is the durable lesson **both missed** — a
     process lesson, a chat-only gotcha or preference, a doc worth re-reading — into Claude Code
     auto-memory: a topic-file entry plus a one-line `MEMORY.md` pointer. Topic files load on demand,
     but **the index line is paid at every session start** — replace or merge index lines, never just
     append. No auto-memory (pre-v2.1.59, or disabled)? Hand the lessons to the user in your wrap-up
     instead.
   - **Mint a skill** only for a proven, reusable, multi-step procedure — read
     [`references/skill-minting.md`](references/skill-minting.md) first. It lands in the project's
     `.claude/skills/<name>/` on this branch, so it ships with the PR (most cycles mint none).
6. **Finalize the PR via `outputty-review`.** Run its definition-of-done over the branch, then write
   the PR body in its enforced format (`.github/pull_request_template.md`) — summary bullets, one
   section each in the same order, before/after JSON for any output change.
7. **Green-gate the merge.** Commit and push the merge-step artifacts (product.md, README, any minted
   skill) to the branch — nothing merges uncommitted. The full test/build/lint suite must pass on the
   final branch state and `openwolf scan --check` must be clean; then mark the draft PR ready
   (`gh pr ready`) and merge it (`gh pr merge`).
