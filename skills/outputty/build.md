# BUILD phase — hands-off, one dynamic workflow

Goal: execute the approved task graph without babysitting.

**BUILD runs as a single Claude Code dynamic workflow** — the `Workflow` tool (a real built-in tool)
runs `agent()`/`pipeline()`/`parallel()` in the background and returns one verdict. Claude authors the
script fresh each run from the approved graph. **Do NOT emulate it by dispatching subagents with the
Agent tool turn-by-turn — a list of running subagents instead of a workflow is exactly the failure
this replaces.** The layer/QA/retry loop lives inside the script; only the final verdict returns to the
session.

Three facts about launching it — all the **user's** to set, because a skill can neither self-trigger a
workflow nor skip its approval ([docs](https://code.claude.com/docs/en/workflows)):
- **The trigger is the literal keyword `ultracode` in the user's message** (or `/effort ultracode` set
  for the session). Nothing else loads the `Workflow` tool — natural language ("use a workflow") also
  works, but **prefer the keyword**, and note the bare word `workflow` stopped triggering in v2.1.160.
  The tool is present **only in the turn the user sends `ultracode`**, so the flow can neither
  self-launch it nor run it in the PLAN-approval turn — a skill cannot emit the keyword on the user's
  behalf. If you find yourself about to "call the Workflow tool" and it isn't there, this is why.
- **The surface must expose the tool at all.** The keyword only works where the harness injects the
  `Workflow` tool: the **terminal CLI does** (verified live); the **Desktop app's agent pane does not**,
  regardless of the `/config` toggle or version. Ten-second probe: `/effort` missing `ultracode` (or no
  `/deep-research` command) ⇒ this surface can't run BUILD — move the session to the CLI.
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
3. **Hand the launch to the user — with the literal keyword.** You cannot start BUILD yourself (see the
   trigger fact above), so **stop and ask the user to send a new message containing `ultracode`**. Give
   them the exact text to paste, e.g.:

   > ultracode — build the approved plan

   Do **not** try to call the Workflow tool in the PLAN-approval turn (it isn't loaded → "tool not
   available"), and do **not** fall back to dispatching subagents with the Agent tool. Prerequisites to
   state if it's not working: dynamic workflows must be on (Claude Code v2.1.154+, `/config` → Dynamic
   workflows; if off, the keyword does nothing — tell them to enable it, or check for an org-level
   disable) **and** the session must be on a surface that exposes workflows (terminal CLI — see the
   third launch fact). Whether that first run also shows a launch-approval prompt is their permission
   mode's call (the facts above); approving it is expected, not a failure.

## Run the workflow — in the `ultracode` turn

The user's message now carries `ultracode`, so the Workflow tool is loaded: author the script below and
run it. **If the tool is still missing, the keyword wasn't in their message** (or workflows are off) —
ask them to resend with `ultracode`; never improvise with the Agent tool. **Embed the layers and the plugin
path directly in the script as literals — do NOT pass them via `args`.** Inline `args` can reach the
script as a JSON *string* (not an object), making `args.layers` undefined and crashing the run on the
first line. You already have both values in the session: the `schedule --json` output from step 2, and
`${CLAUDE_PLUGIN_ROOT}` — write them into the script text (each task is `{ id, title, brief, contract?, scope, lenses? }`).
A plugin can't ship a workflow file, so Claude authors it each run from this reference — that *is* the
dynamic workflow from the spec.

**Model policy — an attempt-driven ladder for code; QA pinned Sonnet.** Code starts on **Haiku 4.5**
(`{ model: 'haiku', effort: 'medium' }`): try 1 implements, try 2 patches on QA's findings. Try 3 moves
to **Sonnet** for a **complete rewrite** of the task (never a patch), and try 4 steps back to **Opus**
at the **layer** level (aggregate findings, sense-check the plan, redo — see the retry ladder, step 4).
The ladder is **attempt-driven, never planned** — there is still no per-task model knob; escalation is
earned by failure, so the cheap path stays the common path. The **QA agent runs on Sonnet 5**
(`{ model: 'sonnet' }`, effort inherits the session) — it is the hands-off build's only safety net, so
it never drops below Sonnet, and **every** rung's output, Opus included, re-passes it. The commit agent
runs on Haiku (mechanical). Note the subagent `model` param is **family-only** —
`haiku`/`sonnet`/`opus`/`fable`, you pick a family, **not a pinned sub-version** (proven by running it:
a specific id like `claude-sonnet-4-6` is rejected). So `'sonnet'` means "the current Sonnet family",
not a version you choose.

**Stage 0 — PREFLIGHT (runs first, every run, before the layer loop).** The workflow opens with a single
reconcile agent (Haiku — mechanical) **before it touches any layer**, so it runs no matter how BUILD was
entered — a direct `ultracode` resume skips the main-session preamble, so this reconciliation **cannot**
live there (that was the unreliability: sometimes we go straight to building). It squares GitHub with the
recorded task graph and **never rebuilds code**. Do these in order:
- **Draft PR exists?** Check by branch (`gh pr view --json number,state,isDraft`). Missing → open it
  (`gh pr create --draft`) with a body stating the **core objective**, per the canonical spec
  ([`references/pr-description.md`](references/pr-description.md)).
- **Local commits pushed?** `git log --oneline @{u}..HEAD` non-empty (or no upstream) → `git push`.
- **Fetch EVERY comment on the draft PR — always, not conditionally.** `gh pr view <n> --json comments`
  (paginate if needed). This is unconditional: read the real comment state first, never assume "there
  are none" and skip. Index the comments by their `<!-- outputty:layer <ids> -->` marker.
- **Fix ALL comments on the draft PR — reconcile every one to the current template.** This is a standing
  job of the reconcile, not a conditional cleanup: after fetching them, bring the whole set into
  conformance with [`references/pr-description.md`](references/pr-description.md) so the PR reads
  consistently. For every embedded layer whose tasks are **all `done`**, ensure exactly one comment for
  it — **reconstruct** a missing one (from the layer's commit messages + committed diff, posted with
  `gh pr comment`), and **rewrite** any that doesn't already conform (edit it in place, `gh api -X PATCH
  repos/{owner}/{repo}/issues/comments/{id}` with the id from the fetched comments — never a duplicate).
  Every comment ends up with the marker + the layer-named heading + the canonical format.

Even on a fresh build (no `done` tasks) the comment fetch still runs — it just finds nothing to backfill.
Then the layer loop — for each Layer in order, each Task fanned out in parallel:

1. **EXECUTE — the `outputty-builder` agent edits the task's scope.** A registered agent, dispatched by
   the **namespaced** `agentType: 'outputty:outputty-builder'` — plugin agents register under the
   plugin's `outputty:` prefix, and the **bare name errors at dispatch** (verified live: every executor
   call failed before touching the repo). The workflow supplies only the task's brief — the boundary rules, the laziest-working-diff
   discipline, and the **self-gate** (validate own work against the done-condition with evidence, self-correct,
   hand off only when green) live in its charter ([`agents/outputty-builder.md`](../../agents/outputty-builder.md)).
   It runs on **Haiku 4.5** for tries 1–2; repeated failure climbs the retry ladder (step 4 — Sonnet
   rewrite, then an Opus layer step-back). Edits land in the shared checkout; the derived layers are
   scope-disjoint, so parallel editors don't collide — no worktrees.
2. **REVIEW — one QA agent runs the checks in sequence.** A single `outputty-qa` agent (Sonnet 5,
   dispatched as `outputty:outputty-qa` — same namespacing rule)
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
3. **COMMIT + PUBLISH — one serial commit agent per layer, gated.** After a layer's tasks all finish
   edit+review, a **single** commit agent (Haiku — mechanical) commits each **passed** task one at a
   time (`git add <scope> && git commit`) and marks it done (`tasks.js close <id>`) — serial because a
   shared index can't take parallel commits. The message is built from the task **title + the
   executor's one-line work summary** (problem+solution), **not** the full brief re-embedded. It stages
   **only each task's scope** (never `git add -A`) and **never aborts on a dirty tree** — OpenWolf's
   hooks keep `.wolf/` perpetually dirty, so a "clean tree" precondition would refuse *every* commit.
   Once the layer's commits land it **pushes them** (`git push`) so they show on the draft PR, then
   **posts one PR comment for the layer** (`gh pr comment`) — a **mini PR description** built from the
   layer's task titles + work summaries per the canonical format, which the workflow **hands the commit
   agent by path** (`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` — protocol.md is
   gated out of subagents, so it can't inherit the reference; give it the path to read). Scoped to what
   this layer changed and **led by the hidden `<!-- outputty:layer <ids> -->` marker + a layer-named
   summary heading** (the layer replaces the `## Summary` heading) so a reader — and a resumed session —
   can tell which layer it is. One comment per layer, **every** layer; the full
   PR body is still written once at merge via `outputty-review`. It returns which task ids actually committed+closed; `runLayer` escalates any
   passed-but-uncommitted task instead of moving on (a silently-skipped commit leaves the task open and
   the drain loop would rebuild finished work). Work discovered mid-task is filed as a new task
   (`tasks.js add <id> <title> --deps … --from <task>`). Then the next Layer starts.
4. **Retry ladder — four tries, escalating posture, then the user.** Each rung changes *how* it works,
   not just how hard:
   - **Try 1 — Haiku, implement.** The laziest diff to the contract (step 1).
   - **Try 2 — Haiku, patch.** Re-run with QA's findings baked in; root cause, not blind retry.
   - **Try 3 — Sonnet, complete rewrite.** **Not a patch:** the brief tells the executor to treat the
     prior attempts' diff as void, set the task's scope back to its layer-start state, and rebuild the
     change **from the contract**, with both failed attempts attached as cautionary history only.
     Patching a wrong shape twice is how tokens die; the third try changes the shape.
   - **Try 4 — Opus, layer step-back.** After per-task tries are spent, one **bare Opus agent** (like
     the commit agent — no registered type) takes the **whole layer**: every failed task, the
     **aggregate of all QA findings across the layer**, and the passing tasks' diffs for context. It
     acts in two moves. **First, the sense check:** does this task/layer still make sense toward the
     target program (product.md "What we're building towards") — or is the plan itself wrong at this
     stage? If wrong, it says so and the workflow escalates **immediately, without building** — no
     tokens burned polishing a misconceived layer. **Second, the redo:** rework the failed tasks,
     deleting chunks — or all — of *their* written code and starting fresh where needed. **It never
     deletes what verifiably works:** passed tasks' code, green tests, and prior layers' commits are
     off-limits; and the guard is structural, not just prompted — everything the step-back produces
     **re-runs the same per-task QA gate** before it counts.
5. **Escalate after the ladder — to the user, in a fixed shape.** If try 4 also fails (or the
   sense check says "misconceived"), the workflow stops and returns the layer's full history; the main
   session surfaces it and waits. Escalated tasks are **never** committed. Present the escalation as:
   1. **The flow change, as a graph** — what the layer was changing, drawn per the surface: **terminal
      CLI → ASCII diagram; Claude Desktop → Mermaid** (chat renders differently by surface — the
      by-reader rule in `protocol.md`). Use the change-scoped shapes from
      [`references/pr-description.md`](references/pr-description.md) (before/after pair, or the 5-node
      added-step form).
   2. **A four-part summary, in order:** the **expected outcome** (done-condition + the target-program
      slice it serves) → **what was attempted** (one line per try: model, posture, the finding that
      killed it) → **what is still happening** (the persisting failure, with evidence) → **potential
      options** (2–4 concrete next moves, each with cost/risk, recommendation first).

   **A dead agent call is a failed try — never a dropped null.** A dispatch error, a thrown call, or a
   null return counts against the task's ladder like any other failure (fail loud); silently filtering
   a null out of the layer's results makes the layer "pass" vacuously and resurfaces as a bogus
   "original un-closed — commit failed" drain escalation (verified live: six layers "passed" with zero
   lines written). Escalation is the only interruption the *workflow logic* raises — but the one-time
   launch approval (**Before launching**, above) and any shell/web/MCP call an agent makes that isn't
   in the allowlist can also prompt, so allowlist the build's commands up front — the preflight +
   commit agents need `git`, `git push`, `gh pr view`, `gh pr create`, `gh pr comment`, `gh api` (the
   preflight edits stale comments in place), and `tasks.js`. (File edits don't prompt: workflow
   subagents run in `acceptEdits`.)
6. **Drain discovered work.** After the planned layers, run `tasks.js ready --json`; while it returns
   tasks, run them as another layer (same execute/review/commit). Guard it: the drain builds **only
   `discovered_from` tasks** — if an *original* task ever surfaces in `ready`, its layer's commit didn't
   close it, so escalate rather than rebuild it. Stop when `ready` is empty. (Human PR-review comments
   land *after* the build — see the Review pass below.)
7. **Master QA — run the target program, then check the whole diff vs `product.md`.** After the graph
   drains, a single Sonnet agent runs two checks. **First, executable acceptance:** take the program in
   product.md's **"What we're building towards"** section, run it (or its closest runnable slice if the
   build deliberately covers only part of it), and confirm the actual output matches the expected output
   the example states — the target surface is a runnable contract, not prose. **Second, drift:** review
   the whole build's diff against product.md (North Star + Architecture + Protocols) — catching
   cross-task drift the scoped per-task QA can't see (a change that passes every task in isolation yet
   pulls the design away from its intent). Both pass → the workflow returns. Either fails → escalate
   like a spent ladder (step 5's fixed shape); nothing merges.

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off task-graph BUILD: preflight reconcile (PR + comments), execute, single-agent QA, one serial gated commit per layer, drain discovered work, master QA vs product.md.' }
const bd = 'node "<PLUGIN_ROOT>/skills/outputty/tasks.js"'       // <PLUGIN_ROOT> = the literal ${CLAUDE_PLUGIN_ROOT}
const LAYERS = [ /* paste `tasks.js schedule --json` here as a literal — never read from args. Task: { id, title, brief, contract?, scope, lenses? } */ ]
const TRIES = [                                                  // per-task ladder — posture + model per try (try 4 = Opus layer step-back, in runLayer)
  { model: 'haiku',  mode: 'implement' },                        // 1: laziest diff to the contract
  { model: 'haiku',  mode: 'patch'     },                        // 2: fix QA's findings in place — root cause, not blind retry
  { model: 'sonnet', mode: 'rewrite'   },                        // 3: COMPLETE rewrite — scope back to layer-start, rebuild from the contract; attempts are history, not a base
]
const COMMIT = { model: 'haiku', effort: 'medium' }             // commit agent: mechanical grunt (commit + push + per-layer PR comment)

async function runLayer(layer) {
  const done = await pipeline(layer, task => runTask(task))     // EXACTLY one result per task — runTask never yields null; never filter a "missing" result away
  let results = done
  const failed = done.filter(r => !r.pass)
  if (failed.length) {                                           // TRY 4 — Opus layer step-back (bare agent, like commit): whole layer + ALL QA findings aggregated
    const sb = await agent(stepBackPrompt(layer, failed, done),  // move 1: sense-check vs the target program — misconceived → escalate NOW, build nothing
      { model: 'opus', effort: 'medium', label: `stepback:${layer.map(t => t.id).join(',')}`, schema: STEPBACK }).catch(() => null)
    if (!sb || sb.misconceived) return failed.map(r => ({ ...r, verdict: sb?.reason ?? 'step-back call died' }))  // → user, with the why
    results = [...done.filter(r => r.pass),                     // move 2: it redid the FAILED tasks (may delete/redo their code; passed work, green tests, prior commits are off-limits)…
      ...await pipeline(sb.reworked, r => qaTask(r.task, r.work))]  // …and every reworked task re-runs the SAME QA gate — the no-delete guard is structural, not prompted
  }
  const passed = results.filter(r => r.pass)
  let committed = []
  if (passed.length) {                                           // ONE commit agent per layer — serial commits, then push + post ONE PR comment for the layer
    const c = await agent(commitLayerCmd(passed, bd), { ...COMMIT, label: `commit:${layer.map(t => t.id).join(',')}`, schema: COMMIT_OUT })
    committed = c?.committed || []                               // ids it committed + closed; then `git push` and `gh pr comment` (mini PR description per the PR template)
  }
  const uncommitted = passed.filter(r => !committed.includes(r.task.id)).map(r => ({ ...r, pass: false }))  // passed but not committed = HARD stop
  return [...results.filter(r => !r.pass), ...uncommitted]       // [] = clean; anything here = ladder spent → escalate to the user
}

await agent(preflightCmd(LAYERS, bd), { ...COMMIT, label: 'preflight', schema: PREFLIGHT_OUT })  // Stage 0: reconcile GitHub before the loop — draft PR up (core objective), push, backfill any done-layer comment. Runs every launch; never rebuilds code.
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
// Master QA after the graph drains: (1) run product.md's "What we're building towards" program and match
// its stated expected output (executable acceptance); (2) whole-diff drift check vs product.md.
const master = await agent(masterQaPrompt(bd), { model: 'sonnet', label: 'master-qa', schema: QA_VERDICT })
if (!master?.pass) return { escalated: [{ reason: 'master QA: build drifts from product.md', verdict: master }] }
return { done: true }

async function runTask(task, n = 0, history = []) {
  const t = TRIES[n]
  const work = await agent(brief(task, t.mode, history),                           // NAMESPACED agentType — bare 'outputty-builder' errors at dispatch
    { model: t.model, effort: 'medium', agentType: 'outputty:outputty-builder', label: `${task.id}#${n + 1}`, schema: WORK }).catch(() => null)
  const r = work ? await qaTask(task, work) : { task, pass: false, verdict: 'executor call died — check the namespaced agentType' }
  if (r.pass) return r
  history = [...history, r.verdict]                              // ALWAYS truthy — a dead call is a failed try, never a dropped null (a null history entry looped forever once)
  if (n + 1 < TRIES.length) return runTask(task, n + 1, history) // climb: haiku patch → sonnet rewrite
  return { task, work, pass: false, history }                    // per-task rungs spent → Opus layer step-back (runLayer), then the user
}
async function qaTask(task, work) {                              // ONE QA gate for every rung — first try, rewrite, and Opus rework all pass through here
  const v = await agent(qaPrompt(task, work),                    // spec -> over-engineering review -> dep-direction -> lenses
    { model: 'sonnet', agentType: 'outputty:outputty-qa', label: `qa:${task.id}`, schema: QA_VERDICT }).catch(() => null)  // Sonnet floor; effort inherits session
  return v?.pass ? { task, work, pass: true } : { task, work, pass: false, verdict: v ?? 'QA call died' }
}
```

> `qaPrompt(task, work)` hands the `outputty-qa` agent only the scoped diff, the done-condition, the
> task's `contract`, and `task.lenses`; the check sequence lives in the agent's own charter ([`agents/outputty-qa.md`](../../agents/outputty-qa.md)),
> so the workflow supplies *what* to check, not *how*. Per-call `model`/`effort` are real `agent()`
> options: the executor's model follows the `TRIES` ladder (Haiku → Haiku → Sonnet rewrite, with the
> Opus step-back in `runLayer`) — escalation earned by failure, never planned — while the QA agent is
> pinned **Sonnet** so QA never drops below it (effort inherits the session). The
> subagent `model` param is **family-only** (`haiku`/`sonnet`/`opus`/`fable`), not a pinned sub-version.
> **Verify before a long run:** if a launch-approval card shows, use **View raw script** to confirm the
> `TRIES` ladder starts on Haiku, QA is Sonnet, **and every `agentType` carries the `outputty:` prefix**; under
> hands-off (`ultracode`/bypass) it runs immediately, so open
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
   the PR body in its enforced format (`references/pr-description.md`) — summary bullets, one
   section each in the same order, before/after JSON for any output change.
7. **Green-gate the merge.** Commit and push the merge-step artifacts (product.md, README, any minted
   skill) to the branch — nothing merges uncommitted. The full test/build/lint suite must pass on the
   final branch state and `openwolf scan --check` must be clean; then mark the draft PR ready
   (`gh pr ready`) and merge it (`gh pr merge`).
