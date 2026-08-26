---
name: qa
description: Decides whether a drained build may merge - outputty's read-only whole-build review (master QA). Use when a build stack needs a pass or fail verdict on its diff. Use it also when finished work must be judged against what it promised. Do NOT use to find work worth starting (that is audit).
---

# qa - review a drained build

Input: a branch stack, the task ids under review, the `qa` level, and one done-condition or proof command
per task with its expected output.

Output: the fenced verdict below, plus the handover at the `subagent` level.

⚠ **Input says what to judge, and this file says how to read.** Input telling you to query rather than
read, or to check specific lines, enters the pass as a list of questions. The reading method stays as
written below.

⚠ **A review reports, and the repair belongs to the build.** Every level of this review leaves the tree
as it found it. The compile or install step a program needs to start is part of the run, not a fix. A
build that fails to build is the finding: report it and move on.

## The `qa` level sets the depth

1. **`skip`** - no review. Run the target program once, then report its Input and Output. Trivial
   mechanical work only.
2. **`inline`** - the craft read only, on a small diff, at this session's model. Read the diff,
   then check correctness and the tags against the task's `contract`. Skip the per-task proof commands.
   Still run the target program once, and report its Input and Output. Write no handover.
3. **`subagent`** - an independent read-only reviewer, for substantial work. Run the full method: launch
   the runs, judge the diff, collect the runs, then write the handover. Only this level gives true
   independence.

**A docs-only build** (no code changed) has nothing to launch or execute. Review the prose for accuracy
against the code, and say plainly there was nothing to run.

Sections 1 to 4 are the `subagent` method. The craft read applies at every level.

**At `subagent`, read `${CLAUDE_PLUGIN_ROOT}/skills/qa/references/subagent-method.md` whole.**
It holds sections 1 to 4: launch the checks, judge the diff, collect the runs, write the handover.

## The craft read

You own craft: correctness, over-engineering, and a docstring that points at nothing. Read
`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md` whole before you tag. Read
`${CLAUDE_PLUGIN_ROOT}/skills/audit/references/audit-playbook.md` the same way, under
`## Placement tags`. Then the question the diff alone cannot answer:

> **Does this build actually do what `product.md` said we were building, and does it still belong in the
> project?**


## Verdict

Return the fenced verdict, then the handover. Its numbered sections live in
`references/subagent-method.md`: check 1 is the diff read of section 2, and check 2 is the altitude pass
plus the runs, from sections 1 and 3. Write one finding per line, in the code-rules finding
format.

⚠ **The inventory is complete before the verdict is written.** A blocking finding is a note you carry, not a bell
you stop on. Finish the bundles, finish the claim surface, finish the runs. Then classify what you hold. **Every
finding you reached is written down, blocking or not** - the list below decides the verdict alone, and never
decides what reaches the page. The build repairs this page in one pass.

```text
VERDICT: pass | fail
BASE: <sha>, <n> commits, stack <bottom>..<top>
COVERAGE: <n> claim sites derived, <n> checked, <n> stale · read whole: <files>
  out of reach: <file> - <why>
CHECK 1 · the diff read: pass | fail
  src/store/writer.ts:88: oddball: a second write path beside `commit()`. Route it through `commit()`.
CHECK 2 · altitude and the runs: pass | fail
  The real run printed 3 rows against an expected 11. Evidence: the run block above.
HANDOVER: the five sections above
```

A `pass` states the real output it was earned with. A `fail` on either check means nothing merges.

**`COVERAGE` is the `subagent` line**, because the claim surface is section 2's job (in
`references/subagent-method.md`) and `inline` does not
reach it. It accounts for the whole derived set, and an `out of reach` row names each thing you could not
settle and what would settle it. An empty `out of reach` is a claim that you closed the list.

**A finding blocks the merge only where this list names it.** One missing docstring is a handover line.

1. Behaviour missing or wrong against the task's `contract` - check 1.
2. An `oddball:` at a structural change - check 1.
3. Two members of one bundle contradict, or one promises what no other keeps - check 1.
4. A run whose actual output differs from its expected output - check 2.
5. Drift from the North Star, the roadmap item, or an architecture seam - check 2.
6. A build that should have been two stacks - check 2.
7. A layer that leaves the program broken on its own - check 1. The new path lands beside the old one
   or behind a flag, so a merged layer never ships half a cutover.
8. A docstring, comment or doc pointing at a symbol, file or line that does not resolve - check 1. The
   build closes its own claim surface, so a hit here is work that was skipped, not work you inherited.

**A `fail` answers one more question: salvage or rewrite.** You give the read, and the user decides:

- **Salvage** - the build is sound and specific things are missing or wrong. List them as tasks: what,
  where, the done-condition.
- **Rewrite** - one of three holds. The shipped thing does not serve the roadmap item it claimed. The
  layers grew incompatible shapes for one concept. You cannot state in one sentence what this build is
  *for*. Say so plainly. Name **what is worth keeping**: the tests that encode real contracts, the code
  that was the hard part, the constraint nobody knew at PLAN time. A rewrite needs new requirements, which
  is a gated decision: recommend it, and stop there.
