# outputty

outputty is a spec-driven Claude Code plugin that carries one feature from intent to shipped code: you
gate the **spec** and the **plan**, then a hands-off **build** turns the plan into commits behind a
single escalation.

Two engines do the work, and they're outputty's own:

- **A panel-of-experts grill** stress-tests the spec — domain experts picked by lens plus a standing
  adversary, every claim cited or dropped, each expert keeping a knowledgebase across sessions.
- **A hands-off build loop** drains a dependency-ordered task graph (see [Task tracking](#task-tracking)),
  **one builder then one QA per layer**: a Sonnet builder builds all of a layer's tasks **test-first** (a
  failing test per task's contract, then the laziest diff to green — the test is the definition of done)
  in **one pass**, then a Sonnet QA at **xhigh** effort reviews the technical side (was it implemented as
  briefed, does it meet the documented standards) **and fixes what it finds**, looping
  review→fix→re-review in its own context until clean. **The builder never comes back** — QA already holds
  the file, the line and the repro, so handing them back as prose only makes a cold agent re-derive them.
  Then the layer commits, pushes, and opens **its own pull request** on top of the one below it. The model
  is **tiered by role** — Sonnet-at-low builds (the failing test it wrote first is what constrains it),
  Sonnet-at-xhigh reviews and repairs, Haiku does the mechanical commit, and Opus runs the final
  whole-build master QA. QA repairs **defects in the diff** only: it may never weaken an assertion, edit a
  contract, widen scope, or delete a test to reach green — that makes the finding a verdict, and the layer
  escalates to you (a plan problem for a human, not a model step-up). A builder that hits a scope wall
  reports blocked instead of improvising.

It stands on **Claude Code's own two layers**, plus **bun** for its task graph and product-memory
queries — nothing else third-party. **Code intelligence** —
[LSP plugins](https://code.claude.com/docs/en/discover-plugins#code-intelligence) such as
`typescript-lsp` and `pyright-lsp` — gives it go-to-definition, find-references, and type errors after
every edit; where a language has no server, it falls back to search. **Auto memory** carries durable
lessons between sessions. The build discipline is outputty's own — the laziest-working-diff reflex and
the self-gate the executor runs before QA — with credit to the projects that shaped them (see
[Credits](#credits)).

## Requirements

Needs **git** and **[bun](https://bun.sh)** — `tasks.js` (the task graph) and `docs.js` (product-memory
queries) run on it, since node has no builtin YAML support. The full flow also needs a **GitHub
remote**, authenticated **`gh`**, and the **`gh stack` extension** — BUILD publishes each layer as its
own pull request, stacked in dependency order, so a reviewer opens layer 3 and sees layer 3's diff
rather than forty files:

```bash
gh extension install github/gh-stack
```

**There is no single-PR fallback.** Stacking is how outputty publishes, so a missing extension is a hard
stop at preflight — before the first layer runs, not after three of them are committed to a branch shape
that was never going to publish. Anything missing is surfaced at session start.

Stacked pull requests are in [public preview](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/),
so the repo needs it enabled.

**Recommended, not required — a language server.** With one, outputty navigates by symbol
(go-to-definition, find-references) instead of grep-then-read-three-candidates, and gets type errors
reported automatically after each edit without running a compiler. Without one it uses search, so
nothing breaks — you just pay more tokens to find the same code.

**TypeScript:**

```bash
npm install -g typescript-language-server typescript
claude plugin install typescript-lsp@claude-plugins-official
```

**Python:**

```bash
npm install -g pyright
claude plugin install pyright-lsp@claude-plugins-official
```

Then restart Claude Code (or `/reload-plugins`). The plugin doesn't install the language-server binary
for you, which is why each pair is two commands. If `claude plugin install` reports the marketplace is
missing, register it once with `claude plugin marketplace add anthropics/claude-plugins-official`.
Nine other languages are covered — Go, Rust, C/C++, C#, Java, Kotlin, Lua, PHP, Swift — see
[code intelligence](https://code.claude.com/docs/en/discover-plugins#code-intelligence). On a large
repo `pyright` and `rust-analyzer` are memory-hungry; `/plugin disable` if that bites.

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

Describe the work — the flow in `protocol.md` covers any feature or change request (or run
`/outputty <what you want>`). One feature branch carries the whole cycle: **two human-gated phases up
front, a hands-off build behind them, and escalation as the only interruption.**

![outputty flow (top-down): a feature request cuts a branch and draft PR stating the core objective before any work; a human-gated SPEC phase grounds first, then grills business-then-technical goals, with an optional advanced pass that fans out expert + adversary agents in parallel; a human-gated PLAN derives layers from a task graph; a hands-off BUILD loops per layer — one builder builds the layer test-first in a single pass, then one QA reviews the whole layer diff and repairs every finding itself, looping in its own context until clean, then a mechanical commit pushes and posts a per-layer PR comment, and a layer QA cannot drive green escalates to you; after the graph drains a master-QA stage runs the target program and checks the whole diff against product.yaml; then the orchestrator distills product.yaml, runs a lessons retrospective into memory, green-gates, and merges to shipped](docs/flow.svg)

0. **Branch + draft PR** — cut `feature/<x>` and open a draft PR stating the core objective before any work, so scoping and code review together.
1. **SPEC** *(gated)* — grill business then technical goals as distinct passes; log a thought-trail. When a question is empirical rather than arguable ("how should this *feel*?", "what does this dependency actually do?"), an optional **spike** builds 2–3 throwaway variants in the scratchpad to answer it — the answer sharpens the target program, then the code is deleted.
2. **PLAN** *(gated)* — write the task graph (tasks + deps); `tasks.js schedule` derives the layers; you OK the schedule. **A task brief is the PR description written forward** — what we're building towards, a Mermaid diagram of the shape, one worked input→output example, and **one folder**. No file list, no implementation steps: those would be written by the one agent that hasn't read the code, and the builder designing the route *is* the work being handed over. A task that revisits earlier work points the builder at `.claude/lessons.yaml` first. When several designs could genuinely work, an optional **simulation** pass runs them in parallel — you pick the slate first, every candidate targets the same finished program, and each simulation comes back summarized and compared, so the path is chosen on evidence instead of a guess.
3. **BUILD** *(hands-off)* — each layer ships as **its own pull request, stacked** on the one below (the branch-cut PR is the stack's bottom), and the whole stack merges atomically at the end — one unmergeable layer merges none, so a half-built feature never reaches your default branch. The layer is the unit of work — parallelism comes from the dependency graph, not a per-task fan-out — and for each one the orchestrator dispatches **two sibling agents in sequence**. First a Sonnet builder builds **all** its tasks **test-first** — a failing test per task's contract, then the laziest diff to green — in one pass, and returns `built` (never a verdict on its own work). The builder **proves the layer green before it hands off** — the watcher makes that cheap — so green is a precondition, not something QA discovers. Then a Sonnet QA asks the two technical questions: was the task implemented as briefed, and does the code meet the project's **documented** standards (architecture patterns, docstrings, no over-engineering, dependency direction — read, not recalled). It **repairs what it finds**, looping review→fix→re-review inside its own context until clean. **The builder is never re-dispatched**: QA finishes a review holding the file, the line and the repro, and handing that back as prose just makes a cold agent rebuild it (measured across 19 days of real builds, the builder/QA pair burned 21,104 API calls and 1,761M tokens of context, much of it re-deriving diagnoses that already existed). What holds the trade honest is a hard fix boundary — QA repairs **craft, not intent** — code that doesn't do what the contract says is its to fix; a contract that is itself wrong, a weakened assertion, a widened scope or a deleted test is a verdict it escalates. Independence survives where it pays: QA's **first** pass is still a cold read of code it didn't write, and master QA is fully independent at the end. Nothing nests, so spawn depth and the silent `Agent`-tool-withheld failure mode stop applying. Then a mostly-mechanical Haiku commit pushes and posts a terse per-layer comment. The model is **tiered by role** — Sonnet-at-low builds, Sonnet-at-xhigh reviews and repairs, Haiku commits, Opus master-QAs — with no Haiku for code or review and no Opus *rebuild*: a layer QA can't drive green escalates to you (flow graph + a what-was-expected / attempted / still-failing / options summary), because that's a plan problem for a human, not a model step-up. QA stops on **no progress** — a finding surviving two fix attempts — with a hard cap of 5 rounds as a runaway guard. After the graph drains, a **read-only Opus master QA** works at a different altitude: it runs the target program once — the build's only real execution — judges the whole diff against `product.yaml`'s **North Star, roadmap and Architecture** rather than code craft, and writes **the handover** (what happened, which roadmap item moved, whether this work still belongs in the project). Read-only is deliberate: per-layer QA writes code now, so master QA is the last reviewer who touched nothing. **The orchestrator is its consumer** — a `fail` with specific gaps means new tasks go into the graph and build→QA re-runs for those only; a `fail` where the foundation is wrong escalates to you, because a rewrite needs new requirements and requirements are gated. That is the moment the flow asks **rewrite or salvage**, on evidence rather than instinct: a fix that contradicted an earlier fix, a special case per call site, an inability to say in one sentence what the code is *for*. When the answer is rewrite, it is **not a reset** — the task list is extended with everything the build learned, pruned, and the code that earned its place is carried into the new briefs as snippets. Finally an `outputty-docs` agent brings the README and `docs/` in line with what shipped, writes the PR description, and **deletes documentation that has no reader** — its primary output is what it removed — recording abandoned approaches in `.claude/lessons.yaml`, a cold path read only by master QA when it is stuck. A resume-safe preflight runs first: it checks the plan against the branch's drift (escalating before anything is built if the drift invalidates a task's scope), rebuilds a missing draft PR, and reconciles every layer comment to the current template.
4. **Merge** — distill the trail into `product.yaml`, run a retrospective (durable lessons → Claude Code
   auto-memory; a proven procedure may mint a project skill that rides the PR), green-gate, mark the PR
   ready, merge.

**Don't know what to build?** `/audit` surveys the repo read-only and returns a leverage-ranked
findings table (bugs, security, performance, tech debt, and direction) across nine categories — its picks
feed the flow and product.yaml's roadmap, no separate backlog. (Adapted from
[shadcn/improve](https://github.com/shadcn/improve).)

**Brownfield repo** with no `.claude/product.yaml`? Run `/bootstrap` once to reconstruct it from
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
`/diagram` when a picture genuinely earns its place; `/report` renders a finished unit of work as a
styled HTML page — summary tables, the target program with real input/output, swimlanes, and a
**what was tried before and why it didn't work** section so a dead end costs someone a day only once.

## How grilling works

Grilling is the SPEC phase — the interview that turns a request into a precise, agreed spec before any
code — and it has two modes. **Simple is the default.**

**Simple** is the one-question-at-a-time interview: business goals first, then technical, each with a
recommended answer, backtracking on conflicts and reading the codebase (LSP symbol lookup, or search)
instead of asking what's discoverable. Decisions land in `.claude/product.yaml`, the thought-trail in
`.claude/trails/<branch>.trail.yaml`. No agents, no workflow.

**Advanced** *(opt-in, for a non-trivial plan)* is offered **after grounding**, so you can weigh its
extra turns and one parallel fan-out first. It adds three stages:

1. **Ground, then Why → What → How** — establish where you stand (`product.yaml`, the code + external
   references), then interview along a Why → What → How agenda, still one question at a time.
2. **A panel, fanned out in parallel** — you pick a slate of domain experts, one per **orthogonal
   lens** with real surface area (add your own via *Other*, attach references per expert). Experts are
   named by canonical discipline slug and reused across sessions from `.claude/experts/` — the panel
   proposes existing ones before minting new. **More than 4 lenses stops the panel:** rather than grow
   it, the flow asks you (`AskUserQuestion`, with a free-form option) for a narrower scope, because that
   many lenses means the scope is too big to grill in one pass. The session dispatches `outputty-expert`
   (one per lens) plus `outputty-adversary` (a grounded skeptic + contrarian that always runs) as
   parallel subagents in a single message. Every agent is
   **cite-or-drop**: a claim without a quoted, actually-ingested source is dropped, not softened.
3. **Synthesize** — the reports come back to the session, which weighs them against `product.yaml`, shows a
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
YAML list item in `.claude/trails/<branch>.tasks.yaml` (`id`, `deps`, `scope`), and a dependency-free
engine derives the run order instead of you numbering layers:

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule
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

outputty owns only the flow and product memory; everything else is delegated. Product memory is queried
record sets — North Star + Language in [`.claude/product.yaml`](.claude/product.yaml), objectives in
`roadmap.yaml`, the coverage index + seams in `architecture.yaml` (depth in self-contained
`architecture/*.md` topic files), the durable task index in `tasks.yaml`, the chronology in
`lessons.yaml` — answered
through `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" <set> [--<field> <value>] [--json]` (it's dogfooded). The one rule
to carry: **decisions live only in the product docs**; Claude Code's auto-memory holds durable lessons —
gotchas, preferences, corrections — never decisions.

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
