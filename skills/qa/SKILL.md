---
name: qa
description: Self-check a developer's OWN finished change before handoff — the definition-of-done pass before they commit, push, or request review ("is this actually done?") — and draft or rework the PR description in the enforced format. Trigger even when phrased loosely, without the words "review" or "PR". Not for reviewing someone else's code or writing commit messages.
---

# qa — definition of done + PR write-up

The **author's** pre-handoff pass: self-check a finished change, then write its PR. Complementary to
BUILD's automated QA gate (tests-match-specs+docs first, then quality/patterns) — use it for work done outside the
hands-off build, or as the final human check before marking a PR ready.

**Verify by running, not asserting** (the standing rule): every "it works / it's done" claim is
backed by a command you actually ran and read — run first, cite a source only when a run can't answer.

## Internal QA checklist

Run before calling any implementation finished:

1. Re-read the original ask. What was requested — exactly?
2. Name the existing patterns, constraints, and context relevant to the problem.
3. Name the exact files and functions you changed.
4. Confirm the change addresses the ask — nothing more, nothing less.
5. Does it make sense in the bigger picture?

**Red flags — stop and reassess:** patching around a symptom instead of the root cause; touching code
unrelated to the ask; reusing a legacy pattern without checking it still applies.

## Definition-of-done gate

Run before marking ANY task done. Each check is **evidence-backed** — run it, read the output; don't
assert "should pass".

1. **Functional.** Does it do what the task described, without breaking existing behaviour? Run the
   project's targeted test/build for the touched area (the `verify` skill, or the repo's test command)
   and read the result — don't claim green.
2. **Simplification.** Review the diff for over-engineering and cut it, using the **simplification tags**
   in the audit playbook (`${CLAUDE_PLUGIN_ROOT}/skills/audit/references/audit-playbook.md` →
   "Simplification tags") — `delete:` / `stdlib:` / `native:` / `yagni:` / `defensive:` / `shrink:` / `complexity:`. The
   best outcome is a shorter diff.
3. **Documentation.** Docstrings updated if a signature or behaviour changed; comments match the new
   logic; user-facing flow changes go through the `documentation` skill (README).
4. **Stale references.** On a rename, grep the whole tree for the old symbol across every language in
   play (code, config, docs) and confirm it's clean. Check that comments/docstrings still describe
   reality.
5. **Final self-check.** Re-read the task; confirm the implementation matches exactly. Mark done only
   after every check above passed **with evidence**.

**Reviewing beyond the immediate ask?** For a deeper pass — correctness, security, performance edges the
change touches — the **audit playbook is the lens library**
(`${CLAUDE_PLUGIN_ROOT}/skills/audit/references/audit-playbook.md`): read the category that fits
what you're checking rather than reviewing from memory. (A full repo audit is `audit`'s job, not
this pre-handoff pass — but the same checklists apply to a diff.)

## PR description format (ENFORCED)

Write the PR body — and every per-layer write-up — to the single canonical spec:
[`../outputty/references/pr-description.md`](../outputty/references/pr-description.md) (Summary bullets →
one section per bullet, same order → Keep in mind; before/after JSON only for a real data change, a
before/after **graph** for a flow change with no record diff). It carries the fill-in skeleton at the
bottom. That spec is the source of truth — read it, don't restate it here.
