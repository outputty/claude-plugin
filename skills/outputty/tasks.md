# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. One
YAML file per branch, one tiny engine. This is the beads *model*, not the `bd` tool.

- **File:** `.claude/trails/<branch>.tasks.yaml` — a YAML list in **block style**, one field per line,
  readable and hand-editable, beside the trail, cold-archived with it at merge. A `/` in the branch name
  is slugified to `-` so the file lands flat beside its siblings (`feature/x` -> `feature-x.tasks.yaml`),
  never as a nested path that never exists.
- **Engine:** `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" <cmd>` — bun, for `Bun.YAML.parse` /
  `Bun.YAML.stringify` (node has no builtin YAML support).

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
appends one entry:

```yaml
attempts:
  - layer: "l2 — the kysely adapter"
    tried: "threading the index family through EngineFamilies"
    killed_by: "property fn types are strictly contravariant, so a subclass cannot re-declare the map"
    evidence: "packages/core/__tests__/index-family.test-d.ts:41"
```

The next planning pass reads these before asking anything, and the next build reads them before
choosing an approach. `tried` and `killed_by` are both required: an attempt with no cause is a rumour.

## Task record

`{ "id": "api", "title": "…", "status": "open", "deps": [], "scope": ["src/api"], "brief": "…", "contract"?: "…", "mode"?: "hitl", "lenses"?: ["security"], "stage"?: "build", "discovered_from"?: "parent" }`

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `spec`: `drafting` | `settled` | `replan` — which stage owns it (above). Absent means `settled`.
- `tier` *(optional)*: `1`-`4`, the MODEL a dispatch uses (1 haiku, 2 sonnet 5, 3 opus 4.8, 4 fable 5).
  Absent means 3. `tasks.js dispatch <id>` prints the flags. Distinct from `effort`, which is the
  reasoning-effort knob a charter sets.
- `attempts` *(on a `replan`)*: what a build tried and what killed it (above).
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: the **folder** this task works in — not a file list; the builder picks the files. Two tasks sharing a folder in one layer is normal (a layer is built by one agent, in sequence), so there is no same-layer scope check.
- `brief`: the executor's charter for BUILD (the concrete done-condition).
- `contract` *(required for every non-trivial task; omit only for a mechanical one)*: the interface the executor builds to — the shape of the input, the shape of the output, and **one concrete input→output example**. For non-trivial logic the executor turns that example into its first failing test (test-first), so PLAN hands down an interface instead of leaving the executor to invent one. Distinct from `brief`: the brief says what *done* means; the contract says what goes *in* and comes *out* — don't restate one in the other. Keep it signature-level (it's re-embedded like the brief). Omit for trivial/mechanical tasks (a rename, a config edit, docs) with no meaningful I/O.
- `mode` *(optional, default `afk`)*: `afk` — the build agent resolves it alone. **`hitl`** — it cannot be
  finished without the human: a preference only they hold, a credential, an account to create, a judgement
  about their own product. A `hitl` task **stops the build and asks**, and the agent never answers the
  human's half on their behalf — standing in for them is the failure this field exists to prevent, and it
  is invisible in the output when it happens. Mark it at PLAN, where the gap is obvious; discovering it
  mid-build costs a layer. (Structurally enforced downstream too: `AskUserQuestion` is stripped from every
  subagent even when its charter lists it, so a build agent literally cannot ask — a `hitl` task is the
  orchestrator's to resolve before dispatch.)
- `lenses` *(optional)*: extra review lenses the QA agent applies for this task (`a11y`, `security`, `data-integrity`, …), on top of QA's always-run checks. Omit for the common case. Naming them at PLAN keeps the review plan visible at the gate.
- `stage` *(optional)*: maturity role of this task when a deliverable is split into a **prototype → build → sweep** chain (Anthropic's Claude Code archetypes) — `prototype` (thinnest working slice + examples + a trade-off note in the trail), `build` (harden to the `contract`, drop what didn't survive), `sweep` (align to existing patterns across the touched files, dedupe, delete scaffolding). **Pure label** — it surfaces in the `schedule` preview and the per-layer PR comment; ordering still comes from `deps`, not from `stage`. Omit for a single-shot task that does all three in one laziest diff (the common case). See [plan.md](plan.md) for when to stage.

There is no per-task model field — BUILD tiers the model by **role**, not by task, so there's nothing to pin. Escalation is QA's loop: the builder makes one pass, then QA reviews and fixes its own findings until clean, escalating when a finding survives two attempts. The full model + escalation policy lives in [build.md](build.md) — don't restate it here.

## Commands

- `tasks.js schedule [--json]` — derive the full layer schedule (+ cycle check). PLAN's gate preview.
- `tasks.js ready [--json]` — the BUILD stage's work: open, `spec: settled`, every dep done.
- `tasks.js planning [--json]` — its mirror: open tasks the PLANNING stage still owns (`drafting`/`replan`).
- `tasks.js dispatch <id> [--json]` — the `--model`/`--effort` flags this task's `tier` selects.
- `tasks.js add <id> <title> [--deps a,b --scope folder --brief '…' --from <parent>]` — append a task. Discovered work + review comments.
- `tasks.js amend <id> [--scope folder --brief '…']` — **widen an open task mid-build.** `--scope` adds
  folders (never removes; a scope the task already has is refused), `--brief` replaces. This is the fix
  for QA's **scope-negotiation finding** — an out-of-folder edit a done-condition genuinely required.
  A `done` task is refused: its scope already decided what got committed, so narrowing it orphans work.
- `tasks.js close <id>` — mark done.

## Who calls what

- **PLAN** writes the JSONL (via the Write tool — author the whole graph, including any per-task `lenses`), then previews with `schedule`.
- **BUILD** derives layers (`schedule --json`) and copies each layer's tasks **into the build agent's
  prompt** — the agent never runs `tasks.js` itself. **The layer order is also the PR stack order**:
  layer N+1 always depends on layer N (a Kahn leveling places a task in the earliest layer its deps
  allow), so stacking each layer's PR on the one below states a real dependency — see
  [build.md](build.md). One commit agent per layer `close`s each passed task and `add`s discovered work;
  a drain loop runs `ready` for `discovered_from` work until empty (an original still in `ready` = an
  un-closed commit → escalate, never rebuild).
- **Post-build review** turns each PR comment into a task (`add … --from <reviewed task>`); a re-invoked BUILD drains them before merge.

## Single-writer rule

**The session that owns the task writes it.** There is one session per item and it is the only writer
while it holds the task, so there is nothing to serialise. (This replaces an orchestrator-only rule that
named the build agent and the commit stage, both deleted at 0.48.0.) The orchestrator never writes task
state at all — it reads the queue to decide what to dispatch.
