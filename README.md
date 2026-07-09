# outputty

outputty is a thin, deliberately unoriginal spec-driven Claude Code plugin. It invents almost nothing
— it wires together tools that already do the hard parts and adds just enough logic to sequence them:

- **grill-with-docs** — Matt Pocock's interview skill; the questioning engine behind the SPEC phase.
- **OpenWolf** — operational memory + token discipline.
- **ponytail** — the laziest-working-diff build discipline.

The only original parts are the **loop** that carries a feature through grill → plan → hands-off build
(per-layer iteration, a single escalation), the **task graph** that tracks the work (see [Task
tracking](#task-tracking)), and a handful of **documentation patterns** I kept reaching for, packaged
as `outputty-documentation`.

## Requirements

Needs **OpenWolf** (`openwolf init`) and **git**; the full flow also needs a **GitHub remote +
authenticated `gh`** (it opens a draft PR). Anything missing is surfaced at session start.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin   # public repo (or a local path to a checkout)
claude plugin install outputty@outputty                # pulls ponytail automatically
```

Equivalently, from inside Claude Code: `/plugin marketplace add outputty/claude-plugin`, then
`/plugin install outputty@outputty`, then `/reload-plugins`.

Then, once, remove the standalone grill copy so there's a single source of the grilling engine:

```bash
rm -rf ~/.claude/skills/grill-with-docs
```

You'll know it's live when a change request opens the **SPEC grill** (business questions first)
instead of jumping straight to code.

## Update

Third-party marketplaces don't auto-update, so a new version won't reach you until you pull it. The
`version` in `marketplace.json` is the cache key: `plugin update` is a no-op until that version is
bumped, and a stale local listing hides a new version — which is why the refresh comes first.

**Manually**, from inside Claude Code — refresh the listing, update, reload:

```text
/plugin marketplace update outputty
/plugin update outputty
/reload-plugins
```

**Automatically** — enable it once: run `/plugin`, open **Marketplaces**, select **outputty**, and
choose **Enable auto-update**. Claude Code then refreshes the marketplace and updates installed plugins
at startup, prompting you to run `/reload-plugins`.

## The flow

Describe the work — the `outputty` skill triggers on any feature or change request (or run
`/outputty <what you want>`). One feature branch carries the whole cycle: **two human-gated phases up
front, a hands-off build behind them, and a single escalation as the only interruption.**

![outputty flow (top-down): a feature request cuts a branch and draft PR before any work; a human-gated SPEC phase grounds first, then runs a simple business-then-technical grill or an optional advanced pass that proposes an expert slate, stops to ask you for a narrower scope when more than four lenses are needed, then fans out expert + adversary agents as one dynamic workflow; a human-gated PLAN derives layers from a task graph; a hands-off BUILD dynamic workflow drawn as distinct stacked stages — a build-loop picks the next ready layer, a build stage runs its tasks (Haiku executor, then Sonnet QA agent, then commit; retry once, escalate to you on a double failure), a post-build "last layer?" conditional loops back for the next layer or drops to a master-QA stage that checks the whole diff against product.md; then the orchestrator distills product.md, green-gates, and merges to shipped](docs/flow.svg)

0. **Branch + draft PR** — cut `feature/<x>` and open a draft PR before any work, so scoping and code review together.
1. **SPEC** *(gated)* — grill business then technical goals as distinct passes; log a thought-trail.
2. **PLAN** *(gated)* — write the task graph (tasks + deps); `tasks.js schedule` derives the layers; you OK the schedule.
3. **BUILD** *(hands-off)* — a dynamic workflow: loop the layers (per task, Haiku executor → Sonnet QA → commit), then a master QA checks the whole diff against `product.md`. Retry once, escalate on a double failure.
4. **Merge** — distill the trail into `product.md`, green-gate, mark the PR ready, merge.

**Brownfield repo** with no `.claude/product.md`? Run `/outputty-init` once to reconstruct it from
your existing docs and history. Grill anything ad hoc with `/outputty-grill`.

## How grilling works

Grilling is the SPEC phase — the interview that turns a request into a precise, agreed spec before any
code — and it has two modes. **Simple is the default.**

**Simple** is the one-question-at-a-time interview: business goals first, then technical, each with a
recommended answer, backtracking on conflicts and reading the codebase (via OpenWolf's `anatomy.md`)
instead of asking what's discoverable. Decisions land in `.claude/product.md`, the thought-trail in
`.claude/trails/<branch>.md`. No agents, no workflow.

**Advanced** *(opt-in, for a non-trivial plan)* is offered **after grounding**, so you can weigh its
extra turns and one workflow wait first. It adds three stages:

1. **Ground, then Why → What → How** — establish where you stand (`product.md`/`anatomy.md` + external
   references), then interview along a Why → What → How agenda, still one question at a time.
2. **A panel, run as one dynamic workflow** — you pick a slate of domain experts, one per **orthogonal
   lens** with real surface area (add your own via *Other*, attach references per expert). Experts are
   named by canonical discipline slug and reused across sessions from `.claude/experts/` — the panel
   proposes existing ones before minting new. **More than 4 lenses stops the panel:** rather than grow
   it, the flow asks you (`AskUserQuestion`, with a free-form option) for a narrower scope, because that
   many lenses means the scope is too big to grill in one pass. One workflow fans out `outputty-expert` (one per lens) plus
   `outputty-adversary` (a grounded skeptic + contrarian that always runs). Every agent is
   **cite-or-drop**: a claim without a quoted, actually-ingested source is dropped, not softened.
3. **Synthesize** — the workflow returns one report; the session weighs it against `product.md`, shows a
   decision-ready summary and a convergence verdict, and you re-round or move to PLAN.

### The parts that weren't obvious

The panel runs as a **[dynamic workflow](https://code.claude.com/docs/en/workflows)** rather than
turn-by-turn subagents, so the expert chatter stays out of the interview and only the report returns.
Two things about it cost real time to work out:

- **The panel agents must be _plugin_ agents.** A workflow selects an agent by its registered type, and
  in this runtime the registry holds **built-in + installed-plugin agents only** — files dropped into a
  project `.claude/agents/` directory are never loaded (the Claude Agent SDK supplies agents
  programmatically; it doesn't scan that folder). So `outputty-expert` and `outputty-adversary` ship in
  the plugin's [`agents/`](agents/) directory and register once the plugin is installed and loaded.
  Editing them during development needs a `/reload-plugins` or a restart before they're visible — a
  freshly-created agent is invisible to the running session.
- **The workflow is yours to launch.** A dynamic workflow is a user opt-in (`ultracode`, or "use a
  workflow"), not something a skill fires on its own, and in normal permission modes it shows a one-time
  launch-approval card. Grilling proposes the panel and hands you the launch.

The adversary is read-only (`Read`, `WebFetch`, `WebSearch`, `Grep`, `Glob`) — it evaluates, never
writes. Each expert adds `Write` for one purpose: its own knowledgebase under `.claude/experts/` —
`<slug>.md` (findings footnoted to sources, disproven priors kept with the reason why) plus a `<slug>/`
cache of every source it fetched, so a claim outlives the URL behind it. Neither touches feature or
product code.

## Task tracking

PLAN and BUILD don't hand-author a task list — they write a **dependency graph**. Each task is one
line of JSON in `.claude/trails/<branch>.tasks.jsonl` (`id`, `deps`, `scope`), and a dependency-free
Node engine derives the run order instead of you numbering layers:

```bash
node skills/outputty/tasks.js schedule
```

```text
Layer 1: api, schema
Layer 2: ui
Layer 3: docs
```

Layers are computed, not authored: `schedule` groups the tasks whose deps are all done and fails loud
on a cycle or two same-layer tasks touching one file (a missing dep). BUILD drains the layers, marks
each task done, and files any work it discovers — so progress lives in the graph, not a checklist.
Full reference: [`skills/outputty/tasks.md`](skills/outputty/tasks.md).

## Design

outputty owns only the flow and one product doc; everything else is delegated. Architecture, the
memory boundary, and what was tried live in [`.claude/product.md`](.claude/product.md) — the single
source (it's dogfooded). The one rule to carry: **decisions live only in `product.md`**; OpenWolf's
`.wolf/` holds navigation, gotchas, and bugs, never decisions.

## Safety

BUILD runs shell and git autonomously, so PreToolUse hooks guard it — destructive-command denial,
secret-content and secret-file blocking, and the `require-environment` edit guard. For the guard
details and a copy-paste secret-file deny-list to add to your own `settings.json`, see
[`docs/security.md`](docs/security.md).
