# Trail — 0001-bootstrap

> The scoping thought-trail for outputty's own design. Lite record of each node: decision + what was
> branched or dropped. This is the format every future `.claude/trails/<branch>.md` follows.

## Thought-trail

- **Combine spec-kit + ponytail + OpenWolf + grill?** → Feasible; ~90% already owned. Adopt
  spec-kit's *phase vocabulary*, not its `.specify/` machinery. Dropped: spec-kit CLI/templates.
- **Delivery form?** → A Claude Code plugin (versioned, installable) via SessionStart-hook injection,
  proven by ponytail. Dropped: patching each repo's CLAUDE.md.
- **Depend on ponytail / OpenWolf / grill?** → Plugin `dependencies` exist (verified in docs).
  ponytail = hard cross-marketplace dep. OpenWolf = *can't* be a dep (it's a CLI, not a plugin).
  grill = bundle it.
- **OpenWolf: keep, cut, or soft?** → First leaned "cut entirely" (thought it was redundant memory).
  **Reversed** after checking openwolf.com: its axis is *token optimisation* (~80% reduction), memory
  is the mechanism. Kept as a **hard requirement**. Branched into: the memory boundary.
- **Memory surfaces?** → Ballooned to ~8 (north-star, architecture, layer md, glossary + OpenWolf's
  4). Collapsed to **product.md + OpenWolf's four + a transient trail**. Dropped: separate
  north-star.md and architecture.md (merged into product.md); dropped separate CONTEXT.md glossary
  (folded into product.md Language); dropped ADRs (replaced by "What was tried").
- **Vocabulary (waves/ripples rename)?** → Tried coats/dabs, molds/blobs, eggs/blobs (putty theme) —
  all rejected. Landed on plain **Layer / Task**. Kept "trail" for the per-branch file to avoid a
  collision with "layer".
- **Enforcement?** → Moved OpenWolf check from the spec skill to a **SessionStart hook** ("must
  always run"). Same hook loads product.md. Dropped: skill-based checking.
- **Branch model?** → **One** feature branch for the whole cycle; gate = conversational OK. Dropped:
  two-branch (plan-branch + build-branch) model.
- **Orchestration?** → Dropped "three chained phase skills" (no context saving — invoked skill
  bodies stay resident; and skill-to-skill isn't a real primitive). Landed on **one orchestrator +
  on-demand phase files + subagent fan-out** (feature-dev pattern).
- **Autonomy?** → SPEC + PLAN gated; BUILD hands-off with double-failure escalation only.

## Plan

Scaffold at `F:/outputty/harness` (mirror ponytail): manifests, SessionStart hook, `feature`
orchestrator + spec/plan/build phase files, bundled `grill` engine, `task-runner` agent, dogfooded
`product.md` + this trail, README. Authored directly (context-heavy), single initial commit on
`main`.
