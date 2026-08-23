# outputty - Examples

Every example below works on one base program, the orders sync CLI.

## The base program

```
main()
	loadConfig()
		readEnv()                  .env
	syncOrders()
		fetchPage()                loop until next_page is null
			httpGet()              GET /orders?page=N
		upsertOrder()              one per fetched order
			writeRow()             INSERT INTO orders
	printSummary()                 stdout
```

Input - the command a user runs:

```bash
orders sync --since 2026-08-01
```

Output - stdout:

```text
fetched 3 pages, 128 orders
upserted 128 rows into orders
```

## A task (the graph's unit)

Input - `add_task` files one unit of work against the base program:

```json
{
  "project": "/Users/me/code/orders",
  "id": "csv-export",
  "title": "Add a CSV export of the synced orders",
  "target": "analyst-self-serve",
  "deps": ["order-store"],
  "scope": ["src/orders"],
  "qa": "subagent",
  "spec": "settled",
  "brief": "End state: `orders export --csv` writes one row per stored order.",
  "contract": "In: a synced orders table. Out: a text/csv stream, one row per order."
}
```

Output - `schedule` returns the whole open plan as dependency-ordered layers. It does not filter
targets, so `analyst-self-serve` rides layer 1 beside the task it groups:

```json
{
  "layers": [
    { "layer": 1, "ids": ["analyst-self-serve", "order-store"], "display": "analyst-self-serve, order-store" },
    { "layer": 2, "ids": ["csv-export"], "display": "csv-export" }
  ]
}
```

## A task trail entry (the decision log)

Input - `append_trail` records one settled question on its task:

```json
{
  "project": "/Users/me/code/orders",
  "id": "csv-export",
  "kind": "decision",
  "note": "Stream the CSV instead of buffering. The largest export is 400k rows and must not hold in memory."
}
```

Output - `get_trail` reads that task's thread back, oldest first:

```json
{
  "trail": [
    {
      "kind": "decision",
      "note": "Stream the CSV instead of buffering. The largest export is 400k rows and must not hold in memory."
    }
  ]
}
```

## A layer of the build (one stacked PR)

Input - layer 2 above, its `contract` written as a failing test before any code:

```text
tests/export.test.ts "writes one CSV row per stored order" fails: exportCsv is not defined
```

Output - the layer ships as one draft PR on the stack, and its task closes inside that commit:

```text
feature/csv-export-l2  #42  Add a CSV export of the synced orders  (closes csv-export)
```
