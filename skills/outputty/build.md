# BUILD phase — hands-off, orchestrator + nested subagents

Goal: execute the approved task graph without babysitting.

**BUILD runs as plain subagents dispatched by this session — no dynamic workflow, no `ultracode`.** The
orchestrator (you) walks the layers in order and hands each one to a **build agent**; that agent works
its layer, spawns its **own QA subagent**, and only finishes when QA passes. Nothing needs a special
keyword, a launch-approval card, or a freshly-authored script.

```
orchestrator (this session)
  └─ build agent   (layer N)      ← Sonnet/low, holds the layer, drives tasks.js
       └─ QA agent (layer N)      ← Sonnet/xhigh, spawned BY the builder, read-only
```

Nesting is supported: *"a subagent can spawn subagents of its own, up to three layers below the main
conversation"* — orchestrator → builder → QA is depth 2, well inside the default (verified by running:
a nested spawn returned cleanly). `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` must not be set to `1`.

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

   **Also capture a `watch` command if the project has one** (`vitest`, `jest --watch`, `pytest-watch`,
   `cargo watch -x test`) — re-running a cold suite after every edit is the single biggest time sink in a
   build (measured on a real session: **183 of 615 shell calls were test runs**, 46 of them full
   multi-package sweeps at ~10s per package). Verify it starts and writes output. No watch mode → skip
   every watcher step below; agents just run `CHECKS` directly.

2. **Start the test watcher — one background task for the whole build.** Launch it with **Bash
   `run_in_background: true`**, writing to a log every build agent can read:

   ```bash
   ( <CHECKS.watch> ) > "$WATCH_LOG" 2>&1     # run_in_background: true
   ```

   Keep the `$WATCH_LOG` path; every build agent's prompt carries it. **Kill it at the end of the build**
   (and if a layer's edits leave it wedged, restart it between layers — a watcher is disposable).

3. **Derive the layers.** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`.
   `schedule` already enforces non-overlap (a same-layer scope clash fails loud as a missing dep) and
   rejects cycles — there is no manual overlap check to do. **This is the build agent's todo list**: the
   graph is file-backed in `<branch>.tasks.jsonl`, so it survives across agents (a subagent has no
   `TodoWrite` and no Task tools — verified by running — and a private in-agent list would die with the
   agent anyway, which is exactly wrong when each layer gets a fresh one).

4. **Preflight — reconcile GitHub before the first layer.** One Haiku agent squares GitHub with the
   recorded graph and **never rebuilds code**:
   - **Drift check.** Read the trail's `Planned-at:` SHA. If `git diff --stat <planned-at>..HEAD` is
     non-empty, the graph was authored against an older tree — report it, and **stop for the user only if
     the drift invalidates a task's scope**. (The orchestrator *can* pause now; use that.)
   - **Draft PR exists?** `gh pr view --json number,state,isDraft`; missing → `gh pr create --draft` with
     a body stating the **core objective**, per [`references/pr-description.md`](references/pr-description.md).
   - **Push** any unpushed commits.
   - **Fetch EVERY comment** (`gh pr view <n> --json comments`) — unconditionally, never assume none —
     index them by their `<!-- outputty:layer <ids> -->` marker, and **reconcile every one** to the
     current template: reconstruct a missing comment for any all-`done` layer, rewrite any that doesn't
     conform (`gh api -X PATCH …`, never a duplicate).

## The layer loop

For each layer in dependency order, **spawn one build agent** (`subagent_type:
'outputty:outputty-builder'` — the **namespaced** name; the bare name errors at dispatch) and hand it:

- **its layer's tasks** — each brief, `contract`, and the layer's **union scope**;
- **`CHECKS`** and the **`$WATCH_LOG`** path;
- the reminder that `tasks.js ready --json` / `tasks.js close <id>` are its todo list.

The build agent then owns the whole layer, end to end: it writes a failing test per `contract`, codes to
green, **spawns its own `outputty:outputty-qa` subagent**, and loops on QA's findings **up to three
rounds**. It returns only:

| Result | Orchestrator does |
|---|---|
| `passed` — QA green | commit the layer (below), then the next layer |
| `blocked` — scope/API wall | **stop and escalate to the user**; no rounds were burned |
| `unmet` — 3 QA rounds spent | **stop and escalate**; a layer QA can't pass in three rounds of concrete findings is a **plan** problem for a human, not a model step-up |

**Escalation shape (unchanged):** (1) the flow change as a graph — ASCII in the terminal CLI, Mermaid in
Desktop, scoped per [`references/pr-description.md`](references/pr-description.md); (2) a four-part
summary — **expected outcome** (done-condition + the target-program slice it serves) → **what was
attempted** (one line per round + the finding that killed it) → **what is still happening** (with
evidence) → **options** (2–4 concrete moves, recommendation first). Escalated layers are **never**
committed.

**Commit + publish (orchestrator, after a layer passes).** One Haiku agent commits each passed task
serially (`git add <scope> && git commit`, then `tasks.js close <id>`) — serial because a shared index
can't take parallel commits. Subject = the task title (≤72 chars, never restated in the body); body =
the builder's one-line problem→solution summary — never the brief, the verification transcript, scope
disclaimers, or `.wolf` bookkeeping. It stages **only each task's scope** (never `git add -A`) and
**never aborts on a dirty tree** (OpenWolf's hooks keep `.wolf/` perpetually dirty, so a clean-tree
precondition would refuse every commit). Then `git push` and **one PR comment per layer** — a mini PR
description per the canonical spec, which you hand it **by path**
(`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`; protocol.md is gated out of
subagents). It does **not** run the program and does **not** draw a diagram; the snapshot uses
marked-expected JSON, and the one real run + any diagram land once, at master QA / the final body.
A passed-but-uncommitted task is a **hard stop** — a silent skip leaves it open and the drain rebuilds it.

**Drain discovered work.** After the planned layers, `tasks.js ready --json`; while it returns tasks, run
them as another layer. Guard it: only `discovered_from` tasks may drain — an *original* surfacing in
`ready` means its commit never closed it, so escalate rather than rebuild.

**Master QA — once, at the end.** One **Opus** agent runs two checks: **executable acceptance** — take
product.md's *What we're building towards* program, run it (or its closest runnable slice), confirm the
actual output matches the stated expected output; and **drift** — review the whole build's diff against
product.md (North Star + Architecture + seams), catching cross-layer drift a per-layer review can't see.
Either fails → escalate like a spent loop; nothing merges.

## Model policy — tiered by role, pinned in each charter

Set in the agent's **frontmatter**, not at the call site: `model` picks the family, and **`effort`
overrides the session effort** for that agent. Pinning it in the charter is why the tier survives without
a script re-pasting it every run.

| Agent | `model` | `effort` | Why |
|---|---|---|---|
| `outputty-builder` | `sonnet` | `low` | writes code against a failing test it wrote first; the test constrains it |
| `outputty-qa` | `sonnet` | `xhigh` | the judgment-heavy safety net — maximum thinking |
| master QA | `opus` | `xhigh` | the final whole-build gate, runs once |
| preflight + commit | `haiku` | `medium` | mechanical git + a terse comment |

**No Haiku for code or review** — a live run found it drifting on real code (4 type-machinery tasks × 2
attempts, 0 successes). **No Opus rebuild** — Opus *reviews* at master QA, it never redoes stuck work.
There is no posture ladder and no model step-up: the same builder patches on QA's findings each round.
`model` is family-only (`haiku`/`sonnet`/`opus`/`fable`) or a full ID.

> **Unverified:** that `effort:` in frontmatter takes effect was read in the docs, not reproduced —
> a newly-written agent file doesn't register until the session restarts. If it turns out inert, effort
> silently inherits the session's, which is the pre-0.15 behaviour; `model` **is** verified by running.

## OpenWolf during build

Reading `anatomy.md` for navigation and `openwolf bug search <term>` before a fix are fine. **Never
write `.wolf/` by hand** — OpenWolf's own hooks own its files. There is no bug-logging step here.
Those hooks fire after **every** agent action, so the working tree is never clean during a build:
**never gate a commit on a clean `git status`** — scope the `git add` and ignore the rest.

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
3. **Refresh OpenWolf's map:** run `openwolf scan` (never hand-edit `anatomy.md`).
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
6. **Finalize the PR via `qa`.** Run its definition-of-done over the branch, then write
   the PR body in its enforced format (`references/pr-description.md`) — summary bullets, one
   section each in the same order, before/after JSON only when a real record/file/API payload changes
   (a flow change with no record diff gets a before/after **graph** instead — that spec is canonical).
7. **Green-gate the merge.** Commit and push the merge-step artifacts (product.md, README, any minted
   skill) to the branch — nothing merges uncommitted. The full test/build/lint suite must pass on the
   final branch state and `openwolf scan --check` must be clean; then mark the draft PR ready
   (`gh pr ready`) and merge it (`gh pr merge`).
