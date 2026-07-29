# outputty

outputty is a spec-driven Claude Code plugin that carries one feature from intent to shipped code: you
gate the **spec** and the **plan**, then a hands-off **build** turns the plan into commits behind a
single escalation.

Two engines do the work, and they're outputty's own:

- **A panel-of-experts grill** stress-tests the spec — domain experts picked by lens plus a standing
  adversary, every claim cited or dropped, each expert keeping a knowledgebase across sessions.
- **A hands-off build loop** drains a dependency-ordered task graph (see [Task tracking](#task-tracking)),
  **one builder + one QA per layer**: a Sonnet builder builds all of a layer's tasks **test-first** (a
  failing test per task's contract, then the laziest diff to green — the test is the definition of done),
  a Sonnet QA at **xhigh** effort reviews the whole layer (are the tests real and matching spec + docs, then
  code quality and pattern-conformance), and the two **loop up to three rounds** before the layer commits,
  pushes, and posts a terse PR comment. The model is **tiered by role** — Sonnet-at-low builds (the failing test
  it wrote first is what constrains it), Sonnet-at-xhigh reviews, Haiku does the mechanical commit, and
  Opus runs the final whole-build master QA. A layer still
  stuck after three rounds escalates to you
  (that's a plan problem for a human, not a model step-up); a builder that hits a scope wall reports
  blocked instead of improvising.

It stands on **OpenWolf** (operational memory + token discipline). The build discipline is outputty's
own — the laziest-working-diff reflex and the self-gate the executor runs before QA — with credit to
the projects that shaped them (see [Credits](#credits)).

## Requirements

Needs **OpenWolf** (`openwolf init`) and **git**; the full flow also needs a **GitHub remote +
authenticated `gh`** (it opens a draft PR). Anything missing is surfaced at session start.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin   # public repo (or a local path to a checkout)
claude plugin install outputty@outputty                # the plugin — no other marketplace deps
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

**Manually** — refresh the marketplace cache, then update the plugin. From a terminal:

```text
claude plugin marketplace update outputty
claude plugin update outputty@outputty
```

Address the plugin as `outputty@outputty` (`plugin@marketplace`) — a bare `outputty` returns "not
found". (`claude update outputty` is unrelated: it updates the Claude CLI, not the plugin.) Inside
Claude Code the same runs as `/plugin marketplace update outputty` then `/plugin update outputty@outputty`;
restart or `/reload-plugins` to apply.

**Automatically** — enable it once: run `/plugin`, open **Marketplaces**, select **outputty**, and
choose **Enable auto-update**. Claude Code then refreshes the marketplace and updates installed plugins
at startup, prompting you to run `/reload-plugins`.

## The flow

Describe the work — the `outputty` skill triggers on any feature or change request (or run
`/outputty <what you want>`). One feature branch carries the whole cycle: **two human-gated phases up
front, a hands-off build behind them, and escalation as the only interruption.**

![outputty flow (top-down): a feature request cuts a branch and draft PR stating the core objective before any work; a human-gated SPEC phase grounds first, then grills business-then-technical goals, with an optional advanced pass that fans out expert + adversary agents in parallel; a human-gated PLAN derives layers from a task graph; a hands-off BUILD loops per layer — one builder builds the layer test-first, one QA reviews the whole layer diff, the pair loops up to three rounds, then a mechanical commit pushes and posts a per-layer PR comment, and a layer that still fails escalates to you; after the graph drains a master-QA stage runs the target program and checks the whole diff against product.md; then the orchestrator distills product.md, runs a lessons retrospective into memory, green-gates, and merges to shipped](docs/flow.svg)

0. **Branch + draft PR** — cut `feature/<x>` and open a draft PR stating the core objective before any work, so scoping and code review together.
1. **SPEC** *(gated)* — grill business then technical goals as distinct passes; log a thought-trail. When a question is empirical rather than arguable ("how should this *feel*?", "what does this dependency actually do?"), an optional **spike** builds 2–3 throwaway variants in the scratchpad to answer it — the answer sharpens the target program, then the code is deleted.
2. **PLAN** *(gated)* — write the task graph (tasks + deps); `tasks.js schedule` derives the layers; you OK the schedule. When several designs could genuinely work, an optional **simulation** pass runs them in parallel — you pick the slate first, every candidate targets the same finished program, and each simulation comes back summarized and compared, so the path is chosen on evidence instead of a guess.
3. **BUILD** *(hands-off)* — the orchestrator hands each layer to a build agent, **one builder + one QA per layer** (the layer is the unit of work; parallelism comes from the dependency graph). For each layer, one Sonnet builder builds **all** its tasks **test-first** — a failing test per task's contract, then the laziest diff to green — and **spawns its own** Sonnet QA subagent, which reviews the whole layer: are the tests real and matching spec + docs, then code quality and pattern-conformance. The two **loop up to three rounds**; then a mostly-mechanical Haiku commit pushes and posts a terse per-layer comment. The model is **tiered by role** — Sonnet-at-low builds, Sonnet-at-xhigh reviews, Haiku commits, Opus master-QAs — with no Haiku for code or review and no Opus *rebuild*: a layer still failing after three rounds escalates to you (flow graph + a what-was-expected / attempted / still-failing / options summary), because that's a plan problem for a human, not a model step-up. After the graph drains, an Opus master QA runs the target program once and checks the whole diff against `product.md`. A resume-safe preflight runs first: it checks the plan against the branch's drift (escalating before anything is built if the drift invalidates a task's scope), rebuilds a missing draft PR, and reconciles every layer comment to the current template.
4. **Merge** — distill the trail into `product.md`, run a retrospective (durable lessons → Claude Code
   auto-memory; a proven procedure may mint a project skill that rides the PR), green-gate, mark the PR
   ready, merge.

**Don't know what to build?** `/audit` surveys the repo read-only and returns a leverage-ranked
findings table (bugs, security, performance, tech debt, and direction) across nine categories — its picks
feed the flow and product.md's roadmap, no separate backlog. (Adapted from
[shadcn/improve](https://github.com/shadcn/improve).)

**Brownfield repo** with no `.claude/product.md`? Run `/bootstrap` once to reconstruct it from
your existing docs and history. Grill anything ad hoc with `/grill`.

**Turn past sessions into reusable expertise?** `/extract-expertise` mines your Claude Code session
history into **global per-language skills** (`~/.claude/skills/<language>/`) — batched session parsing
across parallel subagents, merged per language, and gated against held-out sessions before anything is staged
for your review. Languages are derived from the corpus, never pre-declared; libraries and dialects nest
inside their language until the evidence says split. (Discipline adapted from
[microsoft/SkillOpt](https://github.com/microsoft/SkillOpt).)

**The rest of the toolkit**, usable on their own or pulled in by the flow: `/qa` self-checks
a finished change against the definition of done and drafts the PR body; `/documentation` owns
README and project-doc rewrites (including de-slopping AI-sounding prose), reaching for
`/diagram` when a picture genuinely earns its place.

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
2. **A panel, fanned out in parallel** — you pick a slate of domain experts, one per **orthogonal
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

The panel runs as **parallel subagents**, so the expert chatter stays in their own context windows and
only the reports return. Two things about it cost real time to work out:

- **The panel agents must be _plugin_ agents.** An agent is selected by its registered type, and
  in this runtime the registry holds **built-in + installed-plugin agents only** — files dropped into a
  project `.claude/agents/` directory are never loaded (the Claude Agent SDK supplies agents
  programmatically; it doesn't scan that folder). So `outputty-expert` and `outputty-adversary` ship in
  the plugin's [`agents/`](agents/) directory and register once the plugin is installed and loaded.
  Editing them during development needs a `/reload-plugins` or a restart before they're visible — a
  freshly-created agent is invisible to the running session.
- **Model and effort are pinned in each charter's frontmatter**, not at the call site — the panel runs
  Opus at `effort: medium` so it never silently inherits a weaker session model. Grilling proposes the
  panel, you pick the slate, and it dispatches — no keyword, no launch card.

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

For a large or uncertain deliverable, PLAN can **stage** it into a `prototype → build → sweep` chain
(one `deps` chain over the same scope, tagged with a `stage`) so the build matures in visible layers —
a thin working slice first, then hardened to the contract, then aligned to existing patterns. The
per-layer PR comment names each stage, so the pull request narrates the work. Small, well-understood
tasks stay a single task; staging is opt-in, never a blanket pipeline.

## Design

outputty owns only the flow and one product doc; everything else is delegated. Architecture, the
memory boundary, and the History chronology live in [`.claude/product.md`](.claude/product.md) — the
single source (it's dogfooded). The one rule to carry: **decisions live only in `product.md`**; OpenWolf's
`.wolf/` holds navigation, gotchas, and bugs, never decisions.

## Safety

BUILD runs shell and git autonomously, so PreToolUse hooks guard it — destructive-command denial,
secret-content and secret-file blocking, and the `require-environment` edit guard. For the guard
details and a copy-paste secret-file deny-list to add to your own `settings.json`, see
[`docs/security.md`](docs/security.md).

## Credits

outputty invents little on purpose — it owns the flow and credits what shaped the rest:

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) — the laziest-working-diff
  discipline (the YAGNI → stdlib → native → one-line ladder) that the build executor and the review
  checks carry. Once a hard dependency; now owned in-plugin, with the approach kept intact.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** — the `agent-watchdog` validation pattern
  (reconstruct the contract, inspect evidence not vibes, classify gaps, self-correct) that became the
  build executor's self-gate before QA.
- **grill-with-docs** (Matt Pocock) — the interview engine the SPEC grill grew from.
- **OpenWolf** — operational memory + token discipline (a required dependency, not just inspiration).
