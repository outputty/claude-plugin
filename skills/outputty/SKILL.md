---
name: outputty
description: Drive a feature or change from intent to shipped code using the outputty spec-driven flow — grill business + technical goals, plan into a dependency-ordered task graph, then build hands-off. Use whenever the user asks to build, add, change, refactor, or fix something non-trivial, or says "outputty", "spec this", "scope this", or "let's build X".
---

# outputty — feature flow

You are orchestrating a spec-driven flow. Three phases, one feature branch. You hold the
orchestration; the detail for each phase lives in a sibling file you `Read` **when you enter that
phase** (progressive disclosure — do not read all three up front).

## Preconditions

- The `require-environment` guard denies file edits unless OpenWolf + git are present; the flow also
  needs a GitHub remote + `gh`. The SessionStart hook warns about anything missing — resolve it
  before real work.
- `.claude/product.md` was injected at session start. If it does not exist yet, this is a brownfield
  repo — run `outputty-init` first to reconstruct it. Trust it as current; it is pruned, not
  append-only.

## Vocabulary

**Task** (deps + scope), **Layer** (the derived unblocked set — `tasks.js ready`, not hand-authored),
**Trail** (the per-branch spec thought-trail; the task graph lives beside it in `<branch>.tasks.jsonl`).
Full definitions are in `product.md`'s Language section (injected each session); the task-graph schema
is in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.md`.

## Flow

1. **Branch + draft PR (before any work).** Cut `feature/<kebab-desc>` off the default branch,
   create `.claude/trails/<branch>.md`, commit it, push, and open a **draft PR**
   (`gh pr create --draft`). The whole feature — scoping included — lives in this PR.
2. **SPEC** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/spec.md` and follow it.
3. **PLAN** *(gated)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/plan.md` and follow it.
4. **BUILD** *(hands-off)* → `Read ${CLAUDE_PLUGIN_ROOT}/skills/outputty/build.md` and follow it.
5. **Merge step** (end of BUILD) — distill the trail into `product.md`, prune stale content, append
   the "What was tried" entry, mark the PR **ready** (`gh pr ready`), and merge to the default branch.

## Standing rules (all phases)

- **ponytail governs the build.** Laziest working diff, stdlib/native/existing-dep before new code,
  no speculative abstraction. It is an active dependency — defer to it, don't re-derive it.
- **OpenWolf owns operational memory — outputty never writes `.wolf/` by hand.** Read `anatomy.md`
  for navigation and run `openwolf bug search <term>` before a fix; refresh the map with `openwolf
  scan` (never hand-edit `anatomy.md`). There is no CLI to write cerebrum/buglog/memory — those are
  OpenWolf's own hooks' job, so outputty simply doesn't touch them. **Decisions go in `product.md`**,
  never in cerebrum.
- **Gates are real.** SPEC and PLAN stop for the user. BUILD is hands-off: the only interruption is
  escalating a task that fails QA twice.
- **Skeptical by default — verify, don't assert.** Don't reflexively agree, and don't state a
  factual/technical claim (tool/API/library behaviour, what a flag does, "X works like Y") from memory.
  **Validate it against a source you proactively find** — a web search/fetch of the primary doc for
  external facts, or the **actual installed module/package/code** for anything about this project or its
  deps — then cite it, or flag it "unverified". Terse by default, but switch to full prose for anything
  security-related, irreversible, or when the user seems confused.
- **Route corrections to their owner.** When the user corrects you, don't dump it in one place: a
  changed decision → `product.md`; a gotcha/convention belongs to OpenWolf (its own hooks capture it —
  don't hand-write `cerebrum`); a laziness miss → defer to ponytail. Scan for the existing rule before
  writing a new one.
- **User-facing docs go through the ruleset.** When a change touches the README (or similar project
  docs), update it with the `outputty-documentation` skill — apply its ruleset, don't hand-edit prose.
  It reaches for `outputty-diagram` only when a diagram genuinely earns its place.
