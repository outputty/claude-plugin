# Task graph (beads-lite) — the substrate PLAN writes and BUILD drains

outputty tracks task breakdown + progress as a **dependency graph**, not hand-authored layers. One
JSONL file per branch, one tiny engine. This is the beads *model*, not the `bd` tool.

- **File:** `.claude/trails/<branch>.tasks.jsonl` — one task per line, beside the trail, cold-archived
  with it at merge.
- **Engine:** `node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" <cmd>`.

## Task record

`{ "id": "api", "title": "…", "status": "open", "deps": [], "scope": ["src/api.ts"], "brief": "…", "lenses"?: ["security"], "discovered_from"?: "parent" }`

- `status`: `open` → `done`. No in-progress state — single writer, serial commits.
- `deps`: ids that must be `done` before this task is ready. **Author deps, not layer numbers** — layers are derived.
- `scope`: files this task owns. Two tasks sharing a scope path in one layer = a missing dep (both `ready` and `schedule` fail loud).
- `brief`: the executor's charter for BUILD (the concrete done-condition).
- `lenses` *(optional)*: extra review lenses BUILD adds to its static panel for this task (`a11y`, `security`, `data-integrity`, …). Omit for the common case — spec + `ponytail-review` always run. Naming the specialized reviewers here (at PLAN) keeps the review plan visible at the gate.

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
