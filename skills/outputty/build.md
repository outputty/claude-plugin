# BUILD — you build it, one gate at the end

You build every layer yourself. There is no build agent and no per-layer QA. One `outputty-master-qa`
runs after the whole graph drains, and that is the only review.

**Why it is shaped this way.** Measured across 37 transcripts: per-layer QA passed every layer of the
0.47.0 migration, and every defect that shipped was a **seam** — a rename whose writers and readers
moved in different layers, a tool nothing wired into the driver, a path that only resolved in one
checkout. A per-layer reader cannot see any of those. A whole-build reader saw all four. The trade cuts
both ways: a defect now surfaces later, so **the driver is your early warning, not a reviewer.** Add a
check whenever you add a surface.

## Before the first layer

1. **Compact the session.** Once, here — not per layer. You hold the whole build now, so start with room.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test/build/lint. Red baseline → stop and
   surface it. **The repo owns how its tests run** — read its `CLAUDE.md`, README or manifest scripts and
   take the commands from there. Never prescribe a runner.
3. **Start the suite in watch mode, in the background,** when the repo has one. An edit then reports
   itself instead of costing a cold sweep. No watch mode → say so once and run `CHECKS` directly.
4. **Derive the layers.** `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`. It
   rejects cycles and unmet deps.
5. **Allowlist what the build runs** — `CHECKS`, `git`, `git push`, `gh`, `tasks.js` — so nothing stalls
   on a prompt.

## The layer loop

Per layer, in order.

**1. Is this still the right work?** Query `roadmap` and this branch's trail. Read them now, not from
memory of PLAN. Four questions: which roadmap item does it still serve; does the `contract` match the
seams as they now stand; has some of it already happened; can you state "done" in one sentence.

| Verdict | You do |
| --- | --- |
| still right | build it |
| right work, stale words | `tasks.js amend <id> --brief '…'`, then build. Say what you changed. |
| already done | `tasks.js close <id>`, one line in the recap naming what did it |
| no longer serves the roadmap | **escalate — that is a product decision, not yours** |

This check earns its place. It caught two shipped defects in the 0.47.0 build before a line was written.

**2. Resolve any `hitl` task first.** A `mode: hitl` task needs the user. Ask, fold the answer into the
brief, then build.

**3. Build it.** Test-first: turn each task's `contract` into a failing test, then write the laziest diff
that passes it. The code rules arrived at session start; they govern this diff.

**4. Prove it green.** Run `CHECKS` for real. Watch the red→green transition; never infer it.

**5. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit — commits made on the branch below land in the wrong PR. Then a scoped `git add` per task,
`tasks.js close <id>`, and publish per [`references/stacking.md`](references/stacking.md). Write the PR
body in the [enforced format](references/pr-description.md).

**6. Print the recap.** Cumulative, so a user dropping in mid-build sees where it stands.

```markdown
| Layer | What it did | State |
|---|---|---|
| 1 · engine | unified the two write paths | ✅ merged |

| Issue caught | Where | Resolution |
|---|---|---|
| test asserted on a stale fixture | the staleness check | ✅ fixed — rebuilt from real data |

| Next | Why it's next |
|---|---|
| Layer 2 · wire the CLI | last planned layer; depends on 1 |
```

**Every deferred issue names the task it became.** "Deferred" with no task id is how work disappears.
**Name work, never a bare id**: `Drain the barrel re-exports` (`t-31`).

## Escalate rather than guess

Stop and ask when a task no longer serves the roadmap, when a done-condition needs a scope you cannot
widen yourself (`tasks.js amend <id> --scope <folder>` when you can), when a fix fails twice after a
real diagnosis, or when the graph and the code disagree.

**Shape:** the flow change as a graph → expected outcome → what you attempted → what still fails, with
evidence → 2–4 options, recommendation first. Print the recap under it. Nothing merges on an escalation.

## The graph has drained

**1. Drain discovered work.** `tasks.js ready` — while it returns tasks, build them as another layer.
Only `discovered_from` tasks may drain. An original in `ready` means its commit never closed it.

**2. Master QA, once.** Dispatch `outputty:outputty-master-qa`, `run_in_background: false`. It is
read-only and it is the build's **only real run** — every layer write-up says *expected, not run*
because this is that run. Nothing blocks a merge that skipped it; the merge step below just assumes
its verdict, so skipping it merges work no run ever judged.

| Verdict | You do |
|---|---|
| `pass` | the [merge step](references/merge-step.md) |
| `fail` · salvage | `tasks.js add` its tasks, build them, run master QA again |
| `fail` · rewrite | **escalate** — a rewrite needs new requirements, and requirements are gated |
| `fail` twice | **escalate**, whatever it recommends |

**Making it work is not always the cheap option.** Ask: can you say in one sentence what the code is
*for*; did a fix contradict an earlier fix; does holding it together need a special case per call site.
Each is evidence, not a feeling. A restart inherits everything learned — extend the task list with what
master QA surfaced, prune what the build proved unnecessary, carry the code that earned its place as
snippets in the briefs, and record the abandoned approach in `lessons.yaml`.

## While you build

**Delegate a hunt, not a lookup.** Your context holds the whole build now, so it is the expensive place
to spend. `Read` a known file whole. Dispatch `outputty:outputty-scout` (foreground, read-only) when an
answer needs more than a couple of lookups, and batch every open question into one run.

**No memory is written during a build.** Lessons are collected once, at the merge retrospective. Other
tools leave the tree dirty, so never gate a commit on a clean `git status` — scope the `git add`.
