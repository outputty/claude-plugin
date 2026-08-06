---
name: outputty
description: Drive a feature from intent to shipped code with the outputty spec-driven flow — grill goals, plan a task graph, build hands-off. Use when asked to build, add, change, or refactor something worth scoping first, or on "outputty", "spec this", "scope this", "let's build X". A small, well-understood fix doesn't need the flow.
---

# outputty — feature flow

You are orchestrating a spec-driven flow. Three phases, one feature branch. You hold the
orchestration; the detail for each phase lives in a sibling file you `Read` **when you enter that
phase** (progressive disclosure — do not read all three up front).

## Preconditions

- The `require-environment` guard denies file edits outside a git repo; the flow also
  needs a GitHub remote, authenticated `gh`, and the **`gh stack` extension**
  (`gh extension install github/gh-stack`) — layers publish as a stack of PRs and there is no
  single-PR fallback. The SessionStart hook warns about anything missing — resolve it before real work.
- `.claude/product.md` (North Star + Language) was read at session start. If it does not exist yet, this is a brownfield
  repo — run `bootstrap` first to reconstruct it. Trust it as current; it is pruned, not
  append-only.

## Vocabulary

**Task** (deps + scope), **Layer** (the derived unblocked set — `tasks.js ready`, not hand-authored),
**Trail** (the per-branch **map** — destination, decisions, the fog in *Not yet specified*, and *Out of
scope*; canonical format in [`references/trail.md`](references/trail.md). The task graph lives beside it
in `<branch>.tasks.jsonl`).
Full definitions are in `product.md`'s Language section (read each session); the task-graph schema
is in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`.

## Flow

1. **Branch + draft PR (before any work).** Cut `feature/<kebab-desc>` off the default branch,
   create `.claude/trails/<branch>.md`, commit it, push, and open a **draft PR**
   (`gh pr create --draft --title … --body …`) **with a body stating the core objective** — the
   feature's intent in a line or two, the North Star it serves. It opens before any code is written, so
   anyone looking at the PR during BUILD sees what it's for; the full description is written at merge via
   `qa`. This PR is the **bottom of the stack**: BUILD opens one PR per layer on top of it, so the whole
   feature — scoping included — is reviewable layer by layer.
2. **SPEC** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/spec.md` and follow it. When a
   question is empirical rather than arguable, SPEC spikes it: a **`spike-<slug>` test in the repo's
   own suite**, variants as side-by-side cases the user can run — the answer redrafts the target
   program, and the spike graduates (it revalidates a claim) or is deleted, tracked either way.
3. **PLAN** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/plan.md` and follow it. A design
   fork is an empirical question that escaped SPEC — it goes back there as a spike per candidate, the
   user picks, and the winner seeds the task graph.
4. **BUILD** *(hands-off)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/build.md` and follow it.
5. **MASTER QA** *(once, after the graph drains)* — dispatch `outputty:outputty-master-qa`. It is the
   **only place the target program is actually run**; every per-layer write-up says *expected, not yet
   run* because this is the run. A merge without it ships code nothing has executed, so
   `hooks/require-master-qa.js` **denies** the merge command in a session that never dispatched it.
6. **Merge step** (after master QA passes) — distill the trail into the product docs, prune stale content (flip any
   feature that shipped to ✅ in Status & roadmap; verify its documented behaviour by running it), append
   the **History** entry, **retrospect** (cycle lessons → memory; a rare skill mint rides the branch),
   **bump the version** in `.claude-plugin/marketplace.json` if `hooks/`/`skills/`/`agents/` changed (it
   is the cache key — no bump means `plugin update` delivers nothing), then green-gate, mark the stack's
   PRs **ready**, and land them atomically with `gh stack merge --yes`.

## Standing rules (all phases)

- **Build the laziest working diff.** The code rules reach every writer mechanically — code-writing
  agents preload `skills/code-rules` via their charter; the main session gets it injected on its first
  edit (`hooks/inject-code-rules.js`). Apply them, don't restate them.
- **Navigate with the LSP when the language has one** — go-to-definition and find-references over
  grep-then-read-three-candidates, and diagnostics land automatically after each edit. No language
  server? `Grep`/`Glob` are the floor. (The memory-routing rule — decisions → the product docs, durable
  lessons → auto-memory — is always-on; see the protocol.)
- **Gates are real.** SPEC and PLAN stop for the user. BUILD is hands-off — it interrupts only to
  **escalate**: a layer whose QA fix loop doesn't converge (a finding surviving two fix attempts, or 5
  rounds spent), a `blocked` builder or QA (a scope/API wall — immediate, no rounds burned),
  plan-invalidating drift at preflight, a **task the roadmap no longer wants** (the before-dispatch
  staleness check), or a failed master QA. Nothing merges on an escalation. A task whose *wording* went
  stale is not an escalation — the orchestrator amends the brief and dispatches.
- **Behavioural rules are always-on.** Verify-by-running-then-source, memory routing, and
  skeptical-and-concise are injected every session by the SessionStart hook (`hooks/protocol.md` →
  "Always-on rules") — they apply in every phase, so they're not restated here. **Every outputty agent preloads
  the shared slice via its charter's `skills:` field** (`skills/agent-protocol` — verify-by-running,
  LSP-first, whole-file reads, honest reporting; code-writers also preload `skills/code-rules`);
  charters carry only what is role-specific.
- **Route corrections to their owner.** When the user corrects you, don't dump it in one place: a
  changed decision → the product docs; a durable gotcha or convention → auto-memory (name the file it is
  about, so the recall hook can surface it); a laziness miss → the laziest-working-diff discipline. Scan
  for the existing rule before writing a new one.
- **User-facing docs go through the ruleset.** When a change touches the README (or similar project
  docs), update it with the `documentation` skill — apply its ruleset, don't hand-edit prose.
  It reaches for `diagram` only when a diagram genuinely earns its place.
- **PR descriptions + pre-handoff QA go through `qa`.** Write every PR body in its
  enforced format (the canonical spec `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`)
  and run its definition-of-done before marking a PR ready — don't hand-improvise the write-up or the
  "is it done?" check.
