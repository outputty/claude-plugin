# outputty

A single **spec-driven work harness** for every project, delivered as a Claude Code plugin. It
sequences work as **grill → plan → hands-off build**, and leans on tools you already have instead of
reinventing them:

- **ponytail** (dependency) — HOW code gets built: the laziest working diff.
- **OpenWolf** (required) — token discipline + operational memory (`anatomy`/`cerebrum`/`buglog`).
- **grill-with-docs** (bundled as `outputty-grill`) — the interview engine behind the SPEC phase.

outputty itself owns only the flow and one product doc. See [`.claude/product.md`](.claude/product.md)
for the full design (it's dogfooded — outputty scoped itself with its own conventions).

## Requirements

The SessionStart hook hard-blocks all work unless three things are in place:

- **OpenWolf** initialised (`openwolf init`) — the operational-memory + token layer outputty depends
  on. (Can't be a plugin dependency; it's a CLI, not a marketplace plugin.)
- **git** initialised.
- a **git remote** — outputty tracks every feature in a draft PR from branch-cut, so a remote is
  mandatory (and `gh` must be authenticated).

## Install

```
claude plugin marketplace add F:/outputty/harness      # or your private GitHub URL
claude plugin install outputty                          # pulls ponytail automatically
```

Then, once, remove the standalone copy so there's one source of the grilling engine:

```
rm -rf ~/.claude/skills/grill-with-docs
```

## Use

**Brownfield repo (no `product.md` yet)?** Run `/outputty-init` once — it reconstructs `product.md`
from your docs, docstrings, and (optionally) commit messages, then grills the gaps.

For features: just describe the work — the `outputty` skill triggers on feature/change
requests. Or `/outputty <what you want>`. Grill anything ad hoc with `/outputty-grill`.

The flow, one feature branch:

0. **Branch + draft PR** — cuts `feature/<x>` and opens a **draft PR before any work**, so scoping
   and code are reviewed together.
1. **SPEC** *(gated)* — grills **business** then **technical** goals as distinct passes; logs a
   thought-trail; resolves decisions into `product.md`.
2. **PLAN** *(gated)* — decomposes into **layers** of **tasks**; you OK it.
3. **BUILD** *(hands-off)* — one `task-runner` subagent per task, layer by layer; QA gate; retries a
   failed task once; escalates only on a double failure. Commits are verbose (problem + solution).
4. **Merge step** — distills the trail into `product.md` (pruned), appends **What was tried**, marks
   the PR ready, merges.

## Memory boundary

| lives in | owns |
| --- | --- |
| `.claude/product.md` | North Star + Architecture + What was tried. **Decisions only here.** |
| `.claude/trails/<branch>.md` | transient per-branch scoping trail (thought-trail + plan) |
| OpenWolf `.wolf/` | navigation (`anatomy`), gotchas/prefs (`cerebrum`), bugs (`buglog`) |

Never duplicate a decision into OpenWolf's cerebrum, and never put product vision into cerebrum — it
is read before every code-gen and must stay lean.

## Layout

```
harness/
├── .claude-plugin/{marketplace,plugin}.json   manifests; ponytail dep + cross-marketplace allowlist
├── hooks/{hooks.json, session.js}             SessionStart: enforce OpenWolf + inject protocol + product.md
├── skills/
│   ├── outputty/{SKILL,spec,plan,build}.md     orchestrator + on-demand phase files
│   ├── outputty-init/SKILL.md                  brownfield bootstrap (reconstruct product.md)
│   └── outputty-grill/SKILL.md                 the interview engine
├── agents/{task-runner,scanner}.md             haiku build + scan subagents
└── .claude/{product.md, trails/}               dogfooded design
```
