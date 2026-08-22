# outputty - Roadmap

> One target per entry. Live entries link their task in the `tasks` MCP server; shipped entries their
> PR. The story lives in PRs and `lessons.md`, never here. Status: ✅ shipped · 🔨 in progress · 📋
> planned · ❌ killed.

## Where things stand

Current: 0.66.0. The flow runs as **two stages** joined only by the task queue: planning (SPEC + PLAN,
synchronous, gated) and building (BUILD + master QA + merge, asynchronous, unattended), with `spec:
replan` as the iteration between them. The discovery front-end, product memory, and the guard layer
are shipped. 0.48.0 collapsed BUILD onto the session itself; 0.52.0-0.53.0 cut the instruction set to
what a measurement could defend and made the flow Herdr-native; 0.54.0 (entry 23) deleted every hook,
moving the flow to skills and a managed CLAUDE.md block init writes; 0.61.0 moved the task graph and
trails to the `tasks` MCP server; 0.65.0 added the issue-authoring skill and 0.65.1 corrected the tasks
tool names; **0.66.0 (entry 26) reverted product memory from YAML records back to prose Markdown docs
read whole, and deleted the `docs.js` query tool.**

Entries 1-17 predate the mini-spec `summary` convention and carry a one-line note; entries added from
18 on carry a full mini-spec (problem, solution, e2e in/out).

## Targets

### 1. Flow spine (branch → SPEC → PLAN → BUILD → master QA → merge)

**Status:** ✅ shipped · **Depends on:** none

Gated SPEC + PLAN; unattended BUILD; the stage skill is the entry point (entry 23 made stages skills).
Entry 21 split the spine into two independently-run stages.

### 2. Product memory (`product.md` + `roadmap.md` + `architecture.md` + `lessons.md` + `examples.md`)

**Status:** ✅ shipped · **Depends on:** none

Five prose docs by role, read whole (the task graph moved to the `tasks` MCP at 0.61.0; the sets
reverted from YAML records to prose Markdown at 0.66.0, entry 26). External facts routed to where their
reader works (`claims/` dissolved 2026-08-10); ✅ statements verified by a run.

### 3. `docs.js` - a query tool over product memory's YAML records

**Status:** ❌ killed · **Depends on:** Product memory · **PR:** #86

Structured records over prose docs; generic `--<field>` filters covered every catalogue scenario; a
`--fields` name no record carried warned on stderr. **Killed at 0.66.0 (entry 26):** product memory
reverted to prose Markdown read whole, so `docs.js`, its test, and the `package.json` `test` script are
deleted. Reasoning in `lessons.md`.

### 4. Roadmap-rework transfer (roadmap = WHAT targets, mini-spec summaries)

**Status:** ✅ shipped · **Depends on:** none · **PR:** #90

2026-08-11 laygo rulings (PR #184 shape): product=why, roadmap=what, tasks=how; summary mini-specs
(problem→solution→e2e I/O); 'target' replaces 'objective'. The `roadmap/<name>.md` depth writeups
reverted at 0.66.0 (entry 26); the mini-spec `summary` discipline stays.

### 5. Action-first output rules in the protocol (adapted from ayghri/i-have-adhd, MIT)

**Status:** ✅ shipped · **Depends on:** none · **PR:** #89

Lead with the action; steps numbered, capped at 5; restate state; unblock-the-reader closing action;
second-issue deferral; no preamble/closers; first/last-line pre-send check. A conflict pass reconciled
it against grill, drift-check, and autonomy rules.

### 6. Laygo-session corrections (coverage-index architecture, tasks index, claims dissolved)

**Status:** ✅ shipped · **Depends on:** Product memory · **PR:** #88

Architecture = index + self-contained topic files, Mermaid inline; roadmap = targets only; the task
graph was the tracker (moved to the `tasks` MCP at 0.61.0). The coverage-index + depth-folder
architecture and the query catalogue reverted at 0.66.0 (entry 26).

### 7. Task graph + derived layers (`tasks.js`)

**Status:** ✅ shipped · **Depends on:** Flow spine

Deps authored, layers derived; a dependency cycle fails loud. Entry 22 moved the graph into the trail.
DEPRECATED at 0.61.0: the graph moved to the `tasks` MCP server and `tasks.js` was deleted; `schedule`
derives the layers now.

### 8. Hands-off BUILD (the session builds every layer itself; one stacked PR per layer)

**Status:** ✅ shipped · **Depends on:** Task graph

No build agent and no per-layer QA. BUILD is the session: test-first per task `contract`, `CHECKS` run
for real per layer, `gh stack` per layer, one master QA at the end. `lessons.md` holds why the two
agents went.

### 9. Grilling (simple + advanced expert/adversary panel)

**Status:** ✅ shipped · **Depends on:** Flow spine

Engine of SPEC; `skills/grill/SKILL.md`, loaded by `skills/planning`. Nothing enforces the load;
`lessons.md` holds the gate that tried and how it was defeated.

### 10. SPEC spike (a `spike-<slug>` test in the repo's own suite)

**Status:** ✅ shipped · **Depends on:** Grilling

0.13.7; optional + triggered. The spike is a committed test, variants as cases; it graduates into a
routed fact's re-verification probe or is deleted in the same session.

### 11. Discovery front-end (`audit` + playbook)

**Status:** ✅ shipped · **Depends on:** Product memory

Feeds this roadmap (target-level picks) and `add_task` (task-shaped picks); the playbook is also master
QA's review-lens library.

### 12. Guards (secret files, dangerous commands, write boundary)

**Status:** ✅ shipped · **Depends on:** none

Declarative `permissions` `/outputty:init` writes into the consumer repo, plus the platform classifier;
see `docs/security.md`. Was six PreToolUse hooks until 0.54.0 (see entry 23). Never ship a gate that
passes on a string an ordinary session emits; `lessons.md` names the two that were deleted on that
ground.

### 13. Docs + diagram skills (`documentation`, `diagram`)

**Status:** ✅ shipped · **Depends on:** none

`documentation` owns README and project-doc rewrites and reaches for `diagram` only when a picture is
earned. There is no `qa` skill for docs; the merge step and master QA carry that work.

### 14. SIMULATE (design-fork permutations)

**Status:** ❌ killed · **Depends on:** none

Killed at 0.33.0: zero dispatches in four weeks. A design fork is an empirical question, so it goes
back to SPEC as a spike per candidate.

### 15. Session→domain-skill mining (`extract-expertise`)

**Status:** ❌ killed · **Depends on:** none

Authored 0.14.0, never run end-to-end, deleted at 0.33.0 in the same measurement pass as SIMULATE.
Skill minting now routes to the installed `anthropic-skills:skill-creator` from the merge
retrospective.

### 16. Spike node on the committed flow diagram

**Status:** ❌ killed · **Depends on:** none

The premise is gone: the committed flow diagram under `docs/` was deleted at 0.53.0. Its BUILD half
still drew four agents deleted 92 minutes after its last commit, and 1,622 transcripts contain 0 reads
of anything in that directory.

### 17. Agent-teams BUILD backend

**Status:** 📋 planned · **Depends on:** none

Deferred until it exits experimental and gains resumption. Its premise weakened at 0.48.0: BUILD no
longer dispatches agents per layer, so a teams backend now buys parallelism the dependency graph
already expresses. Entry 21 weakened it again: parallelism now comes from many build sessions draining
one queue. Reasoning in `lessons.md`.

### 18. Master QA reads whole files (a discipline a dispatch brief cannot override)

**Status:** ✅ shipped · **Depends on:** Hands-off BUILD

**Status detail:** 0.54.0 - a rule in the `outputty-master-qa` charter (was `hooks/reading-floor.js` at
0.53.0). The driver still pins the reviewer's committed-range git usage.

Problem: master QA's charter says to read each changed file whole, and across three real runs it did
the opposite - 8-10 whole reads against 44-63 fragment fetches. The cause was not defiance. The
orchestrator's freehand dispatch brief carried "query, never read whole" verbatim in 3 of 3 runs, and a
brief outranks a charter because it is the only user turn a subagent sees. Solution, two parts: stop
the brief from carrying reading instructions (a WHAT-only dispatch template in the build stage), and
state the whole-file floor in the master-QA charter so it holds without a brief. The floor was a
`reading-floor.js` hook at 0.53.0; when 0.54.0 removed all hooks (entry 23) it became a charter rule,
since a plugin cannot ship a hook-free deterministic deny.

### 19. Herdr-native orchestration (thin main session; each item and its gates in its own child workspace)

**Status:** ✅ shipped · **Depends on:** Flow spine

**Status detail:** 0.53.0 - role detection via `hooks/lib.js`, the orchestrator charter, and a
`write-boundary.js` deny. 0.54.0 (entry 23) moved the charter and the write boundary into the CLAUDE.md
block and dropped the hook; the role is now the checkout, stated in the block.

Problem: the orchestration rules lived in a global CLAUDE.md that never reaches a plugin consumer, and
they split the work the wrong way - thinking on main, doing in the child - so main ran SPEC and PLAN
for an item it would never build. Solution: one thin orchestrator per repo in the primary checkout;
every work item gets its own worktree-backed workspace where its stage runs, gates included, with the
user answering them there. The role is detected mechanically, with no new flag.

    $ HERDR_ENV=1 node hooks/session.js < /dev/null   # in the primary checkout

Output (REAL OBSERVED): the first line is `# OUTPUTTY — orchestrator session (Herdr)`, followed by the
shared rules only. Neither stage file is injected, so a grep for the two stage headings returns 0.

### 20. The bare-minimum cut (delete what no measurement defends)

**Status:** ✅ shipped · **Depends on:** none

**Status detail:** 0.52.0-0.53.0 - 19 files deleted, 12 merges folded, 9 conflicts resolved, and every
human-facing and agent-facing doc rewritten against what actually ships.

Problem: the plugin carried a reference library nothing opened. Of 1,902 lines the audit marked for
deletion, 1,437 (76%) sat in files with a lifetime read count of 0 or 1, two shipped gates were
defeated by construction, and nine rules contradicted each other across files - including two published
`docs.js` commands that returned nothing. Solution: delete the unread files, fold each survivor's one
live paragraph into the file that already reaches a reader, and name a winner for every conflict.

    $ git ls-files 'hooks/*' 'skills/**' 'agents/*' | wc -l

Output (REAL OBSERVED): 49 at 0.51.0, 37 at 0.53.0. Every deleted rule was either folded into a surface
that already reaches a reader (the injected protocol, a preloaded skill, a charter) or dropped with its
measurement recorded.

### 21. Two-stage flow (planning synchronous and gated; building asynchronous on a sweep; the task queue between them)

**Status:** ✅ shipped · **Depends on:** Flow spine, Task graph, Herdr-native orchestration

**Status detail:** 0.54.0 - the two stages are `skills/planning` + `skills/build` (entry 23 made them
skills, replacing the injected stage files); `spec` and `tier` on the task; `tasks.js
ready`/`planning`/`index`.

Problem: one session carried the whole cycle, so the human-gated half and the unattended half were
welded together. No build could start until a human had sat through SPEC and PLAN in that same session,
and a build that then hit unclear requirements had two exits, both bad: guess, or stall in a pane
nobody is watching. Solution: two stages joined only by the task queue. Planning is synchronous, gated,
one item at a time, and it ends at `spec: settled` plus a `tier`. Building is asynchronous and starts
from a sweep over `tasks.js ready`. A build that hits a requirements gap scratches that work, appends
an `attempts` entry, sets `spec: replan`, and stops; the item re-enters planning carrying the evidence.
Each session is TOLD its stage and `hooks/session.js` injects only that stage's file.

    $ echo build > .claude/stage
    $ node hooks/session.js < /dev/null | head -1
    $ node hooks/session.js < /dev/null | grep -c 'PLANNING stage'

Output (REAL OBSERVED): `# OUTPUTTY - BUILD stage`, then `0`. The planning stage file is not injected.
With neither `OUTPUTTY_STAGE` nor `.claude/stage` set, both files inject and one session runs
everything.

### 22. Task graph in the trail, task state one file per task

**Status:** ✅ shipped · **Depends on:** Task graph, Product memory

**Status detail:** 0.54.0 - the `tasks:` section in the trail, `.claude/tasks/<id>.yaml` per task, and
the derived `.claude/tasks.yaml` index. Every `<branch>.tasks.yaml` was folded into its trail.
DEPRECATED at 0.61.0: the whole file engine (`tasks.js`, `.claude/tasks/`, the trail files) was
deleted; the task graph and each task's trail now live in the `tasks` MCP server.

Problem: a branch carried two files, `<branch>.trail.yaml` and `<branch>.tasks.yaml`, and the tooling
rewrote the second one whole. `Bun.YAML.stringify` flattens every `|` block scalar into one escaped
line, so any tool write destroyed hand-authored prose. Structure and state also shared one writer, so
two sessions on one branch conflicted over a task's status. Solution: structure is hand-authored in the
trail's `tasks:` section and never tool-written. Mutable state (`status`, `spec`, `tier`, `attempts`)
goes to `.claude/tasks/<id>.yaml`, one file per task. `tasks.js index` derives `.claude/tasks.yaml`
from the two halves joined field by field.

    $ md5 -q .claude/trails/feature-csv-export.trail.yaml
    $ bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" close schema
    $ md5 -q .claude/trails/feature-csv-export.trail.yaml

Output (REAL OBSERVED): `6d8484de2b94a352fe5b889a079ea0a1` before and after, byte-identical. The write
landed in `.claude/tasks/schema.yaml`, which now reads `id: schema` / `spec: settled` / `status: done`.

### 23. Skills-only conversion (delete every hook; init writes the CLAUDE.md block + permissions)

**Status:** ✅ shipped · **Depends on:** Two-stage flow, Herdr-native orchestration

**Status detail:** 0.54.0 - `hooks/` is gone; `skills/planning`, `skills/build`, `skills/init` and
`skills/init/block.md` carry the flow; `docs/security.md` documents the permissions.

Problem: the plugin leaned on hooks - a SessionStart hook injected 30-38KB into every session, and six
PreToolUse hooks denied tool calls. Injection was wasteful and the deny-hooks fought the platform: the
permission classifier blocked edits to the guard scripts, and an audit found two gates passable by
accident. Solution: delete all hooks and rebuild on skills + declarative config. The two stages become
skills the orchestrator invokes (`/outputty:planning`, `/outputty:build`); the always-on rules (the role
table, the product-memory read catalogue, the writing standard) move into a managed CLAUDE.md block that
a run-once `/outputty:init` writes; enforcement becomes `permissions` init writes into
`.claude/settings.json`. Every role loads on demand from the block's role table, the orchestrator through
`/outputty:orchestrate`. Per-session always-on load dropped from ~4,000 words to ~1,073 (the block), with
stage content now loaded only on demand.

### 24. QA gradation + full-diff review (skip / inline / subagent, set at PLAN)

**Status:** ✅ shipped · **Depends on:** Hands-off BUILD, Two-stage flow

**Status detail:** 0.55.0 - `qa` on the task (tasks.js validates + surfaces it), the review branch in
skills/build, and the full-diff-first rule in the outputty-master-qa charter.

Problem: every build ran the full independent master-QA subagent, even a one-line removal - and the
reviewer read every changed file whole on top of the full diff, doubling the read. Solution: a `qa`
task field (`skip` | `inline` | `subagent`, default `subagent`) set at PLAN, never by the build, so a
session cannot downgrade its own review; a build's level is the strongest `qa` among its drained tasks.
`subagent` is the independent pass, `inline` a self-review in the build session, `skip` is CHECKS-green.
Master QA now judges the full `git diff` as its primary read and reads a file whole only when a finding
needs the surrounding code. The build also reads its test watcher instead of re-running the whole suite
each layer.

### 25. Generic read-only reviewer + skills at dispatch (agents carry no domain logic)

**Status:** ✅ shipped · **Depends on:** QA gradation

**Status detail:** 0.56.0 - `agents/outputty-reviewer.md` (generic read-only) + `skills/qa/SKILL.md`;
the build skill's qa gradation dispatches the reviewer with the qa skill or loads it inline.

Problem: each read-only subagent job was a bespoke agent, and the qa gradation's `inline` level had to
read the master-QA agent charter as a lens list - awkward, and the review logic lived in a place a
session couldn't cleanly reuse. Solution: one generic read-only executor, `outputty-reviewer`, that
carries no domain logic; the dispatch names a skill to load and sets the model. The whole-build review
became the `qa` skill, run on the reviewer at opus/xhigh for `subagent` and loaded in the build session
for `inline` - one home for the logic, two contexts. `outputty-master-qa` was deleted. Kept bespoke:
`outputty-expert` (it writes a knowledgebase, so it is not read-only). References (merge-step, spike)
stay references, not skills - a reference costs nothing until read, a skill costs its description
always.

### 26. Revert product memory to prose Markdown; delete `docs.js`

**Status:** ✅ shipped · **Depends on:** Product memory, `docs.js` query tool

**Status detail:** 0.66.0 - the five `.claude/*.yaml` sets become `.claude/*.md` prose docs read whole;
`skills/outputty/docs.js` + `docs.test.js` + the `package.json` `test` script are deleted; the template
(`references/product-template.md`), the CLAUDE.md block, every skill, the output style, and the README
name the `.md` files instead of a `docs.js` command.

Problem: the five memory surfaces were YAML record sets read slice-by-slice through a `docs.js` query
tool (0.47.0, entries 3 and 6), because one 1,494-line monolith was too big to read whole. Two changes
removed that pressure: the task graph and trails moved to the `tasks` MCP server (0.61.0), and the
memory that remained is small. The query machinery then cost more than it saved: a session had to hold
a command catalogue, prose lived as `|` blocks a tool could not safely rewrite, and the index/depth
split forked each doc across an index record and a topic file. Solution: revert to human-readable prose
Markdown docs read whole, and delete the query tool.

    $ fd -e yaml -e yml .claude
    $ ls .claude/*.md

Output (REAL OBSERVED): the first command prints nothing (no YAML data left); the second lists
`architecture.md  examples.md  lessons.md  product.md  roadmap.md`.
