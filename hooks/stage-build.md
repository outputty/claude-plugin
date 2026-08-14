# OUTPUTTY - BUILD stage

**You are a BUILD session.** Your task's requirements are already settled. You build it unattended,
and you never stop to ask a question - see the replan exit below.

## Your steps

1. **BUILD** - the section below. You build every layer yourself. One layer, one PR, stacked.
2. **MASTER QA**, once, after the graph drains. The build's only real run.
3. **Merge** - the merge step below.

**Read the task's `attempts` before choosing an approach.** If this task has been through a replan, each
entry names a road already closed.

## The replan exit - the only way a build stops early

**A requirements gap is not a question. It is a replan.** The moment you cannot proceed without a ruling
nobody has made, stop. Do not guess, do not pick the interpretation that looks cheapest, and do not sit
waiting in a pane nobody is watching.

1. **Scratch what you built** on that gap. Never leave half-built work against a wrong requirement.
2. **Append an `attempts` entry**: what you tried, what killed it, and the file:line or run that proves
   it. `tried` and `killed_by` are both required.
3. **Set `spec: replan`** and report. The task leaves your stage and the planning stage picks it up.

Write that entry for a reader who was not here.

**Escalate rather than replan only when the blocker is not a requirements gap.** A broken environment,
a missing credential, or a dependency that does not exist all qualify. Planning cannot answer those.

**Under Herdr you never close your own workspace or dispatch a sibling session.** You run this item to
its merge and report. The orchestrator closes the workspace afterwards.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.

## BUILD - you build it, one gate at the end

You build every layer yourself. There is no build agent and no per-layer QA. One `outputty-master-qa`
runs after the whole graph drains, and that is the only review.

**The driver is your early warning, not a reviewer.** Add a check whenever you add a surface.

### Before the first layer

1. **Compact the session.** Once, here, and not per layer. Start with room.
2. **Green baseline, and capture `CHECKS`.** Run the repo's own test, build and lint. A red baseline
   means stop and surface it. **The repo owns how its tests run**, so read its `CLAUDE.md`, README or
   manifest scripts and take the commands from there. Never prescribe a runner.
3. **Start the suite in watch mode, in the background,** when the repo has one. With no watch mode, say
   so once and run `CHECKS` directly.
4. **Derive the layers.** Run
   `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`. It rejects cycles and unmet
   deps.
5. **Allowlist what the build runs** so nothing stalls on a prompt: `CHECKS`, `git`, `git push`, `gh`
   and `tasks.js`.

### The layer loop

Per layer, in order.

**1. Is this still the right work?** Query `roadmap` and this branch's trail. Read them now, not from
memory of PLAN. Four questions:

- Which roadmap item does it still serve?
- Does the `contract` match the seams as they now stand?
- Has some of it already happened?
- Can you state "done" in one sentence?

| Verdict | You do |
| --- | --- |
| still right | build it |
| right work, stale words | `tasks.js amend <id> --brief '…'`, then build. Say what you changed. |
| already done | `tasks.js close <id>`, one line in the recap naming what did it |
| no longer serves the roadmap | **escalate - that is a product decision, not yours** |

**2. Resolve any `hitl` task first.** A `mode: hitl` task needs the user. Ask, fold the answer into the
brief, then build.

**3. Build it.** Test-first: turn each task's `contract` into a failing test, then write the laziest diff
that passes it. The code rules arrived at session start, and they govern this diff.

**4. Prove it green.** Run `CHECKS` for real. Watch the red to green transition, and never infer it.

**5. Commit, stack, publish.** Cut `feature/<x>-l<N>` off the previous layer's branch **before** you
commit. Then a scoped `git add` per task and `tasks.js close <id>`. Write the PR body in the format
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` enforces.

```bash
git checkout -b feature/<x>-l<N>               # off the previous layer's branch, not off main
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file <the layer's write-up>
```

**Set the title explicitly.** The title is the write-up's `## <what this layer did>` heading.

**Two flags are hands-off traps.** `gh stack init` with **no arguments demands interactive input**, so
always pass the branch names, which you already have from `schedule`. And `gh stack submit` **opens an
editor** unless you pass **`--auto`**. With `--auto`, new PRs are created as **drafts**.

**Name layers with a hyphen, never a slash.** Git rejects `feature/<x>/l1` once `feature/<x>` exists as
a branch. A rebase conflict between layers is an **escalation**, and is never force-resolved inside a
hands-off build.

**6. Print the recap.** Cumulative.

```markdown
| Layer | What it did | State |
|---|---|---|
| 1 · engine | unified the two write paths | ✅ merged |

| Issue caught | Where | Resolution |
|---|---|---|
| test asserted on a stale fixture | the staleness check | ✅ fixed - rebuilt from real data |

| Next | Why it's next |
|---|---|
| Layer 2 · wire the CLI | last planned layer; depends on 1 |
```

**Every deferred issue names the task it became.** **Name work, never a bare id**:
`Drain the barrel re-exports` (`t-31`).

### Escalate rather than guess

Stop and ask in these cases:

- a task no longer serves the roadmap
- a fix fails twice after a real diagnosis
- the graph and the code disagree
- a done-condition needs a scope you cannot widen yourself

Widen a scope yourself with `tasks.js amend <id> --scope <folder>` whenever you can.

**Shape:**

- the flow change as a graph
- the expected outcome
- what you attempted
- what still fails, with evidence
- 2-4 options, recommendation first

Print the recap under it. Nothing merges on an escalation.

### The graph has drained

**1. Drain discovered work.** Run `tasks.js ready`. While it returns tasks, build them as another layer.
Only `discovered_from` tasks may drain. An original in `ready` means its commit never closed it.

**2. Master QA, once.** Dispatch `outputty:outputty-master-qa`, with `run_in_background: false`. It is
read-only and it is the build's **only real run**. Every layer write-up says _expected, not run_.
Nothing blocks a merge that skipped it, and the merge step assumes its verdict.

**Write the brief from this template. It carries WHAT to judge and nothing about HOW to read.**

```text
Master QA for <roadmap row or task ids>, branch stack <bottom>..<top> (PRs #<n>-#<n>).
You are on <branch> in <checkout path>.

SETTLED: <the rulings from the trail that constrain the build, one line each>
DEFERRED: <what was ruled out of scope, so you do not report it as missing>

THE REAL RUN: <the exact command> — expect <the stated counts or output>.
<any focused proof command, one per line>

JUDGE: <the specific questions this build raises, numbered>
```

⚠ **A brief never tells master QA how to read.** Its charter owns that: whole files, in parallel
batches, three git calls first. `hooks/reading-floor.js` denies a fragment read of a file in the diff.

| Verdict | You do |
|---|---|
| `pass` | the merge step below |
| `fail` · salvage | `tasks.js add` its tasks, build them, run master QA again |
| `fail` · rewrite | **escalate** - a rewrite needs new requirements, and requirements are gated |
| `fail` twice | **escalate**, whatever it recommends |

**Making it work is not always the cheap option.** Ask three questions. Can you say in one sentence what
the code is _for_? Did a fix contradict an earlier fix? Does holding it together need a special case per
call site? A restart inherits everything learned. Extend the task list with what master QA surfaced.
Prune what the build proved unnecessary. Carry the code that earned its place as snippets in the briefs.
Record the abandoned approach in `lessons.yaml`.

### While you build

**Delegate a hunt, not a lookup.** `Read` a known file whole. Dispatch `outputty:outputty-scout`, in the
foreground and read-only, when an answer needs more than a couple of lookups. Batch every open question
into one run.

**No memory is written during a build.** Lessons are collected once, at the merge retrospective. Never
gate a commit on a clean `git status`, and scope the `git add` instead.

## Merge step - read this once, after the final layer

**Cold path.** Nothing here is needed while layers are building.

### Review pass, before merge

The human reviews the finished PR whenever they like. If they leave comments, turn each into a task with
`tasks.js add <id> <title> --from <reviewed task>` and **run another layer**. Repeat until the PR is
clean, then run the merge step. If no review is wanted, skip straight to merge.

### The merge step itself

1. **Distill the trail into the product docs**, each decision to its file.
   - North Star and Language go to `product.yaml`.
   - Targets go to `roadmap.yaml`, and **a shipped target closes clean**. It takes status `✅`, a
     one-line `status_detail`, and the `summary`'s output made real from master QA's run.
   - The full story goes to its `doc: roadmap/<name>.md` writeup, never onto the row. That writeup
     carries the capability paragraph, the Before/After on the canonical example, the arc, and where
     the record lives.
   - The index and topic files go to `architecture.yaml` and `architecture/*.md`. A new feature, knob or
     limitation gets its index record and its topic-file coverage.
   - **Flip the task state this branch drained** with `tasks.js close <id>`, then run `tasks.js index`.
   - **Prune** anything now stale, and keep link references tight.
   - **Verify before you write.** Any ✅-shipped behaviour you document is run in the codebase first,
     with real output and no guessing.
2. **Record the cycle's pivots in `.claude/lessons.yaml`.** Write one record per approach this branch
   abandoned or reversed, with `title`, `kind`, `files: []` and `body`. Each names
   `.claude/trails/<branch>.trail.yaml` as where the reasoning sits. A bug that got fixed, a refactor, or
   a retry that succeeded earns no record.
3. **Bring every other documentation surface in line**: the README and `docs/`, using the
   `documentation` skill for the README. **Delete documentation that has no reader**: prose restating
   the code, aspirational sections, and above all docs describing a decision the build reversed. Say what
   you cut and why, one line each.
4. **Retrospect**, after the branch's last functional changes and before the PR finalizes. Persist only
   what would speed the next cycle or avert a repeat mistake: distil, route, prune. Run it too when a
   cycle ends _without_ merging, after an escalation or an abandonment.
   - **Reflect on what the session actually holds**: the trail, escalation verdicts, the user's
     corrections at the gates, and docs you fetched in-session. A build agent's internals never return to
     the session, so do not pretend to mine them. Keep a lesson only if knowing it at the next cycle's
     start would have saved time or averted a mistake.
   - **Route** per the always-on memory-routing rule. Decisions are already distilled into the product
     docs. Your one active write is the durable lesson into Claude Code auto-memory: a topic-file entry
     plus a one-line `MEMORY.md` pointer. That covers a process lesson, a gotcha or preference, and a doc
     worth re-reading. **Name the file the lesson is about** so a later edit can surface it. Replace or
     merge index lines, never just append. With no auto-memory available, hand the lessons to the user in
     your wrap-up instead.
   - **Mint a skill** only for a proven, reusable, multi-step procedure. Invoke the installed
     `anthropic-skills:skill-creator` to author it. It lands in the project's `.claude/skills/<name>/`
     on this branch, so it ships with the PR. Most cycles mint none.
5. **Summarise the cycle for the user** in the shape the session protocol enforces. Give one base
   pipeline, then a numbered case per capability, each titled by the user's problem. Each case shows
   `Before:` and now, with **real observed output** quoted from the executed docs or the run. Close with
   the protocol's cost and caught table, attributing each bug to whoever found it. Never compose an
   output value.
6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and nothing more,
   and run `CHECKS` once over the final state before you post. Then write the body to the canonical
   format in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`. It is summary bullets,
   then one section each in the same order. Add before/after JSON only when a real record, file or API
   payload changes. A flow change with no record diff gets a before/after **graph** instead.
7. **Bump the plugin version** in `.claude-plugin/marketplace.json` whenever the branch touched `hooks/`,
   `skills/` or `agents/`. **That version is the cache key**, and `plugin update` is a _no-op_ until it
   changes. Shipping behaviour without a bump means no user ever receives it, silently and with no error.
   Patch for a fix, minor for new behaviour or a new skill.
8. **Green-gate the merge.** Commit and push the merge-step artifacts to the **top** branch of the
   stack, since nothing merges uncommitted. That covers the product docs, the README and any minted
   skill. The full test, build and lint suite must pass on the final state. Then mark every PR in the
   stack ready with `gh pr ready <n>` and land the whole stack **atomically**.

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

   A stack with one unmergeable layer merges zero layers, so a half-built feature can never reach the
   default branch. That is what preserves the rule that nothing merges on an escalation. Non-interactive
   runs merge the whole stack without prompting, and without `--yes` a wizard opens.
