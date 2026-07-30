---
name: outputty
description: Drive a feature or change from intent to shipped code using the outputty spec-driven flow — grill business + technical goals, plan into a dependency-ordered task graph, then build hands-off. Use whenever the user asks to build, add, change, or refactor something that warrants scoping first, or says "outputty", "spec this", "scope this", or "let's build X". A small, well-understood fix doesn't need the flow — just do it.
---

# outputty — feature flow

You are orchestrating a spec-driven flow. Three phases, one feature branch. You hold the
orchestration; the detail for each phase lives in a sibling file you `Read` **when you enter that
phase** (progressive disclosure — do not read all three up front).

## Preconditions

- The `require-environment` guard denies file edits outside a git repo; the flow also
  needs a GitHub remote + `gh`. The SessionStart hook warns about anything missing — resolve it
  before real work.
- `.claude/product.md` was injected at session start. If it does not exist yet, this is a brownfield
  repo — run `bootstrap` first to reconstruct it. Trust it as current; it is pruned, not
  append-only.

## Vocabulary

**Task** (deps + scope), **Layer** (the derived unblocked set — `tasks.js ready`, not hand-authored),
**Trail** (the per-branch spec thought-trail; the task graph lives beside it in `<branch>.tasks.jsonl`).
Full definitions are in `product.md`'s Language section (injected each session); the task-graph schema
is in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`.

## Flow

1. **Branch + draft PR (before any work).** Cut `feature/<kebab-desc>` off the default branch,
   create `.claude/trails/<branch>.md`, commit it, push, and open a **draft PR**
   (`gh pr create --draft --title … --body …`) **with a body stating the core objective** — the
   feature's intent in a line or two, the North Star it serves. It opens before any code is written, so
   anyone looking at the PR during BUILD sees what it's for; the full description is written at merge via
   `qa`. The whole feature — scoping included — lives in this PR.
2. **SPEC** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/spec.md` and follow it. When a
   question is empirical rather than arguable, SPEC runs the optional **spike** step: 2–3 throwaway
   variants built in the scratchpad to answer it, then deleted — the answer redrafts the target program,
   the code never survives.
3. **PLAN** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/plan.md` and follow it. When the
   design genuinely forks, PLAN runs the optional **SIMULATE** step (`simulate.md`): user-selected
   permutations race as parallel subagents toward the same end state, and every simulation is
   summarized and compared before one seeds the task graph.
4. **BUILD** *(hands-off)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/build.md` and follow it.
5. **Merge step** (end of BUILD) — distill the trail into `product.md`, prune stale content (flip any
   feature that shipped to ✅ in Status & roadmap; verify its documented behaviour by running it), append
   the **History** entry, **retrospect** (cycle lessons → memory; a rare skill mint rides the branch),
   then green-gate, mark the PR **ready** (`gh pr ready`), and merge.

## Standing rules (all phases)

- **Build the laziest working diff.** The full discipline is already injected every session
  (`hooks/protocol.md`, "When you write code") and carried by the BUILD executor's charter
  (`agents/outputty-builder.md`) — apply it, don't restate it.
- **Navigate with the LSP when the language has one** — go-to-definition and find-references over
  grep-then-read-three-candidates, and diagnostics land automatically after each edit. No language
  server? `Grep`/`Glob` are the floor. (The memory-routing rule — decisions → `product.md`, durable
  lessons → auto-memory — is always-on; see the protocol.)
- **Gates are real.** SPEC and PLAN stop for the user. BUILD is hands-off — it interrupts only to
  **escalate**: a layer whose builder↔QA loop doesn't converge in three rounds, a `blocked` builder (a
  scope/API wall — immediate, no rounds burned), plan-invalidating drift at preflight, or a failed
  master QA. Nothing merges on an escalation.
- **Behavioural rules are always-on.** Verify-by-running-then-source, memory routing, and
  skeptical-and-concise are injected every session by the SessionStart hook (`hooks/protocol.md` →
  "Always-on rules") — they apply in every phase, so they're not restated here. (Subagents are gated
  out of that injection; their charters carry what they need — `outputty-builder` carries the laziest-diff
  discipline + its self-gate, `outputty-qa` states its own verify-by-running rule.)
- **Route corrections to their owner.** When the user corrects you, don't dump it in one place: a
  changed decision → `product.md`; a durable gotcha or convention → auto-memory (name the file it is
  about, so the recall hook can surface it); a laziness miss → the laziest-working-diff discipline. Scan
  for the existing rule before writing a new one.
- **User-facing docs go through the ruleset.** When a change touches the README (or similar project
  docs), update it with the `documentation` skill — apply its ruleset, don't hand-edit prose.
  It reaches for `diagram` only when a diagram genuinely earns its place.
- **PR descriptions + pre-handoff QA go through `qa`.** Write every PR body in its
  enforced format (the canonical spec `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`)
  and run its definition-of-done before marking a PR ready — don't hand-improvise the write-up or the
  "is it done?" check.
