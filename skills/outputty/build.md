# BUILD phase — hands-off, orchestrator + nested subagents

Goal: execute the approved task graph without babysitting.

**BUILD runs as plain subagents dispatched by this session — no dynamic workflow, no `ultracode`.** The
orchestrator (you) walks the layers in order and hands each one to a **build agent**; that agent works
its layer, spawns its **own QA subagent**, and only finishes when QA passes. Nothing needs a special
keyword, a launch-approval card, or a freshly-authored script.

```
orchestrator (this session)
  └─ build agent   (layer N)      ← Sonnet/low, holds the whole layer, writes code
       └─ QA agent (layer N)      ← Sonnet/xhigh, spawned BY the builder, read-only
```

Nesting is supported, and the default has room: *"By default, a subagent can spawn subagents of its own,
up to three layers below the main conversation."* The builder sits at depth 1 and spawns QA from there,
so this shape needs `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` **≥ 2**.

**Two environment facts are load-bearing — check them before trusting a hands-off run.**

- **Version floor: v2.1.219 or later.** Nesting defaulted to **1** in v2.1.217–v2.1.218 — a builder there
  cannot spawn QA at all. v2.1.219 raised the default to 3.
- **At the depth limit the `Agent` tool is *withheld*, not errored.** *"At the depth limit, Claude Code
  withholds the `Agent` tool from every subagent"* — so a builder that is over the limit doesn't get a
  loud dispatch failure, it simply finds itself with no way to spawn QA. That is the dangerous failure
  mode: silent, and it looks like a builder that just didn't bother. The builder's charter therefore
  treats a missing `Agent` tool as **`blocked`**, never as licence to self-certify.
- **`CLAUDE_CODE_FORK_SUBAGENT=1` breaks the foreground contract** — fork mode *"removes the
  `run_in_background` parameter from the `Agent` tool"* and forces every subagent to the background, so
  the sequential layer loop stops blocking. `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` takes precedence
  over fork mode and keeps subagents in the foreground.

**Why the orchestrator stays in the loop.** A workflow returned one verdict at the end and could not
pause; the orchestrator can course-correct after any layer, and a failure surfaces when it happens
instead of at the end. It also spawns **one build agent per layer, in sequence** — each starts with a
clean context, so nothing accretes across the build.

## Before starting (main session)

1. **Green baseline — and capture the check commands.** Run the project's test/build/lint. If it's red,
   stop and surface it — never build on a broken baseline. While proving it green, **capture the exact
   commands** — lint, typecheck, test (only the ones this project actually has) — as the **`CHECKS`** you
   hand every agent. **The orchestrator tells every agent what to run; no agent guesses the toolchain.**
   A command enters `CHECKS` only after you ran it here and read its exit code — verified, not assumed.

   **Find the watch command — this is not optional.** Re-running a cold suite after every edit is the
   single biggest time sink in a build (measured on a real session: **183 of 615 shell calls were test
   runs**, 46 of them full multi-package sweeps at ~10s per package). Nearly every modern runner has a
   watch mode (`vitest`, `jest --watch`, `pytest-watch`, `cargo watch -x test`, `go test` under `air`),
   so **"the project has no watch mode" is a conclusion you reach after looking, never a step you skip**.
   Check the manifest's scripts and the test runner's flags. Verify it starts and writes output.

   Only when the runner genuinely has none: say so once in the recap, and agents run `CHECKS` directly.
   A silent skip here is how the whole watcher chain no-ops and the build burns its time re-running
   green tests.

2. **Start the test watcher before anything else runs — one background task for the whole build.**
   It goes up **before preflight and before layer 1**, so the first builder already has a warm log
   instead of paying for a cold suite. Launch it with **Bash `run_in_background: true`**, writing to a
   log every build agent can read:

   ```bash
   ( <CHECKS.watch> ) > "$WATCH_LOG" 2>&1     # run_in_background: true
   ```

   Keep the `$WATCH_LOG` path; every build agent's prompt carries it. **Kill it at the end of the build**
   (and if a layer's edits leave it wedged, restart it between layers — a watcher is disposable).

3. **Derive the layers.** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`.
   `schedule` already enforces non-overlap (a same-layer scope clash fails loud as a missing dep) and
   rejects cycles — there is no manual overlap check to do. **This graph is *your* ledger, not the build
   agent's** — it is file-backed in `<branch>.tasks.jsonl`, so it survives across agents, and only two
   stages ever write it: you (`schedule`, `add`) and the commit stage (`close`). A build agent never runs
   `tasks.js` at all; you copy its layer's tasks **into its prompt**, and that inline list is its todo
   list. This split is forced, not stylistic: **the Task tools (`TaskCreate`/`TaskGet`/`TaskList`/
   `TaskUpdate`/`TaskOutput`) are withheld from subagents** — only agent-team teammates keep them
   (verified by running: a subagent reports none of them) — so a subagent cannot share your ledger. And
   even a private list it *could* keep would die with the agent, which is exactly wrong when each layer
   gets a fresh one. (`TodoWrite` is a different case: the subagent filters do **not** strip it, so don't
   rely on its absence — the build agent lacks it only because its charter's `tools` allowlist omits it.)

4. **Preflight — reconcile GitHub before the first layer.** One Haiku agent squares GitHub with the
   recorded graph and **never rebuilds code**:
   - **Drift check.** Read the trail's `Planned-at:` SHA. If `git diff --stat <planned-at>..HEAD` is
     non-empty, the graph was authored against an older tree — report it, and **stop for the user only if
     the drift invalidates a task's scope**. (The orchestrator *can* pause now; use that.)
   - **Can this repo stack at all?** `gh extension list | grep gh-stack`. Missing extension, or a repo
     without stacked PRs enabled, is a **hard stop before any layer runs** — there is no fallback shape,
     so report it with the install command and let the user fix it.
   - **Draft PR exists?** `gh pr view --json number,state,isDraft`; missing → `gh pr create --draft` with
     a body stating the **core objective**, per [`references/pr-description.md`](references/pr-description.md).
     This PR is the stack's bottom.
   - **Push** any unpushed commits, then `gh stack sync` so local and remote agree on the stack.
   - **Reconcile the stack, not comments.** `gh stack view` for the recorded layers, and for every
     all-`done` layer confirm it has a PR whose body matches the current template — reconstruct a missing
     one, rewrite (`gh pr edit --body-file`) any that doesn't conform, never open a duplicate.

## The layer loop

For each layer in dependency order, **spawn one build agent** and hand it its work. Two dispatch details
are load-bearing:

- **`subagent_type: 'outputty:outputty-builder'`** — the **namespaced** name. The bare name errors at
  dispatch.
- **`run_in_background: false`** — subagents run in the **background by default**, which would let the
  orchestrator race ahead to the next layer instead of waiting. You need this layer's result before the
  next one starts, so every build-agent dispatch is **foreground**. (Foreground also gets the fuller
  built-in tool set; background is the reduced one.)

Hand it:

- **its layer's tasks** — each brief, `contract`, and the layer's **union scope**;
- **`CHECKS`** and the **`$WATCH_LOG`** path;
- the explicit statement that **the tasks in this prompt are its todo list** — it never runs `tasks.js`,
  and the commit stage closes each task once the layer passes.

The build agent then owns the whole layer, end to end: it writes a failing test per `contract`, codes to
green, **spawns its own `outputty:outputty-qa` subagent**, and loops on QA's findings **up to three
rounds**. It returns only:

| Result | Orchestrator does |
|---|---|
| `passed` — QA green | **surface the layer write-up + recap** (below), commit the layer, then the next layer |
| `blocked` — scope/API wall | **stop and escalate to the user**; no rounds were burned |
| `unmet` — 3 QA rounds spent | **stop and escalate**; a layer QA can't pass in three rounds of concrete findings is a **plan** problem for a human, not a model step-up |

**Returns are a convention, not a schema.** The Agent tool has no structured-output option — a subagent
returns **its final text**. So every charter states the exact shape to end with (`passed` + per-task
summaries, or `blocked` + reason/neededScope/evidence, or `unmet` + verdict/history), and the
orchestrator **reads that text defensively**: if a result is unparseable or empty, treat it as a failed
layer and escalate — never as a silent pass. A dead or errored dispatch is a failed layer too, never a
dropped result.

## Between layers — what the user sees

A hands-off build is not a silent one. After **every** layer, print two things, in this order. This is
the only window the user gets into a build they're deliberately not babysitting, so it goes to the
terminal whether or not anyone asked — and it is **relayed, not re-summarized**: the builder already did
the work of writing it.

**1. The layer write-up — the builder's text, verbatim.** Same shape the PR comment gets (see
[`references/pr-description.md`](references/pr-description.md)): what the layer did in plain language,
the *What we're building towards* program annotated **✅ done / ⏳ pending**, and input/output as
separate ` ```json ` blocks. Its output JSON is **expected, not run** and stays labelled that way — the
one real run happens at master QA. Don't paraphrase it into a sentence; the code and the example are the
payload, and collapsing them defeats the point.

**2. A running session recap** — cumulative, not just this layer, so the user can drop in at any point
and see where the build stands. Three tables:

```markdown
| Layer | What it did | State |
|---|---|---|
| 1 · engine | unified the two write paths | ✅ merged |
| 2 · preamble | 9 leaf modules moved behind the barrel | ✅ merged |
| 3 · cases-split | 3,210 lines → 82-line barrel + 11 case files | 🔄 CI running |

| Issue caught | Where | Resolution |
|---|---|---|
| test asserted on a stale fixture | QA round 1 | ✅ fixed — fixture rebuilt from real data |
| `parse_row` swallows a decode error | builder self-gate | ✅ fixed — now raises with the offending row |
| barrel re-exports shadow 2 names | QA round 2 | ⏳ deferred → task `t-31` (drains after layer 4) |

| Next | Why it's next |
|---|---|
| Layer 4 · wire the CLI | last planned layer; depends on 3 |
| Drain `t-31` | discovered work, blocked until the barrel lands |
```

**Rules that keep the recap honest.** Every deferred issue **names the task id it became** — "deferred"
without an id is how work disappears, so if it isn't in the graph it isn't deferred, it's dropped. An
issue QA raised and the builder fixed still appears: rounds burned are signal about the plan, not noise
to hide. And **"what's next" comes from `tasks.js`**, never from memory of the plan.

**Keep it hands-off: allowlist the build's commands first.** Foreground subagents pass permission prompts
straight through to the user, so an un-allowlisted command stalls the build waiting on you. Before
starting, allowlist what the build actually runs: the project's `CHECKS`, plus `git`, `git push`,
`gh pr view`, `gh pr create`, `gh pr comment`, `gh api`, and `tasks.js`. (File edits don't prompt under
`acceptEdits`.)

**Escalation shape (unchanged):** (1) the flow change as a graph — ASCII in the terminal CLI, Mermaid in
Desktop, scoped per [`references/pr-description.md`](references/pr-description.md); (2) a four-part
summary — **expected outcome** (done-condition + the target-program slice it serves) → **what was
attempted** (one line per round + the finding that killed it) → **what is still happening** (with
evidence) → **options** (2–4 concrete moves, recommendation first). Escalated layers are **never**
committed. **Print the session recap under it too** — a stopped build is exactly when the user needs to
see which layers already landed and what was deferred; there is no layer write-up to relay, because the
layer never passed.

**Commit + publish (orchestrator, after a layer passes).** One Haiku agent commits each passed task
serially (`git add <scope> && git commit`, then `tasks.js close <id>`) — serial because a shared index
can't take parallel commits. Subject = the task title (≤72 chars, never restated in the body); body =
the builder's one-line problem→solution summary — never the brief, the verification transcript, scope
disclaimers, or tooling bookkeeping. It stages **only each task's scope** (never `git add -A`) and
**never aborts on a dirty tree** (other tools write into the working tree during a build, so a
clean-tree precondition would refuse every commit).
A passed-but-uncommitted task is a **hard stop** — a silent skip leaves it open and the drain rebuilds it.

**Then publish the layer as its own PR, stacked** — see the section below. The builder's write-up becomes
that PR's **body**, posted verbatim: the builder held the context, and a Haiku agent re-deriving the same
write-up from commit messages and a diff can only guess. The stage's job is to open the PR, **not** to
compose its description — don't rewrite it, don't re-summarize it, don't add a diagram. Only if the
builder returned no write-up do you fall back to deriving one from the commits + diff, against the
canonical spec handed to you **by path**
(`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`; protocol.md is gated out of
subagents) — and that fallback is a **defect worth reporting**, not a normal path. Either way the stage
does **not** run the program: the snapshot's JSON stays marked-expected, and the one real run + the one
diagram land at master QA / the final body.

## Layers ship as a stack of PRs

A layer is already the right unit for review: `schedule` derives them in dependency order, and layer N+1
builds on layer N. That is exactly a **stack**, so BUILD publishes **one PR per layer** rather than one
PR carrying every layer's diff. A reviewer opens layer 3 and sees layer 3's diff, not forty files.

**`gh stack` is required** (`gh extension install github/gh-stack`), like `gh` itself. **There is no
single-PR fallback** — a build that cannot stack is a build that cannot publish, so assert the extension
at preflight and **escalate before the first layer** if it is missing or stacked PRs aren't enabled on
the repo. Failing at branch-cut costs the user one install; discovering it after three layers means
unpicking commits from a branch shape that was never going to publish.

**The branch-cut PR is the bottom of the stack.** Step 1 already opens a draft PR carrying the trail and
the scoping diff; layer branches stack on top of that branch, so the stack reads
`main ← feature/<x> ← feature/<x>-l1 ← feature/<x>-l2 …`.

### The stack order IS the dependency order — and why linear is right

A stack is a linear chain; a task graph is a DAG. That looks like a mismatch, but for the layers
`schedule` derives it isn't one, and the reason is worth stating because it is what makes the stack
correct rather than merely convenient.

`schedule` is a Kahn leveling: a task lands in the **earliest** layer where all its deps are done.
So if a task were not blocked by layer N, it would already have been placed at layer N or lower.
**Therefore every layer N+1 contains at least one task depending on layer N** — consecutive layers are
always genuinely dependent, and stacking layer N+1 on layer N states a real relationship.

Verified by running `schedule` on a graph built to break it:

```text
layer 1: t1                       depends on layer(s): -
layer 2: t2 t8                    depends on layer(s): 1      ← t8 deps ONLY t1, lands at 2, not later
layer 3: t3                       depends on layer(s): 2
layer 4: t7                       depends on layer(s): 1,3    ← spans layers; still includes 3
```

A task that depends only on layer 1 **is** a layer-2 task, so it already stacks directly on layer 1.
A layer whose deps span layers 1 and 3 still depends on 3, so it still belongs above it.

**Assert it rather than trust it.** Before opening the stack, map each task's `deps` to the layer holding
them and confirm layer N+1 resolves to layer N. If one doesn't, the graph and the stack shape disagree —
**escalate, don't guess a base branch**:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json
# for each layer N+1: some task's deps must resolve into layer N
```

**Drained work is the one real exception.** Discovered tasks come from `ready`, not `schedule`, so a task
added during layer 1 (`tasks.js add … --from t1`) may depend only on layer 1 yet run as a layer *after*
layer 3. Stack it **on top anyway**: its branch then carries layers 1–3's code, its diff still shows only
its own change, and the false dependency costs nothing because the whole stack merges atomically. Cutting
it from layer 1 instead would make it a sibling, not a stack member — and GitHub stacks are linear, so
that would need a second stack for no review benefit.

**Name layers with a hyphen, never a slash.** `feature/<x>/l1` is rejected by git the moment
`feature/<x>` exists as a branch — a ref cannot also be a directory
(`cannot lock ref … 'refs/heads/feature/<x>' exists`), and the bottom of the stack is always that
branch. Verified by running: this is a hard git constraint, not a style preference.

Per layer, after its commits land on its own branch:

```bash
git checkout -b feature/<x>-l<N>               # off the previous layer's branch, not off main
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file <the builder's write-up>
```

**Set the title explicitly.** `--auto` names each PR after its branch, so a stack ships as
"feature/incremental source port l6" — ten PRs no reviewer can tell apart in a list. The title is the
write-up's `## <what this layer did>` heading, which already says it in plain language.

**Two flags are load-bearing, and both are hands-off traps.** `gh stack init` with **no arguments demands
interactive input** (`interactive input required; provide branch names as arguments`) — always pass the
branch names, which you already have from `schedule`. And `gh stack submit` **opens an editor** unless
you pass **`--auto`**; with `--auto` new PRs are created as **drafts** (add `--open` only if you want them
ready for review, which BUILD does not — nothing is ready until master QA).

**Rebasing is a new failure mode.** If a lower layer changes after a higher one exists — a QA round that
patches layer 1 while layer 2 is already open — the branches above it need `gh stack sync` (or
`gh stack rebase`). A **conflict there is an escalation**, exactly like a spent QA loop: stop, report the
conflicting layers, and let a human resolve it. Never force-resolve a rebase inside a hands-off build.

**Drain discovered work.** After the planned layers, `tasks.js ready --json`; while it returns tasks, run
them as another layer. Guard it: only `discovered_from` tasks may drain — an *original* surfacing in
`ready` means its commit never closed it, so escalate rather than rebuild.

**Master QA — once, at the end.** One **Opus** agent runs two checks: **executable acceptance** — take
product.md's *What we're building towards* program, run it (or its closest runnable slice), confirm the
actual output matches the stated expected output; and **drift** — review the whole build's diff against
product.md (North Star + Architecture + seams), catching cross-layer drift a per-layer review can't see.
Either fails → escalate like a spent loop; nothing merges.

## Model policy — tiered by role

**Only a chartered agent can pin `effort`.** The `Agent` tool takes a `model` override but has **no
`effort` parameter** (that was a `Workflow` `agent()` option and did not survive the migration), so a
role dispatched ad-hoc can pin its family and nothing else — its effort inherits the session's. Roles
with a file in `agents/` set both in frontmatter, which is why their tier survives without a caller
re-pasting it every run.

| Agent | `model` | `effort` | Pinned where | Why |
|---|---|---|---|---|
| `outputty-builder` | `sonnet` | `low` | charter | writes code against a failing test it wrote first; the test constrains it |
| `outputty-qa` | `sonnet` | `xhigh` | charter | the judgment-heavy safety net — maximum thinking |
| master QA | `opus` | *inherits* | call site (`model`) | the final whole-build gate, runs once |
| preflight + commit | `haiku` | *inherits* | call site (`model`) | mechanical git + a terse comment |

Inherited effort is acceptable for preflight and commit — they are mechanical. It is a **known gap for
master QA**, which wants `xhigh` and will instead run at whatever the session is set to; giving it a
charter in `agents/` is the fix.

**No Haiku for code or review** — a live run found it drifting on real code (4 type-machinery tasks × 2
attempts, 0 successes). **No Opus rebuild** — Opus *reviews* at master QA, it never redoes stuck work.
There is no posture ladder and no model step-up: the same builder patches on QA's findings each round.
`model` is family-only (`haiku`/`sonnet`/`opus`/`fable`) or a full ID.

Frontmatter `effort` is documented and verified: *"Effort level when this subagent is active. Overrides
the session effort level. Default: inherits from session. Options: `low`, `medium`, `high`, `xhigh`,
`max`."* In the 2.1.220 loader it is parsed and validated exactly like `model` and applied at spawn as a
permission layer — the same layer the effort resolver reads — so a typo fails loudly (`Plugin agent
file … has invalid effort`) rather than silently inheriting.

**One thing outranks every charter: `CLAUDE_CODE_EFFORT_LEVEL`.** *"The environment variable takes
precedence over all other methods… Frontmatter effort applies when that skill or subagent is active,
overriding the session level but not the environment variable."* If that variable is set, every tier in
the table above collapses to it — QA included. Check it before blaming a build's quality on the tiers.

## Navigation and memory during build

**Navigate with the LSP** where the language has a server — go-to-definition and find-references, and
diagnostics after each edit that catch a type error without a compiler run. `Grep`/`Glob` are the floor
otherwise. A memory naming a file you are about to edit is surfaced automatically by the `memory-recall`
hook; read it before the edit, not after.

**No memory is written during a build.** Lessons are collected once, at the merge step's retrospective —
capturing per-edit is how a memory store fills with noise nobody reads. Other tools may leave the working
tree dirty, so **never gate a commit on a clean `git status`** — scope the `git add` and ignore the rest.

## Review pass (main session, before merge)

The human reviews the finished PR whenever they like. If they leave comments, turn each into a task
(`tasks.js add <id> <title> --from <reviewed task>`) and **run another layer** — the same
build-agent→QA path drains them. Repeat until the PR is clean, then run the merge step. If no review is
wanted, skip straight to merge — the default is fully hands-off.

## Merge step (last — main session, after the final layer)

1. Distill the trail into `.claude/product.md`: update North Star / Status & roadmap (flip shipped
   features to ✅) / Language / What we're building towards / Architecture, **prune** anything now stale,
   keep link references tight. **Verify before you write** — any ✅-shipped behaviour you document is run
   in the codebase first, real output, no guessing (the template's hard rule).
2. Append a **History** entry: one paragraph — beginning state, the problem, the end state you landed on
   — plus a link to `.claude/trails/<branch>.md`.
4. If the change alters user-facing behaviour, install, or the flow, **update the README via the
   `documentation` skill** (per the standing rule — apply the ruleset, don't hand-edit).
5. **Retrospect — after the branch's last functional changes, before the PR finalizes.** Persist only
   what would speed the next cycle or avert a repeat mistake — distil, route, prune. Run it too when a
   cycle ends *without* merging (escalation, abandonment): failed cycles carry the richest lessons.
   - **Reflect on what the session actually holds:** the trail, any escalation verdicts that reached
     you, the user's corrections from the gated phases, and docs you fetched in-session. (A build agent's
     internals — clean retries, its QA child's rounds — never return to the session; don't pretend to
     mine them.) Keep a lesson only if knowing it at the next cycle's start would have saved time or averted
     a mistake.
   - **Route** per the always-on memory-routing rule: decisions are already distilled into
     `product.md`. Your one active write is the durable lesson — a process lesson, a gotcha or
     preference, a doc worth re-reading — into Claude Code auto-memory: a topic-file entry plus a
     one-line `MEMORY.md` pointer. **Name the file the lesson is about** so the recall hook can surface
     it on a later edit. Topic files load on demand,
     but **the index line is paid at every session start** — replace or merge index lines, never just
     append. No auto-memory (pre-v2.1.59, or disabled)? Hand the lessons to the user in your wrap-up
     instead.
   - **Mint a skill** only for a proven, reusable, multi-step procedure — read
     [`references/skill-minting.md`](references/skill-minting.md) first. It lands in the project's
     `.claude/skills/<name>/` on this branch, so it ships with the PR (most cycles mint none).
6. **Finalize the PR via `qa`.** Run its definition-of-done over the branch, then write
   the PR body in its enforced format (`references/pr-description.md`) — summary bullets, one
   section each in the same order, before/after JSON only when a real record/file/API payload changes
   (a flow change with no record diff gets a before/after **graph** instead — that spec is canonical).
7. **Bump the plugin version** in `.claude-plugin/marketplace.json` whenever the branch touched
   `hooks/`, `skills/`, or `agents/`. **That version is the cache key** — `plugin update` is a *no-op*
   until it changes, so shipping behaviour without a bump means no user ever receives it, silently and
   with no error. Patch for a fix, minor for new behaviour or a new skill. (Verified the hard way: three
   PRs once landed on `main` unbumped and were undeliverable.)
8. **Green-gate the merge.** Commit and push the merge-step artifacts (product.md, README, any minted
   skill) to the **top** branch of the stack — nothing merges uncommitted. The full test/build/lint suite
   must pass on the final state. Then mark every PR in the stack ready (`gh pr ready <n>`) and land the
   whole stack **atomically**:

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

   **Atomicity is the point, and it is what preserves the existing rule that nothing merges on an
   escalation.** A stack with one unmergeable layer merges zero layers, so a half-built feature can never
   reach the default branch. Non-interactive runs (and `--yes`) merge the whole stack without prompting;
   without `--yes` a wizard opens, which would stall a hands-off build.
