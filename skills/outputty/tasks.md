# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. One
JSONL file per branch, one tiny engine. This is the beads *model*, not the `bd` tool.

- **File:** `.claude/trails/<branch>.tasks.jsonl` — one task per line, beside the trail, cold-archived
  with it at merge.
- **Engine:** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.mjs" <cmd>`.

## Task record

`{ "id": "api", "title": "…", "status": "open", "deps": [], "scope": ["src/api.ts"], "brief": "…", "discovered_from"?: "parent" }`

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: files this task owns. Two ready tasks sharing a scope path = a missing dep (`schedule` fails loud).
- `brief`: the executor's charter for BUILD (the concrete done-condition).

## Commands

- `tasks.mjs schedule [--json]` — derive the full layer schedule (+ cycle + scope-clash check). PLAN's gate preview.
- `tasks.mjs ready [--json]` — the currently-unblocked set (open tasks whose deps are all done). BUILD's per-layer query.
- `tasks.mjs add <id> <title> [--deps a,b --scope x,y --brief '…' --from <parent>]` — append a task. Discovered work + review comments.
- `tasks.mjs close <id>` — mark done.

## Who calls what

- **PLAN** writes the JSONL (via the Write tool — author the whole graph), then previews with `schedule`.
- **BUILD** derives layers (`schedule --json` → the workflow's `args.layers`); the commit stage `close`s each passed
  task and `add`s discovered work; a drain loop runs `ready` until empty.
- **Post-build review** turns each PR comment into a task (`add … --from <reviewed task>`); the same build loop drains them.

## Single-writer rule

Only the orchestrator / the workflow's commit stage mutates the file. Parallel executors **never** write it —
they report; the orchestrator writes. (Sidesteps concurrent-write merge pain.)
