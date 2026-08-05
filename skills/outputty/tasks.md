# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. One
JSONL file per branch, one tiny engine. This is the beads *model*, not the `bd` tool.

- **File:** `.claude/trails/<branch>.tasks.jsonl` — one task per line, beside the trail, cold-archived
  with it at merge.
- **Engine:** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" <cmd>`.

## Task record

`{ "id": "api", "title": "…", "status": "open", "deps": [], "scope": ["src/api"], "brief": "…", "contract"?: "…", "mode"?: "hitl", "lenses"?: ["security"], "stage"?: "build", "discovered_from"?: "parent" }`

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: the **folder** this task works in — not a file list; the builder picks the files. Two tasks sharing a folder in one layer is normal (a layer is built by one agent, in sequence), so there is no same-layer scope check.
- `brief`: the executor's charter for BUILD (the concrete done-condition).
- `contract` *(optional)*: the interface the executor builds to — the shape of the input, the shape of the output, and **one concrete input→output example**. For non-trivial logic the executor turns that example into its first failing test (test-first), so PLAN hands down an interface instead of leaving the executor to invent one. Distinct from `brief`: the brief says what *done* means; the contract says what goes *in* and comes *out* — don't restate one in the other. Keep it signature-level (it's re-embedded like the brief). Omit for trivial/mechanical tasks (a rename, a config edit, docs) with no meaningful I/O.
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
- `tasks.js ready [--json]` — the currently-unblocked set (open tasks whose deps are all done). BUILD's per-layer query.
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

Only the orchestrator / the workflow's commit stage mutates the file. The builder **never** writes it —
they report; the orchestrator writes. (Sidesteps concurrent-write merge pain.)
