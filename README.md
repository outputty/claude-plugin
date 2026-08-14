# outputty

outputty is a Claude Code plugin that carries one feature from intent to a merged pull request. You gate
the **spec** and the **plan**. Then the session builds every layer itself, ships one stacked PR per
layer, and stops only to escalate.

It owns two things and delegates everything else: **the flow** (branch, SPEC, PLAN, BUILD, master QA,
merge) and **product memory** (six YAML record sets you query instead of read). Grilling is the SPEC
engine: a rounds-based interview that can fan out a panel of domain experts plus a standing adversary,
every claim cited or dropped.

## Requirements

| Needs | Why |
| --- | --- |
| **git** | the flow is one feature branch per cycle |
| **[bun](https://bun.sh)** | `tasks.js` and `docs.js` run on it, for `Bun.YAML.parse` |
| a **GitHub remote** + authenticated **`gh`** | the draft PR opens at branch cut |
| **`gh stack`** | BUILD publishes one PR per layer, stacked |

```bash
gh extension install github/gh-stack
```

**There is no single-PR fallback.** Stacking is how outputty publishes. The session-start hook names
anything missing, every session, and never blocks on it.

Stacked pull requests are in [public preview](https://github.blog/changelog/2026-07-30-stacked-pull-requests-are-now-in-public-preview/),
so the repository needs the feature enabled.

**Recommended, not required: a language server.** With one, outputty navigates by symbol and gets type
errors after each edit. Without one it falls back to search, so nothing breaks. You pay more tokens to
find the same code.

```bash
npm install -g typescript-language-server typescript
claude plugin install typescript-lsp@claude-plugins-official
```

```bash
npm install -g pyright
claude plugin install pyright-lsp@claude-plugins-official
```

Restart Claude Code (or `/reload-plugins`) afterwards. The plugin does not install the language-server
binary, which is why each pair is two commands. If `claude plugin install` reports a missing
marketplace, register it once with `claude plugin marketplace add anthropics/claude-plugins-official`.
Nine more languages are covered - Go, Rust, C/C++, C#, Java, Kotlin, Lua, PHP, Swift - see
[code intelligence](https://code.claude.com/docs/en/discover-plugins#code-intelligence). On a large
repository `pyright` and `rust-analyzer` are memory-hungry; `/plugin disable` if that bites.

## Install

```bash
claude plugin marketplace add outputty/claude-plugin   # public repo, or a local path to a checkout
claude plugin install outputty@outputty                # no other marketplace dependencies
```

From inside Claude Code: `/plugin marketplace add outputty/claude-plugin`, then
`/plugin install outputty@outputty`, then `/reload-plugins`.

You know it is live when a change request opens the **SPEC grill** - business questions first - instead
of jumping to code.

## Update

Third-party marketplaces do not auto-update. The `version` in `marketplace.json` is the cache key:
`plugin update` is a no-op until it changes, and a stale local listing hides a new version. Refresh
first, then update.

```text
claude plugin marketplace update outputty
claude plugin update outputty@outputty
```

Address the plugin as `outputty@outputty` (`plugin@marketplace`); a bare `outputty` returns "not found".
(`claude update outputty` is unrelated - it updates the Claude CLI.) Inside Claude Code the same runs as
`/plugin marketplace update outputty` then `/plugin update outputty@outputty`, then `/reload-plugins`.

To get updates automatically: run `/plugin`, open **Marketplaces**, select **outputty**, and choose
**Enable auto-update**.

## The flow

Describe the work. One feature branch carries the whole cycle: two human-gated phases, a hands-off build
behind them, and escalation as the only interruption.

0. **Branch + draft PR** - cut `feature/<x>` and open a draft PR stating the core objective before any
   work, so scoping and code are reviewed together. The draft PR is the bottom of the stack.
1. **SPEC** *(gated)* - grill business goals, then technical goals, as two distinct passes. The first
   artifact is the **target program**: the exact code the user will write, with input and output as
   distinct JSON blocks. Every settled question lands in `.claude/trails/<branch>.trail.yaml` before the
   next question is asked. A question that is empirical rather than arguable gets a **spike**: one test
   file named `spike-<slug>`, variants as cases, committed to the branch and deleted when it dies.
2. **PLAN** *(gated)* - write the task graph, not a task list. `tasks.js schedule` derives the layers and
   you approve the schedule. A task brief is the PR description written forward: what it builds towards,
   one worked input-to-output example, and one folder. No file list, no implementation steps.
3. **BUILD** *(hands-off)* - the session that planned the work builds it, layer by layer. Per layer it
   checks the plan against the roadmap, turns each task's `contract` into a failing test, writes the
   laziest diff to green, runs the suite for real, then cuts `feature/<x>-l<N>` off the layer below and
   publishes it as its own draft PR. The stack merges atomically at the end, so one unmergeable layer
   merges none.
4. **Master QA**, once, after the graph drains. `outputty-master-qa` is read-only, it is the build's only
   real run of the target program, and it judges the whole diff against the North Star, the roadmap and
   the architecture rather than code craft. Its verdict is `pass`, `fail`-salvage (new tasks, another
   layer, run it again), or `fail`-rewrite (escalate, because a rewrite needs new requirements and
   requirements are gated).
5. **Merge** - distill the trail into the product docs, record the cycle's pivots in `lessons.yaml`,
   bring the README and `docs/` in line with what shipped, bump the plugin version, green-gate, and land
   the whole stack with `gh stack merge --yes`.

**There is no build agent and no per-layer QA.** Both were deleted at 0.48.0. Measured across 37
transcripts, per-layer QA passed every layer of the 0.47.0 migration and every defect that shipped was a
**seam** - a rename whose writers and readers moved in different layers, a tool nothing wired into the
driver, a path that resolved in one checkout only. A per-layer reader cannot see any of those. One
whole-build reader saw all four.

**Gates are real.** SPEC and PLAN stop for you. BUILD interrupts only to escalate, and nothing merges on
an escalation.

### Two session shapes

By default one session runs the whole flow. Under **Herdr**, a terminal multiplexer for coding agents
that sets `HERDR_ENV=1`, the same flow runs but each work item gets its own worktree-backed workspace,
and the primary checkout holds a thin orchestrator:

```text
  PRIMARY CHECKOUT                       LINKED WORKTREE, one per item
  --git-dir == --git-common-dir          --git-dir != --git-common-dir
  ┌────────────────────┐                 ┌────────────────────────────┐
  │ ORCHESTRATOR       │   the brief     │ ITEM                       │
  │                    │ ──────────────► │                            │
  │ roadmap, product   │                 │ branch, SPEC, PLAN, BUILD, │
  │ docs, README       │ ◄────────────── │ master QA, merge           │
  │ no code, no QA     │   the verdict   │ gates are answered HERE    │
  └────────────────────┘                 └────────────────────────────┘
   ▲                                     ┌────────────────────────────┐
   │ write-boundary.js denies any edit   │ ITEM ...                   │
   │ outside .claude/** (except trails), └────────────────────────────┘
   └ docs/** and README.md
```

The role is detected mechanically, with nothing to configure: `git rev-parse --git-dir` and
`--git-common-dir` return the same path in a primary checkout and different paths in a linked worktree.
The orchestrator never runs a phase, never re-verifies a child's QA, and never answers a gate on your
behalf.

## Task tracking

PLAN and BUILD write a **dependency graph**, never a hand-numbered list. Each task is one YAML item in
`.claude/trails/<branch>.tasks.yaml` with `id`, `deps` and `scope`:

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule
```

```text
Layer 1: api, schema
Layer 2: ui
Layer 3: docs
```

`schedule` groups the tasks whose deps are all done, and fails loud on a cycle or on two same-layer tasks
touching one file (that means a missing dep). BUILD drains the layers, closes each task, and files any
work it discovers, so progress lives in the graph rather than a checklist. Full reference:
[`skills/outputty/tasks.md`](skills/outputty/tasks.md).

For a large or uncertain deliverable, PLAN can **stage** the work into a `prototype -> build -> sweep`
chain over one scope. `stage` is a label that narrates the build; the ordering is still the `deps`.

## Product memory

Product memory is six YAML record sets in `.claude/`, each with one job, plus the per-branch trail. You
**query** them:

```bash
bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" roadmap --status "✅ shipped" --fields feature --json
```

| Set | Holds |
| --- | --- |
| `product.yaml` | **why**: the North Star and the glossary. Every session reads it. |
| `roadmap.yaml` + `roadmap/*.md` | **what we're building**: one mini-spec row per target |
| `architecture.yaml` + `architecture/*.md` | **what exists**: the coverage index and the seams |
| `tasks.yaml` + `tasks/*.md` | **how**: the durable index of bugs, debt and task-shaped work |
| `lessons.yaml` | the past: discoveries, fixes, user directions, experiments |
| `examples.yaml` | the canonical worked examples, named and reused verbatim |

Querying is the point of the split. Six sets read whole cost exactly what one file cost; a triage session
loads one small set, and only SPEC, PLAN, master QA and `audit` read whole. Use `--fields` whenever you
scan rather than read - on this repository's own `lessons.yaml`, `docs.js lessons --json` returns 174,872
bytes and `--fields title` returns 6,443. `docs.js` is read-only: to write a record set, edit its file.

**Decisions live only in the product docs.** Claude Code's auto-memory is a separate surface holding
durable lessons - gotchas, preferences, corrections - and outputty adds no mechanism to it. A per-edit
recall hook was tried and deleted: 752 injections, acted on four times.

The canonical shape of every file, with a fill-in skeleton each, is in
[`skills/outputty/references/product-template.md`](skills/outputty/references/product-template.md), which
ships to your repository with the plugin.

## What else is in the box

Each of these works on its own, and the flow reaches for them:

- **`/audit`** surveys a repository read-only and returns a leverage-ranked findings table across nine
  categories. Target-level picks feed `roadmap.yaml`, task-shaped picks feed `tasks.yaml`. There is no
  separate backlog: re-auditing is the backlog. (Adapted from
  [shadcn/improve](https://github.com/shadcn/improve).)
- **`/bootstrap`** reconstructs product memory once for a brownfield repository with no
  `.claude/product.yaml`, from its existing docs, docstrings and git history.
- **`/grill`** runs the interview engine on any plan, in or out of the flow.
- **`/documentation`** owns README and project-doc rewrites, including de-slopping prose that reads
  AI-generated. It reaches for **`/diagram`** only when a picture encodes what prose serialises badly.

Four subagents ship with the plugin, each with its model and effort pinned in its own charter so it never
inherits a weaker session model: `outputty-master-qa` (read-only, the whole-build reviewer),
`outputty-expert` (one per lens in an advanced grill, keeps a knowledgebase in `.claude/experts/`),
`outputty-adversary` (a grounded skeptic that always runs with the panel), and `outputty-scout`
(read-only, for a hunt that needs more than a couple of lookups).

**Panel agents must be plugin agents.** An agent is selected by its registered type, and the registry
holds built-in and installed-plugin agents only. Files dropped into a project's `.claude/agents/` are
never loaded. Editing a charter during development needs `/reload-plugins` or a restart before the change
is visible.

## Safety

BUILD runs shell and git autonomously, so PreToolUse hooks guard it. All six are deterministic, and a
plugin cannot ship `permissions.deny`, which is why they exist:

| Hook | Does |
| --- | --- |
| `block-dangerous-commands` | denies `rm -rf /`, `reset --hard`, force-push, piped remote execution, unqualified `DELETE`; asks on push-to-main |
| `guard-secret-files` | denies reads and writes of `.env`, `secrets/`, `*.pem`, `*.key`, `credentials.json` |
| `scan-secrets` | asks on credential patterns in file writes |
| `require-environment` | denies file edits outside a git repository |
| `write-boundary` | denies an orchestrator edit outside `.claude/**`, `docs/**` and `README.md` |
| `reading-floor` | denies master QA a fragment read of a file that is in the diff |

For the deny and ask patterns, and a copy-paste secret-file deny-list for your own `settings.json`, see
[`docs/security.md`](docs/security.md).

## Credits

outputty invents little on purpose. It owns the flow and credits what shaped the rest:

- **[ponytail](https://github.com/DietrichGebert/ponytail)** (Dietrich Gebert) - the laziest-working-diff
  discipline, the YAGNI to stdlib to native to one-line ladder, now owned in-plugin as
  `skills/code-rules/SKILL.md` and injected into every session at start. Once a hard dependency.
- **[BuilderIO/skills](https://github.com/BuilderIO/skills)** - the `agent-watchdog` validation pattern
  (reconstruct the contract, inspect evidence not vibes, classify gaps, self-correct) that became BUILD's
  prove-it-green step before master QA.
- **grill-with-docs** (Matt Pocock) - the interview engine the SPEC grill grew from.
- **[ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd)** (MIT) - the action-first output rules
  the session protocol carries.
