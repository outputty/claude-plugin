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

1. **Green baseline — and capture the check commands.** Run the project's test/build/lint. If it's red,
   stop and surface it — never build on a broken baseline. While proving it green, **capture the exact
   commands** — lint, typecheck, test (only the ones this project actually has) — as the **`CHECKS`
   literal** for the workflow script. **The orchestrator tells every agent what to run; no agent guesses
   the toolchain.** A command enters `CHECKS` only after you ran it here and read its exit code —
   verified, not assumed from a README.
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

**Model policy — Sonnet 5 everywhere; no Haiku, no Opus.** A live run found Haiku drifting on real work
— 4 type-machinery tasks × 2 Haiku attempts, 0 successes, every one eventually rescued by a stronger
model — burning attempts and tokens without producing usable code. So **every agent in BUILD runs on
Sonnet 5** (`{ model: 'sonnet', effort: 'medium' }`): the per-layer builder, the QA agent, the commit +
Stage-0 preflight agents, and master QA. There is **no Opus step-back** — a layer that QA can't pass in
three rounds is a plan a *human* should look at, not a call an expensive Opus agent should guess (dropped
in this design). There is no posture ladder either: the one builder **patches on QA's findings** each
round (a warm loop, below), not a fresh model or a fresh cold rewrite. There is no per-task model knob.
Note the subagent `model` param is **family-only** — `haiku`/`sonnet`/`opus`/`fable`, you pick a family,
**not a pinned sub-version** (proven by running it: a specific id like `claude-sonnet-4-6` is rejected).
So `'sonnet'` means "the current Sonnet family", not a version you choose.

**Stage 0 — PREFLIGHT (runs first, every run, before the layer loop).** The workflow opens with a single
reconcile agent (Sonnet) **before it touches any layer**, so it runs no matter how BUILD was
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
Then the layer loop — for each Layer in order, **one builder ↔ one QA loop over the whole layer** (not a
per-task fan-out; the layer is the unit of work — parallelism lives in the dependency graph, PLAN splits
genuinely-wide work across layers):

1. **EXECUTE — one `outputty-builder` agent builds the whole layer, test-first.** A single registered
   agent, dispatched by the **namespaced** `agentType: 'outputty:outputty-builder'` — plugin agents
   register under the plugin's `outputty:` prefix, and the **bare name errors at dispatch** (verified
   live: every executor call failed before touching the repo). The workflow hands it **all of the layer's
   tasks** — each task's brief, its `contract`, and the layer's **union scope** — plus **`CHECKS`**. **The
   definition of done is the test:** it writes one **failing** test per task's `contract` (its worked
   input→output example) *first*, watches them fail, then writes the laziest diff that turns them green —
   the boundary rules, the discipline, and the self-gate live in its charter
   ([`agents/outputty-builder.md`](../../agents/outputty-builder.md)). It runs `CHECKS` **inside its
   development loop** (after each meaningful change, always before handoff), so type and lint errors die
   at the builder's desk, not at QA. It runs on **Sonnet 5**; on a QA fail it is re-dispatched with QA's
   findings + the current diff and **patches** (the warm loop, step 4). No Haiku, no Opus. One builder
   holds the whole layer, so its context is read once, not re-bootstrapped per task.
2. **REVIEW — one `outputty-qa` agent reviews the whole layer diff.** A single agent (Sonnet 5,
   dispatched as `outputty:outputty-qa` — same namespacing rule) reviews the **layer's diff** and runs the
   definition-of-done in a fixed order, **tests first**:
   - **Tests match specs + docs.** Every test the builder wrote is **real and discriminating** (it fails
     without the change — "would it still pass if the new code were deleted?") and **encodes its task's
     `contract`** (the worked example actually holds). A weak or absent test is the failure this gate
     exists to catch: with the test as the DoD, a gamed test is a false "done". It also **runs `CHECKS`
     once for the whole layer** as fail-loud confirmation (the builder already ran them; a lint/typecheck
     failure here is a double finding — the defect *and* the builder's skipped loop).
   - **Then the code that passed them:** over-engineering (reinvented stdlib, dead abstraction, avoidable
     dependency, defensive error-swallowing) → **docstrings** (every new/changed function: when it runs +
     outcome + an input→output example) → **implemented per spec** → **architecture matches established
     patterns** (it reads `.claude/product.md`'s Architecture for them) + **dependency direction** (a
     child never imports its composing parent) → **each PLAN-named lens** (`task.lenses` —
     `a11y`/`security`/`data-integrity`; most name none).
   One agent, one read of the layer diff, one structured verdict (`{ pass, checks }`) — it passes only if
   **every** check passes. (One QA over the whole layer, not one per task each re-running the suite — that
   per-task redundancy was the build's biggest hidden cost; the layer QA also catches cross-task
   interactions the old per-task QA structurally couldn't.)
3. **COMMIT + PUBLISH — one serial commit agent per layer, gated.** After a layer's tasks all finish
   edit+review, a **single** commit agent (Sonnet) commits each **passed** task one at a
   time (`git add <scope> && git commit`) and marks it done (`tasks.js close <id>`) — serial because a
   shared index can't take parallel commits. The message has a strict shape: **subject = the task title**
   (≤72 chars, never restated in the body) and **body = the executor's one-line problem→solution
   summary** — never the full brief re-embedded, and **never the verification transcript, scope
   disclaimers, or `.wolf` bookkeeping** (that evidence lives in the layer comment and the QA verdict;
   repeating it per commit is the ceremony that bloats a PR — verified live on a real PR). It stages
   **only each task's scope** (never `git add -A`) and **never aborts on a dirty tree** — OpenWolf's
   hooks keep `.wolf/` perpetually dirty, so a "clean tree" precondition would refuse *every* commit.
   Once the layer's commits land it **pushes them** (`git push`) so they show on the draft PR, then
   **posts one PR comment for the layer** (`gh pr comment`) — a **mini PR description** built from the
   layer's task titles + work summaries per the canonical format, which the workflow **hands the commit
   agent by path** (`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` — protocol.md is
   gated out of subagents, so it can't inherit the reference; give it the path to read). Its "What we're
   building towards" block is a **snapshot, not a copy**: the canonical target program (code from
   product.md, never paraphrased) annotated ✅ implemented / ⏳ pending as of this layer, with
   **input→output as distinct valid-JSON blocks below the code** (never inline `-> …` comments; multiple
   labelled `Run N` pairs when the behaviour needs them, e.g. SCD2). **The commit agent does NOT run the
   program and does NOT draw a diagram** — those are the costly work that made it a 9-minute step; the
   snapshot uses **marked-expected** JSON, and the **one real run + any diagram land once, in the final PR
   body** at merge (master QA runs the program; `outputty-review` writes the body — see
   [`references/pr-description.md`](references/pr-description.md)). It stays a fast, mostly-mechanical
   step: commit → push → close → a terse layer comment, **led by the hidden `<!-- outputty:layer <ids> -->`
   marker + a layer-named summary heading** (the layer replaces the `## Summary` heading) so a reader — and
   a resumed session — can tell which layer it is. One comment per layer, **every** layer; the full PR body
   is still written once at merge via `outputty-review`. It returns which task ids actually
   committed+closed; `runLayer` escalates any passed-but-uncommitted task instead of moving on (a
   silently-skipped commit leaves the task open and the drain loop would rebuild finished work). Work
   discovered mid-layer is filed as a new task (`tasks.js add <id> <title> --deps … --from <task>`). Then
   the next Layer starts.
4. **The warm loop — build ↔ QA, up to three rounds, then the user.** One builder builds the layer, one
   QA reviews it; on a fail the **same builder is re-dispatched** with QA's findings + the current diff
   and **patches** — root cause, not a blind retry. It loops at most **three QA rounds** on Sonnet; there
   is no posture ladder and **no Opus step-back**. Why three-then-human: a layer QA can't pass in three
   rounds of concrete findings is far more likely a **plan** problem than a coding one — and a wrong plan
   is a *human's* call at the gate, not an expensive agent's guess. So the fourth failure escalates to you
   (step 5) rather than spending an Opus rung to reason about the plan on your behalf.
5. **Escalate after three rounds — to the user, in a fixed shape.** If the third QA round still fails, the
   workflow stops and returns the layer's full history; the main session surfaces it and waits. Escalated
   work is **never** committed. **A `blocked` result skips the loop entirely** — the builder hit a scope
   or API wall (a done-condition unreachable inside the declared scope, or unimplementable against the
   current API; see its charter) and reported `{ blocked, reason, neededScope?, evidence }` instead of
   silently substituting a deliverable. That escalates **immediately and cheaply** — no rounds burned: the
   session amends the layer's scope in the tasks JSONL (or files a discovered task) and relaunches. Present
   the escalation as:
   1. **The flow change, as a graph** — what the layer was changing, drawn per the surface: **terminal
      CLI → ASCII diagram; Claude Desktop → Mermaid** (chat renders differently by surface — the
      by-reader rule in `protocol.md`). Use the change-scoped shapes from
      [`references/pr-description.md`](references/pr-description.md) (before/after pair, or the 5-node
      added-step form).
   2. **A four-part summary, in order:** the **expected outcome** (the failing test(s) + the
      target-program slice they serve) → **what was attempted** (one line per round: the finding that
      killed it) → **what is still happening** (the persisting failure, with evidence) → **potential
      options** (2–4 concrete next moves, each with cost/risk, recommendation first).

   **A dead agent call is a failed round — never a dropped null.** A dispatch error, a thrown call, or a
   null return counts against the layer's three rounds like any other failure (fail loud); silently
   filtering a null out of the layer's results makes the layer "pass" vacuously and resurfaces as a bogus
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
   the example states — the target surface is a runnable contract, not prose. This is the **one real run**
   of the whole surface (the per-layer commit agents don't run it); `outputty-review` reuses its output as
   the final PR body's real JSON. **Second, drift:** review the whole build's diff against product.md
   (North Star + Architecture + its seams) — catching **cross-layer** drift no single layer QA can see (a
   change that passes every layer in isolation yet pulls the design away from its intent). Both pass → the
   workflow returns. Either fails → escalate like a spent loop (step 5's fixed shape); nothing merges.

Reference shape:

```js
export const meta = { name: 'outputty-build', description: 'Hands-off task-graph BUILD: preflight reconcile (PR + comments), then per layer one builder + one QA looping ≤3 rounds, one serial gated commit, drain discovered work, master QA vs product.md.' }
const bd = 'node "<PLUGIN_ROOT>/skills/outputty/tasks.js"'       // <PLUGIN_ROOT> = the literal ${CLAUDE_PLUGIN_ROOT}
const LAYERS = [ /* paste `tasks.js schedule --json` here as a literal — never read from args. Task: { id, title, brief, contract?, scope, lenses? } */ ]
const CHECKS = { /* the green-baseline's verified commands, embedded as a literal — e.g. { lint: 'npm run lint', typecheck: 'npx tsc --noEmit', test: 'npm test' }. builderBrief()/qaLayer() embed these: the orchestrator dictates the toolchain; agents never guess it */ }
const EXEC = { model: 'sonnet', effort: 'medium' }              // SONNET EVERYWHERE — no Haiku (drifted on real work), no Opus (a 3-round-stuck layer is a human's call, not an agent's)
const ROUNDS = 3                                                 // warm build↔QA loop cap; the 4th failure escalates to the user, not to a model step-up
const COMMIT = { model: 'sonnet', effort: 'medium' }            // commit + preflight (reused): mechanical commit/push/close + a terse layer comment (no program run, no diagram)
const ids = layer => layer.map(t => t.id).join(',')

async function runLayer(layer) {                                 // returns [] = clean; a non-empty array = escalate to the user
  // ONE builder builds the WHOLE layer, test-first: a failing test per task contract, then code to green.
  let work = await agent(builderBrief(layer, CHECKS), {          // NAMESPACED agentType — bare 'outputty-builder' errors at dispatch
    ...EXEC, agentType: 'outputty:outputty-builder', label: `build:${ids(layer)}`, schema: WORK }).catch(() => null)
  if (!work) return [{ layer, reason: 'builder call died — check the namespaced agentType' }]
  if (work.blocked) return [{ layer, blocked: true, reason: work.reason, neededScope: work.neededScope, evidence: work.evidence }]  // scope/API wall — no rounds burned, escalate for a scope amendment

  for (let round = 1; round <= ROUNDS; round++) {                // ONE QA over the whole layer diff; on fail, SAME builder patches on findings
    const v = await agent(qaLayer(layer, work, CHECKS), {        // tests-match-specs+docs first, then code quality/patterns (reads product.md's Architecture)
      ...EXEC, agentType: 'outputty:outputty-qa', label: `qa:${ids(layer)}#${round}`, schema: QA_VERDICT }).catch(() => null)
    if (v?.pass) break                                           // → commit
    if (round === ROUNDS) return [{ layer, work, verdict: v, reason: `QA unmet after ${ROUNDS} rounds` }]  // → user, 4-part shape
    work = await agent(builderBrief(layer, CHECKS, v), {         // re-dispatch with QA's findings + the current diff — patch, not a cold rewrite
      ...EXEC, agentType: 'outputty:outputty-builder', label: `build:${ids(layer)}#${round + 1}`, schema: WORK }).catch(() => null)
    if (!work) return [{ layer, reason: 'builder call died mid-loop' }]  // a dead call is a failed round, never a dropped null
  }
  // Passed → ONE commit agent: serial commits + push + a terse layer comment (no run, no diagram).
  const c = await agent(commitLayerCmd(layer, work, bd), { ...COMMIT, label: `commit:${ids(layer)}`, schema: COMMIT_OUT }).catch(() => null)
  const committed = c?.committed || []                           // ids it committed + closed
  const uncommitted = layer.filter(t => !committed.includes(t.id))  // passed but not committed = HARD stop (a silent skip leaves the task open and the drain would rebuild it)
  return uncommitted.length ? [{ layer, work, reason: 'passed but not committed — commit failed', uncommitted }] : []
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
// its stated expected output (the one real run of the whole surface); (2) whole-diff drift check vs product.md.
const master = await agent(masterQaPrompt(bd), { model: 'sonnet', label: 'master-qa', schema: QA_VERDICT })
if (!master?.pass) return { escalated: [{ reason: 'master QA: build drifts from product.md', verdict: master }] }
return { done: true }
```

> `builderBrief(layer, CHECKS, verdict?)` hands the **one** `outputty-builder` the whole layer — every
> task's brief + `contract`, the union scope, and `CHECKS` — plus, on a re-dispatch, the last QA
> `verdict` to patch against. `qaLayer(layer, work, CHECKS)` hands the **one** `outputty-qa` the layer's
> diff, each task's `contract` + `lenses`, and `CHECKS`; the check sequence (tests-match-specs+docs first,
> then code quality) lives in the agent's own charter
> ([`agents/outputty-qa.md`](../../agents/outputty-qa.md)) — the workflow supplies *what* to check, not
> *how*. Per-call `model`/`effort` are real `agent()` options: **every** agent runs on `EXEC` (Sonnet) —
> no Haiku, no Opus — and the loop escalates by handing the same builder QA's findings, never by stepping
> up a model. The subagent `model` param is **family-only** (`haiku`/`sonnet`/`opus`/`fable`), not a
> pinned sub-version. **Verify before a long run:** if a launch-approval card shows, use **View raw
> script** to confirm every agent is Sonnet (no Haiku, no Opus) **and every `agentType` carries the
> `outputty:` prefix**; under hands-off (`ultracode`/bypass) it runs immediately, so open the saved script
> (path prints at launch under `~/.claude/projects/…`) and edit + relaunch if the routing's off.

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

1. Distill the trail into `.claude/product.md`: update North Star / Status & roadmap (flip shipped
   features to ✅) / Language / What we're building towards / Architecture, **prune** anything now stale,
   keep link references tight. **Verify before you write** — any ✅-shipped behaviour you document is run
   in the codebase first, real output, no guessing (the template's hard rule).
2. Append a **History** entry: one paragraph — beginning state, the problem, the end state you landed on
   — plus a link to `.claude/trails/<branch>.md`.
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
