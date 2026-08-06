---
type: Examples
title: outputty — Examples
description: The canonical worked examples, one per concept.
timestamp: 2026-08-06
---

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
