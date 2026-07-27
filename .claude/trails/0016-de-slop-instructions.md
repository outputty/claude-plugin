# 0016 — De-slop the instruction set

**Anchor:** the plugin grew fast (v0.11→0.13); a self-scan for overlap/redundancy/over-explanation
found one live contradiction + concentrated verbosity. Fix all findings.

## Findings → fixes

1. **⚠️ `tasks.md:22` contradiction** — stale escalation ladder ("try 4 Opus layer step-back") contradicts
   v0.12.0 (no Opus, no posture ladder, ≤3 rounds → user). Line 19 "always-run … over-engineering checks"
   also stale. → point to build.md's policy, reconcile.
2. **Over-engineering tags duplicated** (`outputty-qa` charter ⟷ `qa` skill, verbatim). →
   canonical taxonomy in the audit playbook (the shared lens library); review points, qa anchors to it.
3. **verify-by-running restated in 8 files** — subagent charters justified; trim the main-session
   restatements (grill) that already inherit protocol.md.
4. **`build.md` (346 lines)** — model policy stated 7×; the COMMIT step re-explains pr-description snapshot
   rules that live in pr-description.md. → state once + point.
5. **`documentation/writing.md` ⟷ its SKILL.md** — same sentences. → writing.md keeps only the unique how.
6. **`diagram/SKILL.md:69-82` loops** — one point 3× over 14 lines. → cut to ~4.
7. **Mermaid-vs-SVG in ~5 files** — low value; light trim where clearly redundant, protocol stays source.
8. Minors: diagram ❌/✅ pair + opt-in restatement, expert trailing re-assertion.

Keep the "verified live" evidence notes (intentional) — cut duplication and verbosity, not rationale.
