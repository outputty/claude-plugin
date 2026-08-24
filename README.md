# outputty

outputty is a Claude Code plugin that carries a feature from a request to a merged pull request.

## Why it exists

A coding agent will happily build the wrong thing, quickly. More prompting does not fix that. Stopping
twice does: once on **what** you are building, once on **how** it decomposes. After those two answers,
an agent has enough to run on its own.

outputty is that discipline as an installed, versioned plugin instead of rules copy-pasted into every
repo's `CLAUDE.md`. One spine sequences the work, so overlapping tools stop competing for the same space.

- **You are in the loop for intent and shape.** SPEC grills business goals, then technical goals, as two
  distinct passes. PLAN turns the answers into a dependency graph. Both are gates you answer yourself.
- **Then it builds unattended.** A build session claims one ticket, works in its own worktree, ships one
  stacked PR per layer, reviews the whole diff against what it promised, and merges.
- **Nothing is remembered by accident.** Decisions land in five prose docs in `.claude/`; the work itself
  lives in GitHub Issues.

## How it works

```text
  you ──► SPEC ──► PLAN ──► ▣ queue ──► BUILD ──► master QA ──► merged stack
         (gated)  (gated)               unattended, one worktree per ticket
```

1. **Plan one item with you.** `/outputty:planning` grills the goals, writes the task graph, and settles
   the item. That is the handoff, and planning stops there.
2. **The queue holds it.** Tasks are GitHub Issues carrying dependencies. `schedule` derives the layers
   from the graph; nobody hand-authors them.
3. **A build session takes it.** `/outputty:build <id>` for one, `/outputty:start` to drive the whole
   queue. Per layer: turn the task's contract into a failing test, write the laziest diff to green, run
   the suite for real, publish that layer as its own draft PR.
4. **Master QA judges the drained stack once**, read-only, against the North Star and the plan. It
   returns pass, salvage (new tasks, another layer, run it again), or escalate.
5. **Merge distills the trail** into the product docs and lands the whole stack.

The two stages never wait on each other. A task's `spec` field says which one owns it, and the queue is
the only handoff between them.

## Install

Requirements: **git**, **Node** (`npx`) or **bun**, a **GitHub remote with authenticated `gh`**, and the
**`gh stack`** extension. The `tasks` MCP server ([`@outputty/tasks-mcp`](https://github.com/outputty/tasks-mcp),
0.20.0 or later) is fetched on demand — `init` registers it unpinned.

```bash
gh extension install github/gh-stack
claude plugin marketplace add outputty/claude-plugin
claude plugin install outputty@outputty
```

Then wire up the repo, once:

```text
/outputty:init
```

`init` cuts a branch and commits four files — the managed `CLAUDE.md` block, the output style,
`.claude/settings.json` for permissions, and `.mcp.json` for the `tasks` server — then opens a PR.

⚠ **Merge that PR before you dispatch anything.** Every child session runs in a worktree, and a worktree
only contains what its base commit contains.

⚠ **`init` sets a repo-wide permission mode.** Every session in this repo runs unattended-capable,
including one you started outside outputty. The secret-path denials still apply.

On a brownfield repo with no `.claude/product.md`, run `/outputty:bootstrap` next. Re-run `init` after a
plugin upgrade to refresh the block.

Stacked pull requests are in
[public preview](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/) —
enable them on the repository. There is no single-PR fallback. A build checks its environment first and
names anything missing; read-only work runs regardless.

A language server is recommended, not required: with one, outputty navigates by symbol and gets type
errors after each edit. See
[code intelligence](https://code.claude.com/docs/en/discover-plugins#code-intelligence) for the eleven
languages covered.

You know it is live when a change request opens the SPEC grill, business questions first, instead of
jumping to code.

### Updating

Third-party marketplaces do not auto-update, and `marketplace.json`'s `version` is the cache key. Refresh
the listing first, then update:

```bash
claude plugin marketplace update outputty
claude plugin update outputty@outputty
```

Address it as `outputty@outputty` (`plugin@marketplace`); a bare `outputty` returns "not found".

## Planning - synchronous, and it stops for you

One session, one item. `/outputty:planning` with no id offers what the planning queue holds and takes
your pick, then claims it so a second session offers something else.

1. **Branch plus draft PR** - cut `feature/<x>` and state the objective before any work. That PR is the
   bottom of the stack.
2. **SPEC** *(gated)* - business goals, then technical goals. The first artifact is the target program:
   the exact code the user will write, input and output as distinct JSON blocks. Every settled question
   lands on the task's trail before the next is asked. An empirical question becomes a spike instead -
   one test file named `spike-<slug>`, deleted when it dies.
3. **PLAN** *(gated)* - a task graph, not a task list. `schedule` derives the layers; you approve them.
   Each task carries the `brief` and `contract` that render as its GitHub issue body.
4. **Settle it** - `spec: settled`. Planning stops.

You answer the gates in the planning session itself. Nothing is relayed.

## Building - unattended, and it runs to a verdict

The build session builds every layer itself: re-check the plan against the roadmap, turn each contract
into a failing test, write the laziest diff to green, run the suite, then cut `feature/<x>-l<N>` off the
layer below and publish it as its own draft PR.

**Master QA runs once, after the graph drains**, on the read-only `outputty-reviewer`. It prelaunches the
target program and each task's proof command in the background, judges the whole diff while they run, and
collects the outputs last. On a stack of more than one layer, the README, `docs/` and docstrings are
written *after* QA passes and ship as the top PR.

There is no per-layer QA and no build agent. Nothing merges on an escalation.

**Replan is the exit for unclear requirements.** The build scratches the work it built on the gap,
appends an `Attempt -` note carrying what was tried and what killed it, sets `spec: replan`, and stops.
The task goes back to planning with that evidence.

## The queue

Tasks live in the `tasks` MCP server, which keeps the dependency graph and syncs it two-way to GitHub
Issues and a Projects board. Deps cannot live in an issue, so the graph sits in a local cache under the OS
cache dir — disposable, because `sync` rebuilds it from the issues.

```text
schedule { project }  ->  Layer 1: schema · Layer 2: api · Layer 3: ui · Layer 4: docs
```

- **`schedule`** derives dependency-ordered layers and fails loud on a cycle. A layer is BUILD's unit of
  work: one PR, one review.
- **`list_ready`** returns what can be built right now, ranked by the task and by the target it serves.
- **A claim carries a heartbeat**, so a child that dies does not hide its ticket forever. `list_ready`
  reports a quiet claim as `stale_claims`; releasing it is a human call.
- **A trail** is the issue's comment thread — every spec decision, appended with `append_trail`.

## Product memory

Five prose Markdown docs in `.claude/`, each with one job. Sessions read them whole; to write one, edit it
directly.

1. **`product.md`** - the North Star and the Language. Every session reads it.
2. **`roadmap.md`** - why each target is worth building.
3. **`architecture.md`** - the target program and the machinery.
4. **`examples.md`** - the canonical worked examples, reused verbatim.
5. **`lessons.md`** - discoveries, fixes, directions, experiments. The one large doc, so grep it:

```bash
grep -n 'gh stack' .claude/lessons.md   # has this path burned us before?
```

Decisions live only in these docs. The fill-in skeleton for each is
[`product-template.md`](skills/outputty/references/product-template.md), read straight from the installed
plugin rather than copied into your repo.

## Driving the whole queue

```text
/outputty:start          # or /outputty:start skills, to narrow it to one folder subtree
```

One attended session dispatches **roadmap targets**, one per unattended background agent, each in its own
worktree — a target is self-contained, so its whole task set ships as one stack. The dispatcher then holds
on a one-minute tick until the wave drains, and dispatches again only on a tick that found zero workers.
The cost is a wave moving at the speed of its slowest child; the gain is that collisions are only ever
checked against other lanes. It writes no code and runs no QA of its own.

## What else is in the box

Each works on its own, and the flow reaches for them:

- **`/outputty:audit`** - surveys a repo read-only and returns a leverage-ranked findings list across nine
  categories. Re-auditing *is* the backlog. (Adapted from
  [shadcn/improve](https://github.com/shadcn/improve).)
- **`/outputty:bootstrap`** - reconstructs product memory for a brownfield repo from its docs, docstrings
  and git history.
- **`/outputty:grill`** - the interview engine, on any plan, in or out of the flow.
- **`/outputty:reprioritise`** - reorders the queue by `priority` and `deps`, so the next dispatch takes
  what matters now.
- **`/outputty:documentation`** - README and project-doc rewrites, including de-slopping prose that reads
  AI-generated.

Two subagents ship with it: **`outputty-reviewer`**, generic and read-only, told which skill to load
(`qa`, `scout`, `adversary`, `audit`); and **`outputty-expert`**, one per lens in an advanced grill,
keeping a domain-generic knowledgebase in `.claude/experts/`. A plugin agent is pinned at load time, so
editing a charter needs `/reload-plugins` before the change is visible.

## Safety

The unattended build runs shell and git on its own. The plugin ships no hooks — the guards are declarative
permissions that `init` writes into `.claude/settings.json`, plus the platform's own classifier: secret
files (`.env`, `secrets/`, `*.pem`, `*.key`) denied at any depth for Read, Edit and Write, and broadly
destructive commands (`rm -rf`, `git clean -f`) set to ask. The full list, with the reasoning, is in
[`docs/security.md`](docs/security.md).

## Development

`node .claude/skills/run-outputty/driver.mjs` is the corpus check: it resolves every plugin pointer and
asserts the rules the flow cannot afford to lose. Which harness and Claude Code version exercised it is
recorded in [`docs/exercised-on.md`](docs/exercised-on.md).

## Credits

The plugin owns the flow, and credits what shaped the rest:

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) - the laziest-working-diff
  discipline, owned in-plugin as `skills/code-rules/SKILL.md`.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** - the `agent-watchdog` validation pattern
  that became BUILD's prove-it-green step.
- **grill-with-docs** (Matt Pocock) - the interview engine the SPEC grill grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules the
  output style carries.
