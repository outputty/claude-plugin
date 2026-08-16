# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. This is
the beads _model_, not the `bd` tool.

## Storage: structure in the trail, state in one file per task

| Where | Holds | Written by |
| --- | --- | --- |
| `.claude/trails/<branch>.trail.yaml`, its `tasks:` section | **structure**: `id`, `title`, `brief`, `contract`, `scope`, `deps`, `mode`, `lenses`, `stage` | a human or a PLANNING session, **by hand** |
| `.claude/tasks/<id>.yaml`, one file per task | **mutable state**: `status`, `spec`, `attempts` — plus the whole record for a discovered task | `tasks.js add` / `amend` / `close` |
| `.claude/tasks.yaml` | the **derived** repo-level index `docs.js tasks` reads | `tasks.js index`, never a hand edit |

**`tasks.js` never writes a trail.** `Bun.YAML.stringify` flattens every `|` block scalar into an
escaped one-line string, and a mutating command rewrites its whole file. A tool that wrote the trail
would destroy the hand-authored prose in `core_objective` and in every `decisions` answer.

**One state file per task** means two sessions never write the same file, so a merge never conflicts
over task state.

Reading joins the two: the trail's record, overlaid by its state file, field by field. A state file
with no trail entry is work discovered mid-build, and it joins the graph on its own.

```text
.claude/
├── tasks.yaml                    # DERIVED index — tasks.js index
├── tasks/
│   ├── t-1.yaml                  # status · spec · attempts
│   └── t-9.yaml                  # a discovered task: the whole record
└── trails/
    └── feature-x.trail.yaml      # core_objective · decisions · … · tasks:  ◄── hand-authored
```

- **Engine:** `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" <cmd>` — bun, for `Bun.YAML.parse` /
  `Bun.YAML.stringify` (node has no builtin YAML support).
- A `/` in the branch name is slugified to `-`, so the trail lands flat beside its siblings
  (`feature/x` -> `feature-x.trail.yaml`), never as a nested path that never exists.
- A layer branch (`feature/x-l2`) strips its `-l<N>` suffix and resolves to the feature's trail.

## Two stages, and the state that decides which one owns a task

The queue is the whole interface between planning and building. `spec` says which stage owns a task,
and nothing else does.

| `spec` | Owned by | Means |
| --- | --- | --- |
| `drafting` | PLANNING | Never been specced. Requirements are not captured yet. |
| `settled` | BUILD | Requirements captured, target program agreed, graph written. Buildable. |
| `replan` | PLANNING | A build proved the requirements were not concrete enough. Carries `attempts`. |

Absent means `settled`, so a graph written before this field schedules unchanged.

```text
  drafting ──► settled ──► build succeeds ──► done
     ▲            │
     │            └──► build hits a requirements gap ──► replan
     └──────────────────────────────────────────────────────┘
                 an ITERATION: `attempts` rides along
```

`tasks.js ready` returns the build stage's work: `settled`, deps met, still open. `tasks.js planning`
returns its mirror, the tasks a human-in-the-loop pass owns. The two sets are disjoint by construction,
so a sweep can print both and a task can never be claimed by both stages at once.

**An empty `ready` is not a problem.** The build sweep does nothing and sleeps. It never waits on
planning, and planning never waits on it.

## `attempts` — what the last build learned, carried forward

A `replan` without evidence is the same blank question asked twice. Every build that sends a task back
appends one entry to its **state file**:

```yaml
# .claude/tasks/kysely-adapter.yaml
id: kysely-adapter
spec: replan
attempts:
  - layer: "l2 — the kysely adapter"
    tried: "threading the index family through EngineFamilies"
    killed_by: "property fn types are strictly contravariant, so a subclass cannot re-declare the map"
    evidence: "packages/core/__tests__/index-family.test-d.ts:41"
```

The next planning pass reads these before asking anything, and the next build reads them before
choosing an approach. `tried` and `killed_by` are both required: an attempt with no cause is a rumour.

## Task record

The structural half, as PLAN writes it into the trail's `tasks:` section:

```yaml
tasks:
  - id: api
    title: …
    deps: []
    scope: ["src/api"]
    tier: 3          # 1-4, how much model — default 3
    qa: subagent     # skip | inline | subagent — how much review — default subagent
    brief: |
      …
    contract: |
      …
```

- `id`: the key. It is also the state file's name, so the two can never disagree.
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: the **folder** this task works in — not a file list; the builder picks the files. Two tasks sharing a folder in one layer is normal; there is no same-layer scope check.
- `brief`: the executor's charter for BUILD (the concrete done-condition).
- `contract` _(required for every non-trivial task; omit only for a mechanical one)_: the interface the executor builds to — the shape of the input, the shape of the output, and **one concrete input→output example**. For non-trivial logic the executor turns that example into its first failing test (test-first). Distinct from `brief`: the brief says what _done_ means; the contract says what goes _in_ and comes _out_. Keep it signature-level.
- `mode` _(optional, default `afk`)_: `afk` — the build agent resolves it alone. **`hitl`** — it cannot be finished without the human: a preference only they hold, a credential, an account to create, a judgement about their own product. A `hitl` task **stops the build and asks**, and the agent never answers the human's half. Mark it at PLAN. (`AskUserQuestion` is stripped from every subagent even when its charter lists it, so a `hitl` task is the orchestrator's to resolve before dispatch.)
- `lenses` _(optional)_: extra review lenses the QA agent applies for this task (`a11y`, `security`, `data-integrity`, …), on top of QA's always-run checks. Omit for the common case. Name them at PLAN.
- `stage` _(optional)_: maturity role of this task when a deliverable is split into a **prototype → build → sweep** chain — `prototype` (thinnest working slice + examples + a trade-off note in the trail), `build` (harden to the `contract`, drop what didn't survive), `sweep` (align to existing patterns across the touched files, dedupe, delete scaffolding). **Pure label** — it surfaces in the `schedule` preview and the per-layer PR comment; ordering still comes from `deps`. Omit for a single-shot task that does all three in one laziest diff. The PLANNING stage file says when to stage.
- `tier`: the two **scaling knobs**, authored on the task at PLAN. `1`-`4`, how much model the task needs (default 3, validated, surfaced in the index). What a tier MEANS (which model) is the orchestrator's policy, in the CLAUDE.md block's tier table — not here. Distinct from `effort`, the reasoning-effort knob a charter sets. **Write it, so the model is explicit; a safe default applies if absent.**
- `qa`: `skip` | `inline` | `subagent`, how much review the task's work earns (default `subagent`). Set at PLAN, never by the build session (which would grade its own work). A build's review level is the strongest `qa` among the tasks it drained: `subagent` dispatches the `qa` skill on the read-only `outputty-reviewer`, `inline` loads the same `qa` skill in the build session, `skip` is CHECKS-green-is-the-review. **Write it, so the review is explicit; a safe default applies if absent.**

The mutable half, in `.claude/tasks/<id>.yaml`:

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `spec`: `drafting` | `settled` | `replan` — which stage owns it (above). Absent means `settled`.
- `attempts` _(on a `replan`)_: what a build tried and what killed it (above).
- `scope` / `brief`: present only after an `amend` widened them. State wins over the trail, field by field.

There is no per-task model field beyond `tier` — BUILD tiers the model by **role**, not by task.
Escalation is failure-driven: a fix that fails twice after a real diagnosis escalates to the user. The
BUILD stage file owns that policy; don't restate it here.

## Commands

- `tasks.js schedule [--json]` — derive the full layer schedule (+ cycle check). PLAN's gate preview.
- `tasks.js ready [--json]` — the BUILD stage's work: open, `spec: settled`, every dep done.
- `tasks.js planning [--json]` — its mirror: open tasks the PLANNING stage still owns (`drafting`/`replan`).
- `tasks.js add <id> <title> [--deps a,b --scope folder --brief '…' --from <parent>]` — file a task in
  its own state file. Discovered work, review comments and `audit` findings all land this way.
- `tasks.js amend <id> [--scope folder --brief '…']` — **widen an open task mid-build.** `--scope` adds
  folders (never removes; a scope the task already has is refused), `--brief` replaces. This is the fix
  for QA's **scope-negotiation finding** — an out-of-folder edit a done-condition genuinely required.
  A `done` task is refused: its scope already decided what got committed, so narrowing it orphans work.
- `tasks.js close <id>` — mark done.
- `tasks.js index [--json]` — regenerate `.claude/tasks.yaml` from every trail's `tasks:` section joined
  with every state file. Run it at the merge step. The output is derived, so a hand edit is overwritten.
  Each index record carries the task's `tier`, which the orchestrator reads to pick the CLAUDE.md
  tier-table row.

`OUTPUTTY_TASKS` names a trail file directly, and `OUTPUTTY_HOME` moves the whole `.claude` set. Both
are test seams.

## Who calls what

- **PLAN** writes the trail's `tasks:` section with the Write tool, including any per-task `lenses`,
  then previews with `schedule`.
- **BUILD** derives layers (`schedule --json`) and builds each layer itself. **The layer order is also
  the PR stack order**: layer N+1 always depends on layer N, because a Kahn leveling places a task in
  the earliest layer its deps allow. Stacking each layer's PR on the one below therefore states a real
  dependency. Per layer it `close`s each passed task and `add`s discovered work. A drain loop runs
  `ready` for `discovered_from` work until empty. An original still in `ready` means an un-closed
  commit, so escalate rather than rebuild.
- **Post-build review** turns each PR comment into a task (`add … --from <reviewed task>`); a re-invoked
  BUILD drains them before merge.
- **The merge step** runs `index` so `.claude/tasks.yaml` matches what actually shipped.

## Single-writer rule

**The session that owns the task writes it.** There is one session per item and it is the only writer
while it holds the task. The orchestrator never writes task state at all — it reads the queue to decide
what to dispatch.
