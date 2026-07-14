# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. One
JSONL file per branch, one tiny engine. This is the beads *model*, not the `bd` tool.

- **File:** `.claude/trails/<branch>.tasks.jsonl` — one task per line, beside the trail, cold-archived
  with it at merge.
- **Engine:** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" <cmd>`.

## Task record

`{ "id": "api", "title": "…", "status": "open", "deps": [], "scope": ["src/api.ts"], "brief": "…", "contract"?: "…", "lenses"?: ["security"], "stage"?: "build", "discovered_from"?: "parent" }`

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: files this task owns. Two tasks sharing a scope path in one layer = a missing dep (both `ready` and `schedule` fail loud).
- `brief`: the executor's charter for BUILD (the concrete done-condition).
- `contract` *(optional)*: the interface the executor builds to — the shape of the input, the shape of the output, and **one concrete input→output example**. For non-trivial logic the executor turns that example into its first failing test (test-first), so PLAN hands down an interface instead of leaving the executor to invent one. Distinct from `brief`: the brief says what *done* means; the contract says what goes *in* and comes *out* — don't restate one in the other. Keep it signature-level (it's re-embedded like the brief). Omit for trivial/mechanical tasks (a rename, a config edit, docs) with no meaningful I/O.
- `lenses` *(optional)*: extra review lenses the QA agent applies for this task (`a11y`, `security`, `data-integrity`, …), on top of the always-run spec + over-engineering-review checks. Omit for the common case. Naming them at PLAN keeps the review plan visible at the gate.
- `stage` *(optional)*: maturity role of this task when a deliverable is split into a **prototype → build → sweep** chain (Anthropic's Claude Code archetypes) — `prototype` (thinnest working slice + examples + a trade-off note in the trail), `build` (harden to the `contract`, drop what didn't survive), `sweep` (align to existing patterns across the touched files, dedupe, delete scaffolding). **Pure label** — it surfaces in the `schedule` preview and the per-layer PR comment; ordering still comes from `deps`, not from `stage`. Omit for a single-shot task that does all three in one laziest diff (the common case). See [plan.md](plan.md) for when to stage.

There is no per-task model field — Sonnet is BUILD's floor for every task, no Haiku anywhere (a live run found it drifted, burning attempts without producing usable code), so there's nothing to pin. Escalation is failure-driven: try 1 implement → try 2 patch → try 3 complete rewrite (all Sonnet) → try 4 Opus layer step-back → the user. QA is always Sonnet.

## Commands

- `tasks.js schedule [--json]` — derive the full layer schedule (+ cycle + scope-clash check). PLAN's gate preview.
- `tasks.js ready [--json]` — the currently-unblocked set (open tasks whose deps are all done). BUILD's per-layer query.
- `tasks.js add <id> <title> [--deps a,b --scope x,y --brief '…' --from <parent>]` — append a task. Discovered work + review comments.
- `tasks.js close <id>` — mark done.

## Who calls what

- **PLAN** writes the JSONL (via the Write tool — author the whole graph, including any per-task `lenses`), then previews with `schedule`.
- **BUILD** derives layers (`schedule --json`) and **embeds them as a literal** in the workflow script —
  never via `args` (inline `args` can arrive as a JSON string, so `args.layers` is undefined and the run
  crashes; see [build.md](build.md)). One commit agent per layer `close`s each passed task and `add`s
  discovered work; a drain loop runs `ready` for `discovered_from` work until empty (an original still in
  `ready` = an un-closed commit → escalate, never rebuild).
- **Post-build review** turns each PR comment into a task (`add … --from <reviewed task>`); a re-invoked BUILD drains them before merge.

## Single-writer rule

Only the orchestrator / the workflow's commit stage mutates the file. Parallel executors **never** write it —
they report; the orchestrator writes. (Sidesteps concurrent-write merge pain.)
