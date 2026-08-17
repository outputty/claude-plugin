# outputty

outputty is a Claude Code plugin that carries a feature from a request to a merged pull request. It
runs as **two independent stages joined by one task queue**. Planning is synchronous and stops for you.
Building is asynchronous, unattended, and runs on a sweep.

It owns two things and delegates the rest: **the flow** (branch, SPEC, PLAN, BUILD, master QA, merge)
and **product memory** (six YAML record sets you query instead of read). Grilling is the SPEC engine.
It is a rounds-based interview, and it can fan out a panel of domain experts plus a standing adversary.
Every claim is cited or dropped.

## Requirements

| Needs | For |
| --- | --- |
| **git** | one feature branch per item |
| **[bun](https://bun.sh)** | `tasks.js` and `docs.js` run on it, for `Bun.YAML.parse` |
| a **GitHub remote** + authenticated **`gh`** | the draft PR opens at branch cut |
| **`gh stack`** | BUILD publishes one PR per layer, stacked |

```bash
gh extension install github/gh-stack
```

**There is no single-PR fallback.** Stacked pull requests are in
[public preview](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/):
enable the feature on the repository. A build session checks its environment before it starts and names
anything missing; read-only work is never blocked.

**Recommended, not required: a language server.** With one, outputty navigates by symbol and gets type
errors after each edit. Without one it falls back to `Grep` and `Glob`.

```bash
npm install -g typescript-language-server typescript
claude plugin install typescript-lsp@claude-plugins-official
```

Each pair is two commands. The plugin does not ship the binary. Restart Claude Code (or
`/reload-plugins`) afterwards, and register the marketplace once with
`claude plugin marketplace add anthropics/claude-plugins-official` if the install reports it missing.
Ten more languages are covered, Python and Go through Swift - see
[code intelligence](https://code.claude.com/docs/en/discover-plugins#code-intelligence). On a large
repository `pyright` and `rust-analyzer` are memory-hungry; `/plugin disable` if that bites.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin   # public repo, or a local path to a checkout
claude plugin install outputty@outputty                # no other marketplace dependencies
```

From inside Claude Code: `/plugin marketplace add outputty/claude-plugin`, then
`/plugin install outputty@outputty`, then `/reload-plugins`.

Then wire it into the repo, once:

```text
/outputty:init
```

`init` writes a managed **outputty block** into the project `CLAUDE.md` (the orchestration charter, the
tier table, and the always-on conventions every session reads) and the secret-path permissions into
`.claude/settings.json`. Re-run it after a plugin upgrade to refresh the block. On a brownfield repo
with no `.claude/product.yaml`, run `/bootstrap` next.

You know it is live when a change request opens the **SPEC grill** - business questions first - instead
of jumping to code.

## Update

Third-party marketplaces do not auto-update. The `version` in `marketplace.json` is the cache key, and
`plugin update` is a no-op until it changes. Refresh the listing first, then update.

```text
claude plugin marketplace update outputty
claude plugin update outputty@outputty
```

Address the plugin as `outputty@outputty` (`plugin@marketplace`); a bare `outputty` returns "not found".
`claude update outputty` is unrelated, and updates the Claude CLI. Inside Claude Code, run
`/plugin marketplace update outputty`, then `/plugin update outputty@outputty`, then `/reload-plugins`.
For automatic updates, run `/plugin`, open **Marketplaces**, select **outputty**, and choose
**Enable auto-update**.

## The two stages

Neither stage waits on the other. A task's `spec` field says which stage owns it, and the queue is the
only thing between them.

```text
PLANNING  human in the loop, one item          BUILD  no human, runs on a sweep
  research · grill · requirements                 tasks.js ready, every 5 min
  target program · task graph                       settled + deps met ─► dispatch
    └─► spec: settled ──────────────────────────►   nothing ready      ─► sleep
                                                    requirements gap   ─► spec: replan
        ◄──────────────────────────────────────────    + an `attempts` entry
```

### Planning - synchronous, and it stops for you

1. **Branch + draft PR.** Cut `feature/<x>`, write the trail, and open a draft PR stating the objective
   before any work. That PR is the bottom of the stack.
2. **SPEC** _(gated)_ - grill business goals, then technical goals, as two distinct passes. The first
   artifact is the **target program**: the exact code the user will write, with input and output as
   distinct JSON blocks. Every settled question lands in `.claude/trails/<branch>.trail.yaml` before the
   next is asked. An empirical question gets a **spike** instead: one test file named `spike-<slug>`,
   variants as cases, deleted when it dies.
3. **PLAN** _(gated)_ - write the task graph, not a task list. `tasks.js schedule` derives the layers
   and you approve the schedule. A task brief is the PR description written forward: what it builds
   towards, one worked input-to-output example, and one folder.
4. **Settle the task.** Set `spec: settled` and its `tier`. That is the handoff, and planning stops.

**The gates are real, and you answer them in the planning session itself.** Nothing is relayed.

### Building - asynchronous, and it never asks

1. **BUILD** - the build session builds every layer itself. Per layer it re-checks the plan against the
   roadmap, turns each task's `contract` into a failing test, and writes the laziest diff to green. It
   runs the suite for real. Then it cuts `feature/<x>-l<N>` off the layer below and publishes that
   layer as its own draft PR.
2. **Master QA**, once, after the graph drains. The `qa` skill runs on the read-only `outputty-reviewer`.
   It **prelaunches** the target program and each task's proof command in the background, judges the
   whole diff on craft and against the North Star, the roadmap and the architecture while they run, then
   collects the outputs last — so the review never waits on a run. Its verdict is `pass`, `fail`-salvage
   (new tasks, another layer, run it again), or `fail`-rewrite (escalate).
3. **Merge** - distill the trail into the product docs and record the cycle's pivots in `lessons.yaml`.
   Bring the README and `docs/` in line with what shipped, then bump the plugin version. Green-gate,
   and land the whole stack with `gh stack merge --yes`.

**There is no build agent and no per-layer QA.** Nothing merges on an escalation.

### Replan - the iteration between the two

A build that cannot proceed on unclear requirements never guesses and never stalls. It scratches the
work it built on the gap. It appends an `attempts` entry naming what it tried and what killed it, sets
`spec: replan`, and stops. The task goes back to planning carrying that evidence.

An empty queue is not a problem. The sweep does nothing and sleeps.

### How a session knows its stage

A session is **told** its stage, never left to guess it. Each stage is a skill, and the dispatched
session's first prompt invokes it: `/outputty:planning <id>` or `/outputty:build <id>`. The outputty
block in CLAUDE.md carries the standing rule that a session told a stage invokes that skill before
anything else, so dispatch holds whether or not the slash command auto-loads. Working solo, you invoke
the stage skills yourself, in sequence.

## The task queue

PLAN and BUILD share a **dependency graph**, never a hand-numbered list. Each task is one YAML item in
the `tasks:` section of `.claude/trails/<branch>.trail.yaml`, with `id`, `deps` and `scope`.

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule
```

```text
Layer 1: schema
Layer 2: api
Layer 3: ui
Layer 4: docs
```

`schedule` groups the tasks whose deps are all done, and fails loud on a cycle. Layers are derived,
never hand-authored, and a layer is BUILD's unit of work: one PR, one review.

Two disjoint commands read the same graph. `ready` is the build stage's work, `planning` is its mirror,
and a task is never claimed by both.

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" ready       # settled, deps met, still open
```

```text
schema
```

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" planning    # drafting, or sent back by a build
```

```text
ui
```

| `spec` | Owned by | Means |
| --- | --- | --- |
| `drafting` | planning | never specced; requirements are not captured yet |
| `settled` | build | requirements captured, target program agreed, graph written |
| `replan` | planning | a build proved the requirements were not concrete enough; carries `attempts` |

Absent means `settled`. A task also carries an optional `tier`, 1 through 4, which says how much model
it needs. Absent means 3. The tier is task data, surfaced in the index; what a tier *means* (which
model) is the orchestrator's policy, in the CLAUDE.md block's tier table, so it can change with the
model roster without touching a task.

And an optional `qa` — `skip`, `inline`, or `subagent` — says how much review the work earns, set at
PLAN so a build never downgrades its own review. A one-line removal can take `skip` (CHECKS green is the
review) or `inline` (the build reviews its own diff); substantial work stays `subagent`, the independent
`qa`-skill pass on the read-only `outputty-reviewer`. A build's review level is the strongest `qa` among the tasks it drained;
absent means `subagent`.

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" tasks --id api --fields tier --json
```

```json
[{"id":"api","tier":2}]
```

**The trail is hand-authored and the tooling never writes it.** `tasks.js` reads the graph's structure
from the trail and writes each task's mutable state - `status`, `spec`, `attempts` - to its own
`.claude/tasks/<id>.yaml`. One file per task, one writer per file. `tasks.js index` regenerates the
durable `.claude/tasks.yaml` index from both halves.

```text
.claude/
├── tasks.yaml                    # DERIVED index - tasks.js index
├── tasks/api.yaml                # status · spec · attempts
└── trails/feature-x.trail.yaml   # core_objective · decisions · … · tasks:  ◄── hand-authored
```

For a large or uncertain deliverable, PLAN can **stage** the work into a `prototype -> build -> sweep`
chain over one scope. That `stage` is a label that narrates the build; the ordering is still the `deps`.
Full reference: [`skills/outputty/tasks.md`](skills/outputty/tasks.md).

## Product memory

Product memory is six YAML record sets in `.claude/`, each with one job, plus the per-branch trail. You
**query** them.

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" architecture --section features --kind limitation --fields name --json
```

```json
[{"name":"No merge gate"},{"name":"Preload needs no disable flag"}]
```

| Set | Holds |
| --- | --- |
| `product.yaml` | **why**: the North Star and the glossary. Every session reads it. |
| `roadmap.yaml` + `roadmap/*.md` | **what we're building**: one mini-spec row per target |
| `architecture.yaml` + `architecture/*.md` | **what exists**: the coverage index and the seams |
| `tasks.yaml` + `tasks/*.yaml` | **how**: the durable index of bugs, debt and task-shaped work, derived from the trails |
| `lessons.yaml` | the past: discoveries, fixes, user directions, experiments |
| `examples.yaml` | the canonical worked examples, named and reused verbatim |

Only SPEC, PLAN, master QA and `audit` read a set whole. Every other turn queries, and uses `--fields`
to scan. `docs.js` is read-only: to write a record set, edit its file.

**Decisions live only in the product docs.** Claude Code's auto-memory is a separate surface holding
durable lessons - gotchas, preferences, corrections - and outputty adds no mechanism to it.

The canonical shape of every file, with a fill-in skeleton each, is in
[`skills/outputty/references/product-template.md`](skills/outputty/references/product-template.md), which
ships to your repository with the plugin.

## Herdr roles - optional

By default one session runs a stage, and you start it yourself. **Herdr** is a terminal multiplexer for
coding agents, and it sets `HERDR_ENV=1`. Under it the primary checkout holds a thin orchestrator, and
every work item gets its own worktree-backed workspace.

```text
  PRIMARY CHECKOUT                        LINKED WORKTREE, one per item
  ┌────────────────────┐   first prompt: ┌────────────────────────────┐
  │ ORCHESTRATOR       │  /outputty:build │ ITEM                       │
  │                    │ ───────────────► │                            │
  │ roadmap, product   │    <task id>     │ one stage, start to end    │
  │ docs, README       │ ◄─────────────── │ gates are answered HERE    │
  │ no code, no QA     │    the verdict   │                            │
  └────────────────────┘                  └────────────────────────────┘
   ▲                                      ┌────────────────────────────┐
   │ charter rule: edits only .claude/**  │ ITEM ...                   │
   │ (except trails), docs/**, README.md  └────────────────────────────┘
   └ (stated in the CLAUDE.md block)
```

The role is the checkout, stated in the CLAUDE.md block rather than resolved by a hook: the primary
checkout orchestrates, and a session dispatched into a worktree runs the stage its first prompt named.
The orchestrator dispatches each item to its own worktree, pastes the tier row's flags, sends the
stage-skill invocation as the first prompt, and relays the child's verdict. It never runs a stage,
never re-verifies a child's QA, and never answers a gate on your behalf.

## What else is in the box

Each of these works on its own, and the flow reaches for them:

- **`/audit`** surveys a repository read-only and returns a leverage-ranked findings table across nine
  categories. Target-level picks feed `roadmap.yaml`, task-shaped picks feed `tasks.js add`. There is no
  separate backlog: re-auditing is the backlog. (Adapted from
  [shadcn/improve](https://github.com/shadcn/improve).)
- **`/bootstrap`** reconstructs product memory once for a brownfield repository with no
  `.claude/product.yaml`, from its existing docs, docstrings and git history.
- **`/grill`** runs the interview engine on any plan, in or out of the flow.
- **`/documentation`** owns README and project-doc rewrites, including de-slopping prose that reads
  AI-generated. It reaches for **`/diagram`** only when a picture encodes what prose serialises badly.

Two subagents ship with the plugin. Most read-only work is one **generic executor** carrying no logic of
its own — the dispatch names a skill to load and sets the model:

| Agent | Does |
| --- | --- |
| `outputty-reviewer` | generic, read-only, never edits. Loads the skill its dispatch names and sets the model: `qa` (the whole-build review, opus/xhigh), `scout` (a hunt), `adversary` (grill opposition). |
| `outputty-expert` | one per lens in an advanced grill; keeps a knowledgebase in `.claude/experts/` — it writes, so it stays a bespoke agent |

So `qa`, `scout` and `adversary` are **skills** (`skills/*/SKILL.md`), reusable and run on the reviewer;
only expert needs its own agent. **Agents must be plugin agents.** Files dropped into a project's
`.claude/agents/` are never loaded. Editing a charter during development needs `/reload-plugins` or a
restart before the change is visible.

## Safety

The unattended build runs shell and git on its own. As of 0.54.0 the plugin ships **no hooks**: the
guards are declarative **permissions** that `/outputty:init` writes into `.claude/settings.json`, plus
the platform's own permission classifier.

| Concern | Mechanism |
| --- | --- |
| secret files (`.env`, `.env.local`, `secrets/`, `*.pem`, `*.key`, `credentials.json`) | `permissions.deny` on Read/Edit/Write, any depth |
| broadly destructive commands (`rm -rf`, `git clean -f`) | `permissions.ask`, plus the platform classifier |
| master QA reading discipline, orchestrator write boundary | stated in the relevant charter |

Dropped on purpose: content-level credential scanning (use commit-time tooling) and custom denial
messages. For the full list and the reasoning, see [`docs/security.md`](docs/security.md).

## Credits

outputty owns the flow and credits what shaped the rest:

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) - the laziest-working-diff
  discipline and the YAGNI to stdlib to native to one-line ladder. It is owned in-plugin as
  `skills/code-rules/SKILL.md`, applied by the build stage and preloaded into every agent charter.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** - the `agent-watchdog` validation pattern
  (reconstruct the contract, inspect evidence not vibes, classify gaps, self-correct) that became BUILD's
  prove-it-green step before master QA.
- **grill-with-docs** (Matt Pocock) - the interview engine the SPEC grill grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules
  the shared session rules carry.
