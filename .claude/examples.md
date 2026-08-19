# outputty - Examples

> The canonical worked examples, named, one per concept. Reused verbatim everywhere an example is
> shown; a new example is pinned here first.

## A task (the graph's unit)

Input - what PLAN authors into the `tasks` MCP server with `add_task`:

```json
{
  "project": "outputty",
  "id": "csv-export",
  "title": "Add CSV export to the report page",
  "deps": ["report-model"],
  "scope": ["src/report"],
  "tier": 3,
  "qa": "subagent",
  "spec": "settled",
  "brief": "End state: the report page has a Download CSV button that streams the current filtered rows.",
  "contract": "In: a filtered report view. Out: a text/csv response with one row per record."
}
```

Output - the `tasks` MCP `schedule` tool derives the layers from the `deps` graph:

```json
[
  [{ "id": "report-model", "title": "Model the report rows" }],
  [{ "id": "csv-export", "title": "Add CSV export to the report page" }]
]
```

## A product-doc read (what replaces a whole-file query)

Input - the lookup a session runs against product memory. The docs are read **whole**; only
`lessons.md` is large, so grep it by path:

```bash
cat .claude/roadmap.md                        # where every target stands
grep -c 'hooks/protocol.md' .claude/lessons.md  # has this file burned us before?
```

Output - the whole roadmap prints, and the archive reports its hits (real observed):

```text
42
```

Forty-two lines in `lessons.md` name `hooks/protocol.md`; open the entries around them to read what
each pivot did to that file.

## A task trail entry (the decision log)

Input - a settled question is recorded on its task in the `tasks` MCP server with `append_trail`:

```json
{
  "id": "csv-export",
  "kind": "decision",
  "text": "Stream the CSV instead of buffering; the largest report is 400k rows and must not hold in memory."
}
```

Output - `get_trail` reads the task's thread back, the spec thought-trail, newest last:

```json
[
  {
    "kind": "decision",
    "text": "Stream the CSV instead of buffering; the largest report is 400k rows and must not hold in memory."
  }
]
```

## A layer of the build (what BUILD dispatches)

Input - the orchestrator derives layers from the graph, then hands one layer to a builder. The `tasks`
MCP `schedule` tool:

```json
[
  [{ "id": "t-1", "title": "Drain the barrel re-exports", "scope": ["src/core"] }],
  [{ "id": "t-2", "title": "Point consumers at the modules", "scope": ["src/api"] }]
]
```

Output - the layer write-up QA returns, and the PR body it becomes:

```json
{
  "verdict": "passed",
  "checks": [{ "name": "implemented as briefed", "pass": true, "notes": "contract example is the test" }],
  "fixed": ["docstrings: 2 missing summaries → added"]
}
```

## A product-doc load (what a session reads, and when)

Input - the role a session is in:

```json
{ "phase": "BUILD", "task": "t-1", "question": "does this seam already exist?" }
```

Output - the files that answer it, not the whole set:

```json
{ "load": ["product.md", "architecture.md"], "skip": ["roadmap.md", "lessons.md"] }
```
