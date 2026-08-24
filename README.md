# outputty

A Claude Code plugin, outputty carries a feature from a request to a merged pull request. It runs
as two independent stages joined by one task queue. Planning is synchronous and stops for you. Building is
asynchronous and unattended. The queue between them is the only handoff.

It owns the flow: branch, SPEC, PLAN, BUILD, master QA, merge. It owns product memory too: five prose
Markdown docs read whole, plus the task graph in the `tasks` MCP server. It delegates the rest. Grilling is the SPEC
engine: a rounds-based interview that can fan out a panel of domain experts plus a standing adversary.
Every claim is cited or dropped.

## Requirements

1. **git** - cuts one feature branch per item.
2. **Node** (`npx`) or **bun** (`bunx`) - runs the `tasks` MCP server
   ([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)) on demand.
3. **A GitHub remote plus authenticated `gh`** - opens the draft PR at branch cut, and syncs the task graph
   to Issues.
4. **`gh stack`** - publishes one PR per layer, stacked.

```bash
gh extension install github/gh-stack
```

There is no single-PR fallback. Stacked pull requests are in
[public preview](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/):
enable the feature on the repository. A build session checks its environment before it starts and names
anything missing. Read-only work runs regardless.

A language server is recommended, not required. With one, outputty navigates by symbol and gets type
errors after each edit. Without one it falls back to `Grep` and `Glob`.

```bash
npm install -g typescript-language-server typescript
claude plugin install typescript-lsp@claude-plugins-official
```

Each pair is two commands, and the plugin does not ship the binary. Restart Claude Code (or
`/reload-plugins`) afterwards. Register the marketplace once with
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

The `init` skill cuts a branch and writes four files:

1. **`CLAUDE.md`** - the managed outputty block, which indexes what every session reads.
2. **`.claude/output-styles/outputty.md`** - the output style.
3. **`.claude/settings.json`** - the permission mode and the secret-path entries.
4. **`.mcp.json`** - the `tasks` server.

It commits all four and opens a PR.

⚠ **Repo-wide permission mode** - every session in this repo runs unattended-capable, including a session
that you started outside outputty. The secret-path denials still apply.

⚠ **Merge that PR before you dispatch anything** - every child session runs in a worktree. A worktree
only contains what its base commit contains, so a child sees init's four files once that PR is on the
default branch.

Re-run `init` after a plugin upgrade to refresh the block. On a brownfield repo with no
`.claude/product.md`, run `/bootstrap` next.

You know it is live when a change request opens the SPEC grill, business questions first, instead of
jumping to code.

## Update

Third-party marketplaces do not auto-update. The `version` in `marketplace.json` is the cache key, and
`plugin update` is a no-op until it changes. Refresh the listing first, then update.

```text
claude plugin marketplace update outputty
claude plugin update outputty@outputty
```

Address the plugin as `outputty@outputty` (`plugin@marketplace`); a bare `outputty` returns "not found".
The command `claude update outputty` is unrelated, and updates the Claude CLI. Inside Claude Code, run
`/plugin marketplace update outputty`, then `/plugin update outputty@outputty`, then `/reload-plugins`.
For automatic updates, run `/plugin`, open **Marketplaces**, select **outputty**, and choose
**Enable auto-update**.

## The two stages

Neither stage waits on the other. A task's `spec` field says which stage owns it, and the queue is the
only thing between them.

```text
PLANNING  human in the loop, one item          BUILD  unattended, one ticket, its own worktree
  research · grill · requirements                 claim ─► orientation ─► layers ─► master QA
  target program · task graph                       a pass          ─► merge, then report
    └─► spec: settled ──────────────────────────►   requirements gap ─► spec: replan
                                                    a blocker planning cannot answer ─► escalate
        ◄──────────────────────────────────────────    + an Attempt note
```

### Planning - synchronous, and it stops for you

Planning runs in its own session, one item at a time. `/outputty:planning` with no id offers what the
planning queue holds and takes one pick. It then claims that item, so a second planning session offers
a different one. A dispatcher never starts planning.

1. **Branch plus draft PR** - cut `feature/<x>` and open a draft PR stating the objective before any work.
   That PR is the bottom of the stack.
2. **SPEC** _(gated)_ - grill business goals, then technical goals, as two distinct passes. The first
   artifact is the target program: the exact code the user will write, with input and output as distinct
   JSON blocks. Every settled question lands on the task's `tasks` MCP trail before the next is asked. An
   empirical question gets a spike instead: one test file named `spike-<slug>`, variants as cases, deleted
   when it dies.
3. **PLAN** _(gated)_ - write the task graph, not a task list. The `schedule` tool derives the layers from
   that graph, and you approve the schedule. Each task carries a `brief` and a `contract`, which render as
   its GitHub issue body.
4. **Settle the task** - set `spec: settled`. That is the handoff, and planning stops.

The gates are real, and you answer them in the planning session itself. Nothing is relayed.

### Building - asynchronous, and it runs to a verdict

1. **BUILD** - the build session builds every layer itself. Per layer it re-checks the plan against the
   roadmap, turns each task's `contract` into a failing test, and writes the laziest diff to green. It runs
   the suite for real. Then it cuts `feature/<x>-l<N>` off the layer below and publishes that layer as its
   own draft PR.
2. **Master QA** - once, after the graph drains. The `qa` skill runs on the read-only `outputty-reviewer`.
   It prelaunches the target program and each task's proof command in the background. While they run it
   judges the whole diff, on craft and against the North Star, the roadmap and the architecture. It
   collects the outputs last, so the review reads while the runs finish. Its verdict is `pass`, `fail`-salvage
   (new tasks,
   another layer, run it again), or `fail`-rewrite (escalate).
3. **The documentation layer** - on a stack of more than one layer, the README, `docs/` and docstrings
   are written *after* master QA passes. They ship as the stack's top PR, and a single-layer stack
   documents inline instead.
4. **Merge** - the merge step distills the trail into product memory, and records the cycle's pivots in
   `lessons.md`. It green-gates, then lands the whole stack with `gh stack merge --yes`. The CLAUDE.md
   block's merge duties run in that same sitting.

There is no build agent and no per-layer QA. Nothing merges on an escalation.

### Replan - the iteration between the two

A build that cannot proceed on unclear requirements takes the replan exit. It scratches the work it built
on the gap. It appends an `Attempt -` note to the trail, sets `spec: replan`, and stops. That
note carries what was tried and what killed it. The task goes back to planning with that evidence.

An empty queue is not a problem. With tasks still in planning, the dispatcher offers the top of that
queue and opens a planning chat per pick. With none, the lane is done and it says so.

### How a session knows its stage

A session is told its stage. A dispatched child's first prompt invokes the
stage skill: `/outputty:build <id>`. The CLAUDE.md block makes that invocation a standing rule, so it
holds even without an auto-loaded slash command. Working solo, you invoke the stage skills yourself.

## The task queue

PLAN and BUILD share a dependency graph. Tasks live in the `tasks` MCP server
([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp)), which keeps the graph and syncs it
two-way to GitHub Issues (and a Projects board). The `init` skill registers the server in `.mcp.json`.
Every session calls its tools with a `project`, which is the repo root.

The `schedule` tool derives dependency-ordered layers, all of the open plan or one `target`, and fails loud on a cycle.
The `list_ready` tool returns what can be built right now, ranked. A layer is BUILD's unit of work: one PR,
one review.

```text
schedule { project }  ->  Layer 1: schema · Layer 2: api · Layer 3: ui · Layer 4: docs
```

A task carries a `spec`. It reads `drafting` while planning owns it, and `settled` once it can build. It
reads `replan` when a build sent it back with an `Attempt -` trail note. Absent means `settled`. It also
carries an optional `qa`, meaning how much review it earns: `skip`, `inline` or `subagent`. PLAN sets
`qa`, and the build runs the review at the level it set. The CLAUDE.md block lists the server's tools, and a
session gets them from there.

A claim carries a heartbeat, so a child that dies does not hide its ticket forever. `start_task` stamps
it, every later write by the holder moves it, and `list_ready` reports a claim gone quiet as a
`stale_claims` row. Releasing it is a human call: freeing a claim under a merely slow worker would let a
second worker take the same task.

Deps cannot live in a GitHub Issue. The server keeps the graph in a local cache, under the OS cache dir
rather than the repo. It mirrors each task's full record, deps included, into the issue body. That makes the cache
disposable: `sync` rebuilds it from the issues, and a card dragged to Done on the board flows back to close
the task. Each task's trail, which holds its spec decisions, is the issue's comment thread, appended with
`append_trail` and read with `get_trail`.

For a large or uncertain deliverable, PLAN can stage the work into a `prototype -> build -> sweep` chain
over one scope. That `stage` is a label that narrates the build, and the ordering is still the `deps`.

## Product memory

Product memory is five prose Markdown docs in `.claude/`, each with one job. You read them whole. To write
one, edit it directly.

1. **`product.md`** - the North Star and the Language. Every session reads it.
2. **`roadmap.md`** - why each target is worth building. The graph derives status.
3. **`architecture.md`** - the target program and the machinery.
4. **`examples.md`** - the canonical worked examples, named and reused verbatim.
5. **`lessons.md`** - discoveries, bug fixes, user directions, experiments; features go to
   `architecture.md`. It is the one large doc, so `grep` it by path or title.

```bash
grep -n 'gh stack' .claude/lessons.md   # has this path burned us before?
```

The task graph is not a file. It lives in the `tasks` MCP server: the targets and the tasks serving them,
synced to GitHub Issues. The `roadmap` tool derives each target's progress, and `list_ready` ranks work by
the task and by the target it serves. Each task's trail lives there too.

Decisions live only in the product docs. Claude Code's auto-memory is a separate surface holding durable
lessons - gotchas, preferences, corrections - and outputty adds no mechanism to it.

The canonical shape of every file, with a fill-in skeleton each, is
[`skills/outputty/references/product-template.md`](skills/outputty/references/product-template.md). It is
read straight from the installed plugin under `~/.claude/plugins/cache`, rather than copied into your
repository.

## Dispatching a lane

By default one session runs one stage, and you start it yourself. To drive a queue instead, start one
attended session:

```text
/outputty:start          # or /outputty:start skills, to narrow it to one folder subtree
```

It dispatches **roadmap targets**, one per unattended background agent, each in a worktree of its own.
A target is self-contained, so its whole task set ships as one stack and lands as one finished work
item. Then it holds on a one-minute tick until the wave drains:

```text
  ATTENDED SESSION                        BACKGROUND CHILD, one per ticket
  ┌────────────────────┐  /outputty:build ┌────────────────────────────┐
  │ DISPATCHER         │ ───────────────► │ its own worktree           │
  │                    │    <task id>     │ cuts its own branch        │
  │ roadmap, product   │                  │ build · master QA · merge  │
  │ docs, README       │ ◄─────────────── │ two exits, no questions    │
  │ no code, no QA     │    the report    │                            │
  └────────────────────┘                  └────────────────────────────┘
   ▲                                      ┌────────────────────────────┐
   │ write boundary stated in the         │ ... up to three at once    │
   └ CLAUDE.md block                      └────────────────────────────┘
```

**Dispatch belongs to a tick that found zero workers, and to nothing else.** A child finishing wakes
the dispatcher to relay its verdict and fast-forward the checkout. So every dispatch runs against an empty
in-flight set. The cost is a wave that moves at the speed of its
slowest child. The gain is that collisions are only ever checked against other lanes.

A lane is optional, and it narrows the offer to one folder subtree. Collisions are caught per row
instead: `list_ready { scope }` carries an `overlap` on every row, the live claims whose folders touch
it, computed across all lanes. A claim outside your lane is exactly what a filter would otherwise hide.

Herdr, or any multiplexer, still works for running several attended sessions side by side. The plugin
does not know or care.

## What else is in the box

Each of these works on its own, and the flow reaches for them:

- **`/audit`** - surveys a repository read-only and returns a leverage-ranked findings list across nine
  categories. Target-level picks become a target (`add_target`, plus its paragraph in `roadmap.md`), and
  task-shaped picks feed `add_task`. There is no separate backlog: re-auditing is the backlog. (Adapted
  from [shadcn/improve](https://github.com/shadcn/improve).)
- **`/bootstrap`** - reconstructs product memory once for a brownfield repository with no
  `.claude/product.md`, from its existing docs, docstrings and git history.
- **`/grill`** - runs the interview engine on any plan, in or out of the flow.
- **`/reprioritise`** - reorders the queue with `priority` and `deps`, so the next dispatch takes the
  work that matters now. It runs on its own, or inside a planning session that meets work which should
  come first.
- **`/documentation`** - owns README and project-doc rewrites, including de-slopping prose that reads
  AI-generated. It reaches for `/diagram` only when a picture encodes what prose serialises badly.

Two subagents ship with the plugin:

1. **`outputty-reviewer`** - generic, and read-only. The dispatch names the skill it loads
   and sets the model: `qa` (the whole-build review), `scout` (a hunt), `adversary` (grill opposition), or
   `audit` (one category pass). Its charter pins `effort: xhigh` for every run.
2. **`outputty-expert`** - one per lens in an advanced grill. It keeps a domain-generic knowledgebase in
   `.claude/experts/` (an index, topic shards, and a source cache) that names no repo, code or problem. It
   writes, so it stays a bespoke agent.

Most read-only work is that generic executor, which carries no logic of its own. So `qa`, `scout`,
`adversary` and `audit` are skills (`skills/*/SKILL.md`), reusable and run on the reviewer; only the expert
needs its own agent. The agents ship as plugin agents, so they travel with the plugin into any repo. A
project `.claude/agents/*.md` loads too, at session start. A plugin agent is pinned at plugin-load time, so
editing a charter needs `/reload-plugins` or a restart before the change is visible. Both kinds inherit the
repo's `CLAUDE.md`. Neither inherits the output style, so each charter reads it explicitly.

## Evaluation

`node .claude/skills/run-outputty/driver.mjs` is the corpus check. It resolves every plugin pointer, holds
the prose budgets and the sentence cap, and asserts each rule the flow cannot afford to lose. Which harness
and Claude Code version exercised the corpus is recorded in
[`docs/exercised-on.md`](docs/exercised-on.md). A surface with no entry there is untested, and routing has
no harness.

## Safety

The unattended build runs shell and git on its own. The plugin ships no hooks. The guards are declarative
permissions that `/outputty:init` writes into `.claude/settings.json`, plus the platform's own permission
classifier.

1. **Secret files** (`.env`, `.env.local`, `secrets/`, `*.pem`, `*.key`, `credentials.json`) -
   `permissions.deny` on Read, Edit and Write, at any depth.
2. **Broadly destructive commands** (`rm -rf`, `git clean -f`) - `permissions.ask`, plus the platform
   classifier.
3. **Master QA reading discipline** - stated in the `qa` skill.
4. **The dispatcher write boundary** - stated in the managed CLAUDE.md block.

The full list, with the reasoning, is in [`docs/security.md`](docs/security.md).

## Credits

The plugin owns the flow, and credits what shaped the rest:

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) - the laziest-working-diff
  discipline and the YAGNI to stdlib to native to one-line ladder. It is owned in-plugin as
  `skills/code-rules/SKILL.md`, applied by the build stage.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** - the `agent-watchdog` validation pattern
  (reconstruct the contract, inspect evidence not vibes, classify gaps, self-correct) that became BUILD's
  prove-it-green step before master QA.
- **grill-with-docs** (Matt Pocock) - the interview engine the SPEC grill grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules
  the output style carries.
