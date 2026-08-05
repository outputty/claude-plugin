# BUILD phase — hands-off, one builder then one QA per layer

Goal: execute the approved task graph without babysitting.

**BUILD runs as plain subagents dispatched by this session — no dynamic workflow, no `ultracode`.** The
orchestrator (you) walks the layers in order and hands each one to **two agents in sequence**: a builder
that writes the layer in one pass, then a QA that reviews it *and repairs what it finds*. Nothing needs a
special keyword, a launch-approval card, or a freshly-authored script.

```
orchestrator (this session)
  ├─ build agent (layer N)   ← Sonnet/low, holds the whole layer, writes code, ONE pass
  └─ QA agent    (layer N)   ← Sonnet/xhigh, reviews the diff, then fixes what it found
                                and loops review→fix→re-review in its own context
```

**Nothing nests.** Both agents sit at depth 1, spawned by this session, so spawn depth is irrelevant —
no `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` requirement, no version floor, and no silent
`Agent`-tool-withheld failure mode. Neither agent has the `Agent` tool; neither needs it.

**Why QA repairs instead of handing back.** QA already holds the file, the line, the repro and the
reason. A builder receiving that as prose has to re-derive all three from a cold context — measured
across 19 days of real builds, the builder/QA pair burned **21,104 API calls and 1,761M tokens of
context**, most of it rebuilding diagnoses that already existed. So the loop lives **inside QA's one
context**: it reviews fully, fixes, re-runs, re-reviews, and comes back once.

**What that costs, and how it's held.** QA now grades work it has partly written, so its charter draws a
hard line: it fixes **defects in the diff**, and may never move the bar — no weakened assertion, no
edited `contract`, no widened scope, no deleted test. The independence that matters is preserved at both
ends: QA's **first** pass is still a cold read of code it didn't write, and **master QA** is still a
fully independent agent at the end of the build.

**One environment fact is still load-bearing.** `CLAUDE_CODE_FORK_SUBAGENT=1` breaks the foreground
contract — fork mode *"removes the `run_in_background` parameter from the `Agent` tool"* and forces every
subagent to the background, so the sequential layer loop stops blocking.
`CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1` takes precedence over fork mode and keeps subagents in the
foreground.

**Why the orchestrator stays in the loop.** A workflow returned one verdict at the end and could not
pause; the orchestrator can course-correct after any layer, and a failure surfaces when it happens
instead of at the end. It also spawns **one builder and one QA per layer, in sequence** — each starts
with a clean context, so nothing accretes across the build.

## Before starting (main session)

1. **Green baseline — and capture the check commands.** Run the project's test/build/lint. If it's red,
   stop and surface it — never build on a broken baseline. While proving it green, **capture the exact
   commands** — lint, typecheck, test (only the ones this project actually has) — as the **`CHECKS`** you
   hand every agent. **The orchestrator tells every agent what to run; no agent guesses the toolchain.**
   A command enters `CHECKS` only after you ran it here and read its exit code — verified, not assumed.

   **Tests are mandatory; how they run is the repo's call.** Every build is gated on a green suite, and
   this step exists to find out how *this* project produces one. Read what the repo already documents —
   its README, its manifest scripts, its contributing guide — and take the commands from there. **A repo
   that documents how to run its tests has given you everything you need.** Don't prescribe a runner,
   don't standardise the invocation, and don't treat one project's setup as the shape others should have.

   **If a faster feedback path exists, use it.** A watch mode, an always-on runner, an editor-integrated
   reporter — anything that re-runs only what an edit touched beats a cold full sweep, and the difference
   is the single biggest time sink in a build (measured on a real session: **183 of 615 shell calls were
   test runs**, 46 of them full multi-package sweeps at ~10s per package). Capture how to read it and pass
   that to every agent alongside `CHECKS`. **If there isn't one, say so once in the recap and move on** —
   agents run `CHECKS` directly, and the gate is unchanged.

   Whatever you capture, **`CHECKS` stays the gate**: the faster path accelerates the loop, it never
   substitutes for the run that proves a layer green.

2. **Derive the layers.** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json`.
   `schedule` already enforces non-overlap (a same-layer scope clash fails loud as a missing dep) and
   rejects cycles — there is no manual overlap check to do. **This graph is *your* ledger, not the build
   agent's** — it is file-backed in `<branch>.tasks.jsonl`, so it survives across agents, and only two
   stages ever write it: you (`schedule`, `add`) and the commit stage (`close`). A build agent never runs
   `tasks.js` at all; you copy its layer's tasks **into its prompt**, and that inline list is its todo
   list. This split is forced, not stylistic: **the Task tools (`TaskCreate`/`TaskGet`/`TaskList`/
   `TaskUpdate`/`TaskOutput`) are withheld from subagents** — only agent-team teammates keep them
   (verified by running: a subagent reports none of them) — so a subagent cannot share your ledger. And
   even a private list it *could* keep would die with the agent, which is exactly wrong when each layer
   gets a fresh one. (`TodoWrite` is a different case: the subagent filters do **not** strip it, so don't
   rely on its absence — the build agent lacks it only because its charter's `tools` allowlist omits it.)

3. **Preflight — reconcile GitHub before the first layer.** One Haiku agent squares GitHub with the
   recorded graph and **never rebuilds code**:
   - **Drift check.** Read the trail's `Planned-at:` SHA. If `git diff --stat <planned-at>..HEAD` is
     non-empty, the graph was authored against an older tree — report it, and **stop for the user only if
     the drift invalidates a task's scope**. (The orchestrator *can* pause now; use that.)
   - **Can this repo stack at all?** `gh extension list | grep gh-stack`. Missing extension, or a repo
     without stacked PRs enabled, is a **hard stop before any layer runs** — there is no fallback shape,
     so report it with the install command and let the user fix it.
   - **Draft PR exists?** `gh pr view --json number,state,isDraft`; missing → `gh pr create --draft` with
     a body stating the **core objective**, per [`references/pr-description.md`](references/pr-description.md).
     This PR is the stack's bottom.
   - **Push** any unpushed commits, then `gh stack sync` so local and remote agree on the stack.
   - **Reconcile the stack, not comments.** `gh stack view` for the recorded layers, and for every
     all-`done` layer confirm it has a PR whose body matches the current template — reconstruct a missing
     one, rewrite (`gh pr edit --body-file`) any that doesn't conform, never open a duplicate.

## The layer loop

For each layer in dependency order, dispatch **two agents, in sequence**. Two dispatch details apply to
both:

- **the namespaced `subagent_type`** — `'outputty:outputty-builder'`, then `'outputty:outputty-qa'`. The
  bare name errors at dispatch.
- **`run_in_background: false`** — subagents run in the **background by default**, which would let the
  orchestrator race ahead instead of waiting. QA cannot start until the builder's diff exists, and the
  next layer cannot start until QA returns, so **both dispatches are foreground**. (Foreground also gets
  the fuller built-in tool set; background is the reduced one.)

**Before dispatch: resolve the layer's `hitl` tasks.** A task marked `mode: hitl` cannot be finished by
an agent — it needs a preference only the user holds, a credential, an account, a judgement about their
own product. **Ask, get the answer, and fold it into the brief before the builder starts.** This is not
optional politeness: `AskUserQuestion` is stripped from every subagent *even when its charter lists it*,
so a build agent that meets one has no way to ask and will quietly answer for the user instead — which is
invisible in the diff and lands as a wrong implementation nobody can trace. No `hitl` task in the layer →
dispatch straight through.

**1 — the builder.** Hand it:

- **its layer's tasks** — each brief, `contract`, and the layer's **union scope**;
- **`CHECKS`**, plus how to read the faster feedback path if this repo has one (and that it has none if
  it doesn't — silence reads as "nobody told me" and gets a cold sweep after every edit);
- the explicit statement that **the tasks in this prompt are its todo list** — it never runs `tasks.js`,
  and the commit stage closes each task once QA passes the layer.

It writes a failing test per `contract`, codes to green, self-gates, and returns `built` + the draft
write-up + per-task summaries + a residual-gap note — or `blocked`. **It never returns a verdict**; a
builder claiming its own layer passed is a defect worth reporting.

**2 — QA**, dispatched against the builder's diff. Hand it everything the builder got, **plus**:

- each task's **review lenses**;
- the **builder's full return** — its draft write-up, per-task summaries, and residual-gap note. This is
  what makes one pass enough: QA starts from what the builder already knows instead of rediscovering it.

QA reviews the whole layer's diff, **fixes every finding itself**, and loops review→fix→re-review inside
its own context until clean. It returns:

| Result | Orchestrator does |
|---|---|
| `passed` — every check green | **surface the final write-up + recap** (below), commit the layer, then the next layer |
| `blocked` — scope/API wall (from either agent) | **stop and escalate to the user** |
| `unmet` — a finding survived two fix attempts, or 5 rounds spent | **stop and escalate**; a layer that can't go green on concrete findings is a **plan** problem for a human, not a model step-up |

**Never re-dispatch the builder on QA's findings.** That round trip is the thing this shape removes — a
second builder run rebuilds from cold exactly the context QA is holding. If QA returns `unmet`, the
answer is a human and a plan amendment, not another builder.

**Returns are a convention, not a schema.** The Agent tool has no structured-output option — a subagent
returns **its final text**. So every charter states the exact shape to end with (`built` + draft write-up
+ summaries, `passed` + checks + what-was-fixed + final write-up, `blocked` + reason/neededScope/evidence,
or `unmet` + verdict/history), and the orchestrator **reads that text defensively**: if a result is
unparseable or empty, treat it as a failed layer and escalate — never as a silent pass. A dead or errored
dispatch is a failed layer too, never a dropped result.

## Between layers — what the user sees

A hands-off build is not a silent one. After **every** layer, print two things, in this order. This is
the only window the user gets into a build they're deliberately not babysitting, so it goes to the
terminal whether or not anyone asked — and it is **relayed, not re-summarized**: the builder drafted it
and QA finalized it, so the work of writing it is already done.

**1. The layer write-up — QA's returned text, verbatim.** Same shape the PR comment gets (see
[`references/pr-description.md`](references/pr-description.md)): what the layer did in plain language,
the *What we're building towards* program annotated **✅ done / ⏳ pending**, and input/output as
separate ` ```json ` blocks. Its output JSON is **expected, not run** and stays labelled that way — the
one real run happens at master QA. Don't paraphrase it into a sentence; the code and the example are the
payload, and collapsing them defeats the point.

**2. A running session recap** — cumulative, not just this layer, so the user can drop in at any point
and see where the build stands. Three tables:

```markdown
| Layer | What it did | State |
|---|---|---|
| 1 · engine | unified the two write paths | ✅ merged |
| 2 · preamble | 9 leaf modules moved behind the barrel | ✅ merged |
| 3 · cases-split | 3,210 lines → 82-line barrel + 11 case files | 🔄 CI running |

| Issue caught | Where | Resolution |
|---|---|---|
| test asserted on a stale fixture | QA, review | ✅ fixed by QA — fixture rebuilt from real data |
| `parse_row` swallows a decode error | builder self-gate | ✅ fixed — now raises with the offending row |
| barrel re-exports shadow 2 names | QA, round 2 | ⏳ deferred → `Drain the barrel re-exports` (`t-31`, after layer 4) |

| Next | Why it's next |
|---|---|
| Layer 4 · wire the CLI | last planned layer; depends on 3 |
| `Drain the barrel re-exports` (`t-31`) | discovered work, blocked until the barrel lands |
```

**Rules that keep the recap honest.** Every deferred issue **names the task it became** — "deferred"
without a task is how work disappears, so if it isn't in the graph it isn't deferred, it's dropped.
**Name it, don't cite a bare id:** `Drain the barrel re-exports` (`t-31`), never `t-31` alone. A wall of
`t-31, t-32, t-33` is illegible and the recap is the one thing a human actually reads during a hands-off
build; the id rides inside the name rather than standing in for it. An
issue QA raised and the builder fixed still appears: rounds burned are signal about the plan, not noise
to hide. And **"what's next" comes from `tasks.js`**, never from memory of the plan.

**Keep it hands-off: allowlist the build's commands first.** Foreground subagents pass permission prompts
straight through to the user, so an un-allowlisted command stalls the build waiting on you. Before
starting, allowlist what the build actually runs: the project's `CHECKS`, plus `git`, `git push`,
`gh pr view`, `gh pr create`, `gh pr comment`, `gh api`, and `tasks.js`. (File edits don't prompt under
`acceptEdits`.)

**Escalation shape (unchanged):** (1) the flow change as a graph — ASCII in the terminal CLI, Mermaid in
Desktop, scoped per [`references/pr-description.md`](references/pr-description.md); (2) a four-part
summary — **expected outcome** (done-condition + the target-program slice it serves) → **what was
attempted** (one line per round + the finding that killed it) → **what is still happening** (with
evidence) → **options** (2–4 concrete moves, recommendation first). Escalated layers are **never**
committed. **Print the session recap under it too** — a stopped build is exactly when the user needs to
see which layers already landed and what was deferred; there is no layer write-up to relay, because the
layer never passed.

**Say that the tree is dirty, and name what is in it.** QA writes code, so an escalated layer leaves its
partial repairs in the working tree — uncommitted, mixed with the builder's original pass, and invisible
in any PR. The user is about to decide between fixing forward and discarding, and cannot do either
blind. End the escalation with the output of `git status --porcelain -uall -- <the layer's scope>` and
QA's *"what you fixed"* list, plus the one-line reset if they want the layer gone:
`git checkout -- <scope> && git clean -fd <scope>`. Never run it for them — a discard is theirs to make.

**Commit + publish (orchestrator, after a layer passes).** One Haiku agent commits each passed task
serially (`git add <scope> && git commit`, then `tasks.js close <id>`) — serial because a shared index
can't take parallel commits. Subject = the task title (≤72 chars, never restated in the body); body =
the builder's one-line problem→solution summary — never the brief, the verification transcript, scope
disclaimers, or tooling bookkeeping. It stages **only each task's scope** (never `git add -A`) and
**never aborts on a dirty tree** (other tools write into the working tree during a build, so a
clean-tree precondition would refuse every commit).
A passed-but-uncommitted task is a **hard stop** — a silent skip leaves it open and the drain rebuilds it.

**Then check what the scoped `git add` left behind.** Staging only each task's scope is right, and it has
one consequence worth catching: an edit QA **approved** as a scope-negotiation finding sits *outside* the
folder, so nothing stages it. Run `git status --porcelain -uall` after the layer's commits and read what
is still there. A leftover the layer produced is a **hard stop, not a warning** — the layer reports
committed, the PR silently lacks the change, and the gap surfaces later as behaviour nobody can trace to a
diff. The fix is `tasks.js amend <id> --scope <folder>` and a re-commit, which is what the amend command
exists for. Leftovers from other tools are fine; that is why the stage never gates on a clean tree.

**Then publish the layer as its own PR, stacked** — read [`references/stacking.md`](references/stacking.md) now. QA's final write-up becomes
that PR's **body**, posted verbatim: the builder drafted it and QA amended it against the end state, and
a Haiku agent re-deriving the same write-up from commit messages and a diff can only guess. The stage's job is to open the PR, **not** to
compose its description — don't rewrite it, don't re-summarize it, don't add a diagram. Only if
no write-up came back at all do you fall back to deriving one from the commits + diff, against the
canonical spec handed to you **by path**
(`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`; protocol.md is gated out of
subagents) — and that fallback is a **defect worth reporting**, not a normal path. Either way the stage
does **not** run the program: the snapshot's JSON stays marked-expected, and the one real run + the one
diagram land at master QA / the final body.

## The graph has drained — drain again, then run master QA

**This section fires once, after the last planned layer passes.** Both steps below used to live in
`references/stacking.md`, which is read while publishing *layer 1* — so the instruction arrived at the
moment it could not apply and was gone by the moment it had to fire. They are here now because this is
where you are when they are due.

**1 — Drain discovered work.** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" ready --json`;
while it returns tasks, run them as another layer through the same builder→QA loop. Guard it: only
`discovered_from` tasks may drain — an **original** surfacing in `ready` means its commit never closed it,
so escalate rather than rebuild.

**2 — Master QA, once, when `ready` comes back empty.** Dispatch **`outputty:outputty-master-qa`** —
`subagent_type: 'outputty:outputty-master-qa'`, `run_in_background: false` (the bare name errors at
dispatch, and a background dispatch lets you race past the gate). Hand it the branch, `product.md`, and
the layer write-ups.

It is read-only by design — per-layer QA writes code now, so master QA is the last reviewer who touched
nothing. It does three things nobody else does: **runs the target program for real** (the build's only
actual execution, which is why every per-layer write-up says *expected, not yet run*), judges the whole
diff against product.md's **North Star, roadmap and Architecture** rather than against craft, and writes
**the handover**.

**Skipping it is not a shortcut, it is shipping unrun code.** Nothing else in the flow executes the thing
you built; every green check below this point is a test suite agreeing with itself. If you reach the merge
step without a master QA verdict in hand, you have skipped the gate — go back and run it.

## After master QA — the salvage-or-restart decision (orchestrator)

**Master QA's verdict is yours to act on.** It reviews and recommends; it never edits, never rebuilds, and
never restarts. This is the one point in the flow where the whole build is visible at once, so it is where
the question gets asked: **is this worth patching, or worth doing again?**

| Verdict | You do |
|---|---|
| `pass` | the merge step |
| `fail` · **salvage** — sound build, specific gaps | `tasks.js add` master QA's tasks, re-run build→QA for **those tasks only**, then master QA again |
| `fail` · **rewrite** — the foundation is wrong | **escalate**; a rewrite needs new requirements, and requirements are gated |
| `fail` twice | **escalate**, whatever the recommendation says |

**Making it work is not always the cheap option — this is where that bites.** The pull is always toward
keeping what exists: it runs, it took effort, and throwing it away feels like waste. But patches layered
on an approach that no longer holds have a compounding cost the diff doesn't show — **every one makes it
harder to tell what is load-bearing**. Three patches in, nobody can say which parts are the design and
which are scar tissue, and the next agent has to keep all of it because it can't tell them apart. A
rewrite that starts from a sharper task list is often *less* work than the fourth patch, and it always
leaves something a reader can follow.

**So don't ask "can this be made to work?" — nearly always yes.** Ask:

- Can you state in one sentence what the current code is **for**? If not, that is the answer.
- Did a fix **contradict** an earlier fix? Contradicting patches mean the model underneath is wrong.
- Does holding it together need a **special case per call site**? The abstraction is fighting the problem.
- Would you rather **explain** this code to the next agent, or **restate the requirement**? If restating
  is easier, restart.

None of these is "it feels messy." Each is evidence, and each comes from an agent that already tried.

**A restart is not a reset — it inherits everything that was learned.** When the call is to redo the work,
do these four things in order, or the next attempt repeats this one:

1. **Extend the task list with what you now know.** Every constraint master QA and QA surfaced becomes a
   task detail — the failure mode, the edge case, the API that doesn't behave as PLAN assumed. The old
   graph was written by someone who didn't know these; the new one must not be.
2. **Prune it.** Drop tasks the build proved unnecessary, merge ones that were never really separate, and
   re-derive layers (`tasks.js schedule`). A restart that carries the old graph's mistakes forward is just
   the same build again.
3. **Carry the code that earned its place.** Master QA and QA each named what is worth keeping — the tests
   that encode real contracts, the snippet that turned out to be the hard part. Put those **in the task
   briefs as snippets**, not as a branch to merge from. Inline code a new builder can read beats a diff it
   has to archaeologize.
4. **Record what was abandoned.** The approach that didn't work goes to `.claude/lessons.md` via the
   `outputty-docs` agent — otherwise the next cycle re-derives this dead end from scratch. **This is the
   single highest-value artifact a failed build produces.**

Then start the graph again. **The escalation to the user carries all four** — the revised task list is
what they are approving, not a bare "it failed."

## Navigation and memory during build

**Navigate with the LSP** where the language has a server — go-to-definition and find-references, and
diagnostics after each edit that catch a type error without a compiler run. `Grep`/`Glob` are the floor
otherwise. A memory naming a file you are about to edit is surfaced automatically by the `memory-recall`
hook; read it before the edit, not after.

**No memory is written during a build.** Lessons are collected once, at the merge step's retrospective —
capturing per-edit is how a memory store fills with noise nobody reads. Other tools may leave the working
tree dirty, so **never gate a commit on a clean `git status`** — scope the `git add` and ignore the rest.

## Where the rest lives

Three cold surfaces moved out of this file so they stop riding in the orchestrator's context for the
whole build. Read each **at its moment**, not up front:

| When | Read |
| --- | --- |
| A layer passed; you are committing and publishing it | [`references/stacking.md`](references/stacking.md) |
| Every layer has landed and master QA passed | [`references/merge-step.md`](references/merge-step.md) |
| Choosing or questioning an agent's model/effort tier | [`references/model-policy.md`](references/model-policy.md) |
