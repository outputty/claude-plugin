# outputty — Examples

> The canonical worked examples, named — one per concept. Reused verbatim everywhere an example is
> shown; a new example is pinned here first.

## A task line (the graph's unit)

One JSON object per line in `.claude/trails/<branch>.tasks.jsonl`:

Input (what PLAN writes):

```json
{
  "id": "t-1",
  "title": "Drain the barrel re-exports",
  "status": "open",
  "deps": [],
  "scope": ["src/core"],
  "brief": "End state: every consumer imports from the module that defines the symbol."
}
```

Output (`tasks.js schedule --json` derives the layers):

```json
[[{ "id": "t-1", "title": "Drain the barrel re-exports", "status": "open" }]]
```

## A hook verdict (the gate protocol)

Input (Claude Code sends the tool call on stdin):

```json
{
  "tool_input": { "file_path": ".claude/trails/feat.tasks.jsonl" },
  "transcript_path": "/path/to/session.jsonl"
}
```

Output (the hook denies on stdout, exit 0):

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "The grill skill never loaded in this session."
  }
}
```

## A layer of the build (what BUILD dispatches)

The orchestrator derives layers from the graph, then hands one layer to a builder.

Input (`tasks.js schedule --json`):

```json
[
  [{ "id": "t-1", "title": "Drain the barrel re-exports", "scope": ["src/core"] }],
  [{ "id": "t-2", "title": "Point consumers at the modules", "scope": ["src/api"] }]
]
```

Output (the layer write-up QA returns, and the PR body it becomes):

```json
{
  "verdict": "passed",
  "checks": [{ "name": "implemented as briefed", "pass": true, "notes": "contract example is the test" }],
  "fixed": ["docstrings: 2 missing summaries → added"]
}
```

## A product-doc load (what a session reads, and when)

Input (the role a session is in):

```json
{ "phase": "BUILD", "task": "t-1", "question": "does this seam already exist?" }
```

Output (the files that answer it — not the whole bundle):

```json
{ "load": ["product.md", "architecture.md"], "skip": ["roadmap.md", "lessons.md"] }
```
