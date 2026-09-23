---
name: data-engineering
description: Loading data into a warehouse or database, idempotent or retried loads, staging tables, MERGE/upsert under concurrency, history and deletions, partitioning and file pruning, hashing across engines, partitioned aggregation, Google Sheets extraction; Postgres, DuckDB, BigQuery, Redshift, Snowflake, Databricks, dbt, SQLMesh, Airbyte.
---

# data-engineering

The load, staging, concurrency and cross-engine traps a data pipeline hits, grouped by the problem, with the engine named on each line.

## Loading and idempotent retry

- **Retry a BigQuery load with WRITE_TRUNCATE** - a load job is atomic, but the client cannot tell a failed job from a lost success; truncate-retry makes it idempotent. Budget 1,500 load jobs per table per day.
- **Redshift plain COPY only appends** - it has no dedup and no file skip. Only COPY JOB tracks loaded files by filename to load each once; it forbids a manifest and cannot run inside a transaction block.
- **Databricks COPY INTO skips by file identity** - a file already loaded is skipped even when it was modified since; the change is silently ignored.
- **Snowflake load metadata expires after 64 days** - an older file's load status goes UNCERTAIN and COPY silently skips it by default; `LOAD_UNCERTAIN_FILES = TRUE` or `FORCE` loads it and can duplicate it.
- **Airbyte delivers at least once** - expect duplicate records downstream and dedupe on a key.
- **`pg-copy-streams` with one push per row is a regression** (Postgres) - it is several times slower than a single `INSERT ... SELECT FROM unnest($1::type[], ...)` array-bind. Buffer encoded text into large pushes; COPY then wins only slightly.
- **DuckDB Appender speedup shrinks inside a real pipeline** - clearly faster than an unnest array-bind INSERT in isolation, only modestly faster inside a full pipeline run. Measure it in the real pipeline on your machine.

## Staging and transactions

- **DuckDB TEMP table is connection-scoped** - it survives its own `COMMIT` on the same connection and is invisible to every other connection.
- **Postgres TEMP table churn bloats `pg_catalog`** - each create and drop writes catalog rows. Reuse one staging table with `ON COMMIT DELETE ROWS`.
- **`UPDATE ... FROM staging` needs a key index and `ANALYZE`** (Postgres) - autovacuum never analyzes a temp table, so it has no statistics; without both, the join plan degrades toward quadratic.
- **DuckDB refuses writes to several attached databases in one transaction** - a cross-engine handoff commits on the target alone.
- **2PC is a trap** (Postgres) - an unresolved `PREPARE TRANSACTION` keeps holding its locks, you must run the coordinator log yourself, and `postgres_fdw` refuses it. Rely on idempotent retry instead.

## MERGE and upsert

- **MERGE without a UNIQUE constraint races** (Postgres, DuckDB) - two connections racing the same new key under `WHEN NOT MATCHED THEN INSERT` both insert, with no error. A `UNIQUE` index turns the loser into a catchable duplicate-key error.
- **Postgres 16 MERGE has no `RETURNING`** - a one-pass SCD2 close-and-insert needs Postgres 17 (`RETURNING merge_action()`).
- **dbt `on_schema_change: sync_all_columns` drops columns** missing from the new select; only `append_new_columns` never drops.

## History and deletions

- **A cursor stores a position only** - it does not re-filter what extraction returns. Late rows are dropped inside the extraction's own filter, which the cursor never sees.
- **A keyed per-row write cannot see deletions** - an upsert or delete-insert touches only keys in the extract, so an upstream delete becomes a permanent ghost row. Detect absence separately, by a full-extract diff or a delete marker.
- **An unordered reject or quarantine sink runs in the right order only by accident** - declare its order against the main write, or split it into its own transaction.
- **dbt `store_failures` copies failing rows and never quarantines them** - the model keeps every row. A failing test skips downstream nodes but never rolls back the model it tested.
- **SQLMesh audits protect production only under `plan`** - under `run`, a failing audit stops the run after the invalid data is already in the production table.

## Partitioning and pruning

- **A Postgres partitioned table's unique key must include every partition-key column** - the unique index fails at CREATE otherwise.
- **No table converts to partitioned in place** (Postgres) - `ALTER TABLE ... PARTITION BY` is a syntax error. Create new, `ATTACH PARTITION`, swap.
- **Percent-encode Hive path values** (DuckDB) - DuckDB percent-decodes on read. Write `__HIVE_DEFAULT_PARTITION__` for an absent value; it reads back as `NULL`. Every value returns as text, so a number or boolean does not round-trip.
- **Prove pruning with `EXPLAIN ANALYZE`** (DuckDB) - assert `File Filters` and `Scanning Files: n/m`. Result rows are identical whether files were skipped or read and filtered.
- **DuckDB zonemaps prune only as far as insert order allows** - a native table has no `PARTITION BY`; order inserts by the filter column.

## Hashing across engines

Derive a portable hash input from JSON `->>` text, which agrees on Postgres and DuckDB, never from a typed column.

- **`concat_ws` skips NULL** (Postgres) - `('x', NULL)` and `(NULL, 'x')` give the same string. Prefix each value with its byte length instead.
- **Boolean text differs by path** (Postgres) - `concat_ws` renders `t`/`f`, while `CAST(... AS text)` renders `true`/`false`.
- **Never hash a `timestamptz`** (Postgres, DuckDB) - its text follows the session `TimeZone`, so two connections to one database disagree. Use `timestamp`.
- **DOUBLE and REAL cast to text as `2.0` in DuckDB and `2` in Postgres.**
- **JSON spacing differs** - Postgres `json_build_array` gives `["x", 2]`, DuckDB `json_array` gives `["x",2]`.
- **DuckDB `hash()` may change between versions** - a stored identifier built on it stops matching after an upgrade. Use `md5` or `sha256`.

## Partitioned aggregation

- **Type the combine as `(V, U) => V`** - `U` is the fold's accumulator, not the item. A combine typed as the fold's own signature lets a wrong one compile.
- **A fold reused as its combine typechecks and lies** when the accumulator type equals the item type:

```ts
const count = (acc: number, _x: number) => acc + 1;
[3, 2].reduce(count, 0); // 2 (the number of partials); the right answer is 5
```

- **A non-identity initial seeds every partition** - N partitions carry `(N-1) * initial` excess, and no combine recovers it.
- **A mean of means is wrong** unless partitions are equal in size. Carry `{ sum, count }` and add both fields.
- **Emit the empty-stream seed once**, from the stage that sees the whole stream. A partition with an empty share stays silent.

## Spreadsheet extraction

- **Request `valueRenderOption=UNFORMATTED_VALUE`** (Google Sheets) - `FORMATTED_VALUE` leaks cell formats (`"€12"`). Booleans then arrive as JSON `true`/`false`, not `"TRUE"`.
- **Read every tab in one `values:batchGet`** - repeat `ranges`; `valueRanges` returns in request order.

```text
GET https://sheets.googleapis.com/v4/spreadsheets/<id>/values:batchGet?ranges=Companies&ranges=Stats&valueRenderOption=UNFORMATTED_VALUE
```

- **List tab names with `fields=sheets.properties`** - `GET .../spreadsheets/<id>?fields=sheets.properties(title,gridProperties)`.
- **`google-auth-library` `GoogleAuth` alone gets the token** - `googleapis` is not needed, and it works under `bun --bun`.
- **Short rows omit trailing blanks** - fall back to `""` per missing index when zipping against the header.
- **Trim header keys** - one tab can carry `"Brand Name "` where a sibling has `"Brand Name"`.

## Postgres limits

- **The bind-parameter cliff is 65535** - the count is an Int16; `pg` sends 65536 as zero with no client error.
- **Unbounded `pg_wal` has three causes** - a failing archiver, an unconsumed replication slot, or `wal_keep_size`. Write volume alone never causes it.
- **An insert with no matching partition fails the whole statement**, not the row.

## DuckDB behaviour

- **`generate_subscripts` beside a FROM `unnest` is a cartesian product** - it returns elements times positions, with no error. Use `WITH ORDINALITY`:

```sql
SELECT t.id, u.item, u.ord
FROM t, unnest(t.items) WITH ORDINALITY AS u(item, ord);
```
