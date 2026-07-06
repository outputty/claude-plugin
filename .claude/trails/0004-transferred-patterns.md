# Trail — 0004-transferred-patterns

> Scoping trail for transferring general patterns into outputty from (a) the superpowers methodology,
> (b) a real production `.claude` config, its diagrams skill, and its AGENTS.md. Calibrated to the
> reverse-audit's posture: slim surface, heavy enforcement — add enforcement rules, not capability.

## Thought-trail

- **Safety hooks — the standout transfer.** BUILD runs shell/git autonomously; nothing in
  ponytail/OpenWolf/grill guards command-safety or secret-egress. Ported three PreToolUse guards,
  **rewritten in Node** (the prod bash/python3 versions emit `{"decision":...}` = OpenCode format;
  Claude Code needs `hookSpecificOutput.permissionDecision`). Also closes the audit's
  "autonomous haiku + git, only self-QA guardrail" high-severity gap.
- **Diagram skill — the one new capability.** Generalized the prod diagrams skill into an **opt-in**
  `outputty-diagram` skill: lifted the shape vocabulary, spacing/layout rules, validate-XML self-check,
  GitHub-embed knowledge, and both example SVGs; folded in the style constraints that lived in the
  prod repo's `rules/docs.md` (not self-contained without them); genericized the two SVGs off
  Ravio domain nouns (Kombo/GCS/BigQuery/mart, Slack/Temporal) → sources→transform→sink and
  interface/orchestrator/worker/memory. Dropped: auto-wiring it into PLAN or mandating an SVG in
  product.md (that would bloat — availability, not enforcement).
- **QA-gate rules from superpowers (low-surface enforcement, no new files).** test-first spec check;
  two-stage QA (spec then quality→ponytail); green-suite baseline + merge green-gate;
  root-cause-before-retry / question-the-design-on-double-fail; stale-reference grep on renames;
  testing philosophy (prune don't add, no trivial/partial-e2e). Dropped: git worktrees (operational
  surface), full debugging/skill-authoring skills.
- **Behaviour rules from AGENTS.md (should-adopt five).** docs-first-before-fixing (build.md);
  skepticism + terse/clarity-exception + correction-routing-to-the-right-owner (SKILL standing
  rules). Routed the memory pieces to OpenWolf rather than reimplementing.
- **Explicitly skipped (duplicate/bloat, verified):** prod `code-review`/`debugging`/`architecture`/
  `improve-codebase-architecture`/`fetch` skills (= ponytail / diagnose / deep-research); the
  architect/build/qa/research agent roles (= task-runner/scanner); per-language rules; Linear/
  submodules/lockfiles/.opencode from AGENTS.md.
