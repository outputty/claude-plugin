# outputty

outputty is a Claude Code plugin that carries a feature from a request to a merged pull request. It
runs as **two independent stages joined by one task queue**. Planning is synchronous and stops for you.
Building is asynchronous, unattended, and runs on a sweep.

It owns two things and delegates the rest: **the flow** (branch, SPEC, PLAN, BUILD, master QA, merge)
and **product memory** (five prose Markdown docs read whole, plus the task graph in the `tasks` MCP
server). Grilling is the SPEC engine.
It is a rounds-based interview, and it can fan out a panel of domain experts plus a standing adversary.
Every claim is cited or dropped.

## Requirements

| Needs | For |
| --- | --- |
| **git** | one feature branch per item |
| **Node** (`npx`) or bun (`bunx`) | runs the `tasks` MCP server ([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)) on demand |
| a **GitHub remote** + authenticated **`gh`** | the draft PR opens at branch cut; the task graph syncs to Issues |
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
with no `.claude/product.md`, run `/bootstrap` next.

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
  research · grill · requirements                 list_ready (MCP), every 5 min
  target program · task graph                       settled + deps met ─► dispatch
    └─► spec: settled ──────────────────────────►   nothing ready      ─► sleep
                                                    requirements gap   ─► spec: replan
        ◄──────────────────────────────────────────    + an `attempts` entry
```

### Planning - synchronous, and it stops for you

1. **Branch + draft PR.** Cut `feature/<x>` and open a draft PR stating the objective
   before any work. That PR is the bottom of the stack.
2. **SPEC** _(gated)_ - grill business goals, then technical goals, as two distinct passes. The first
   artifact is the **target program**: the exact code the user will write, with input and output as
   distinct JSON blocks. Every settled question lands on the task's `tasks` MCP trail before the
   next is asked. An empirical question gets a **spike** instead: one test file named `spike-<slug>`,
   variants as cases, deleted when it dies.
3. **PLAN** _(gated)_ - write the task graph, not a task list. The `schedule` MCP tool derives the layers
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
3. **Merge** - distill the trail into the product docs and record the cycle's pivots in `lessons.md`.
   Bring the README and `docs/` in line with what shipped, then bump the plugin version. Green-gate,
   and land the whole stack with `gh stack merge --yes`.

**There is no build agent and no per-layer QA.** Nothing merges on an escalation.

### Replan - the iteration between the two

A build that cannot proceed on unclear requirements never guesses and never stalls. It scratches the
work it built on the gap. It appends an `attempts` entry naming what it tried and what killed it, sets
`spec: replan`, and stops. The task goes back to planning carrying that evidence.

An empty queue is not a problem. The sweep does nothing and sleeps.

### How a session knows its stage

A session is **told** its stage, never left to guess it: the dispatched session's first prompt invokes the
stage skill (`/outputty:planning <id>` or `/outputty:build <id>`), and the CLAUDE.md block makes that
invocation a standing rule so it holds even if the slash command does not auto-load. Working solo, you
invoke the stage skills yourself, in sequence.

## The task queue

PLAN and BUILD share a **dependency graph**, never a hand-numbered list. Tasks live in the **`tasks` MCP
server** ([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)), which keeps the graph and
syncs it two-way to **GitHub Issues** (and a Projects board). `/outputty:init` registers it in
`.mcp.json`; every session calls its tools with a `project` — the repo root.

`schedule` groups the tasks whose deps are all done and fails loud on a cycle. A layer is BUILD's unit of
work: one PR, one review.

```text
schedule { project }  ->  Layer 1: schema · Layer 2: api · Layer 3: ui · Layer 4: docs
```

A task carries a `spec` — `drafting` while planning owns it, `settled` once it can build, `replan` when a
build sent it back with an `attempts` entry; absent means `settled`. It also carries an optional `tier`
(1–4, how much model it needs; absent means 3) and an optional `qa` (`skip` / `inline` / `subagent`, how
much review it earns, set at PLAN so a build never downgrades its own review). What a tier *means* — which
model — is the orchestrator's policy in the CLAUDE.md block, so the model roster can change without touching
a task. The block also lists the server's tools; a session gets them from there.

**Deps can't live in a GitHub Issue**, so the server keeps the graph in a local cache (under the OS cache
dir, not the repo) and mirrors each task's full record — deps included — into its issue body. That makes
the cache disposable: `sync` rebuilds it from the issues, and a card dragged to Done on the board flows
back to close the task. Each task's **trail** — its spec decisions — is the issue's comment thread,
appended with `append_trail` and read with `get_trail`.

For a large or uncertain deliverable, PLAN can **stage** the work into a `prototype -> build -> sweep`
chain over one scope. That `stage` is a label that narrates the build; the ordering is still the `deps`.

## Product memory

Product memory is five prose Markdown docs in `.claude/`, each with one job; the task graph and each
task's trail live in the `tasks` MCP server. You **read** them whole.

```bash
grep -c 'hooks/protocol.md' .claude/lessons.md   # has this file burned us before?
```

```text
42
```

| Doc | Holds |
| --- | --- |
| `product.md` | **why**: the North Star and the glossary. Every session reads it. |
| `roadmap.md` | **what we're building**: one entry per target, each with a mini-spec |
| `architecture.md` | **what exists**: the target surface, the machinery, the seams, the feature index |
| the `tasks` MCP server | **how**: the task graph of bugs, debt and task-shaped work, synced to GitHub Issues |
| `lessons.md` | the past: discoveries, fixes, user directions, experiments |
| `examples.md` | the canonical worked examples, named and reused verbatim |

The docs are small enough to read whole; only `lessons.md` is large, so `grep` it by path or title. To
write a doc, edit it directly.

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

The role follows from the checkout, not a hook (stated in the CLAUDE.md block): the primary checkout
orchestrates — it dispatches each item to its own worktree, pastes the tier row's flags, and relays the
child's verdict — and never runs a stage, re-verifies a child's QA, or answers a gate on your behalf.

## What else is in the box

Each of these works on its own, and the flow reaches for them:

- **`/audit`** surveys a repository read-only and returns a leverage-ranked findings table across nine
  categories. Target-level picks feed `roadmap.md`, task-shaped picks feed the `tasks` MCP tool `add_task`. There is no
  separate backlog: re-auditing is the backlog. (Adapted from
  [shadcn/improve](https://github.com/shadcn/improve).)
- **`/bootstrap`** reconstructs product memory once for a brownfield repository with no
  `.claude/product.md`, from its existing docs, docstrings and git history.
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
only expert needs its own agent. **The agents ship as plugin agents** so they travel with the plugin into
any repo. Project `.claude/agents/*.md` **do** load, at session start; a plugin agent is pinned at
plugin-load time, so editing a charter needs `/reload-plugins` or a restart before the change is visible.
Both a plugin agent and a project agent inherit the repo's `CLAUDE.md`; neither inherits the output style,
so each charter reads it explicitly.

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
  `skills/code-rules/SKILL.md`, applied by the build stage.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** - the `agent-watchdog` validation pattern
  (reconstruct the contract, inspect evidence not vibes, classify gaps, self-correct) that became BUILD's
  prove-it-green step before master QA.
- **grill-with-docs** (Matt Pocock) - the interview engine the SPEC grill grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules
  the output style carries.
