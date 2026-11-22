---
name: data-engineering
description: Lists the load, staging, concurrency and cross-engine traps a data pipeline hits, each with its fix - idempotent or retried loads, staging tables, MERGE/upsert under concurrency, history and deletions, partitioning and file pruning, hashing across engines, partitioned aggregation, Google Sheets extraction. Use when loading data into a warehouse or database or writing an ETL on Postgres, DuckDB, BigQuery, Redshift, Snowflake, Databricks, dbt, SQLMesh or Airbyte.
---

# data-engineering

## BigQuery loads

### Do

- Retry a load with WRITE_TRUNCATE.
- Stay within 1,500 load jobs per table per day.

## Redshift loads

### Do

- Use COPY JOB to load each file once, outside a transaction block, with no manifest.

### Don't

- Don't expect a plain COPY to dedup or skip a file.

## Databricks and Snowflake loads

### Do

- Load a Snowflake file older than 64 days with `LOAD_UNCERTAIN_FILES = TRUE` or `FORCE`, and dedup after.

### Don't

- Don't expect COPY INTO to reload a Databricks file it already loaded.
- Don't expect Snowflake COPY to load a file whose load status is UNCERTAIN.

## Postgres bulk writes

### Do

- Buffer encoded text into large pushes with `pg-copy-streams`.
- Use one `INSERT ... SELECT FROM unnest($1::type[], ...)` array-bind when each row would be one push.
- Reuse one staging table with `ON COMMIT DELETE ROWS`.
- Index the join key of a staging table and run `ANALYZE` before `UPDATE ... FROM staging`.
- Retry idempotently.
- Create a new partitioned table, `ATTACH PARTITION`, and swap.
- Send fewer than 65535 bind parameters per statement.

### Don't

- Don't push one row per call with `pg-copy-streams`.
- Don't create and drop a TEMP table per batch.
- Don't use 2PC.
- Don't run `ALTER TABLE ... PARTITION BY`.

## DuckDB

### Do

- Measure the Appender against an unnest array-bind INSERT in the real pipeline.
- Commit a cross-engine handoff on the target alone.
- Create a TEMP table on the connection that reads it.
- Percent-encode Hive path values, and write `__HIVE_DEFAULT_PARTITION__` for an absent one.
- Cast a Hive path value back from text.
- Prove pruning with `EXPLAIN ANALYZE`: assert `File Filters` and `Scanning Files: n/m`.
- Order inserts by the filter column so zonemaps prune.
- Hash with `md5` or `sha256`.
- Use `WITH ORDINALITY` for element positions: [references/unnest-ordinality.sql](references/unnest-ordinality.sql)

### Don't

- Don't write to several attached databases in one transaction.
- Don't read a TEMP table from another connection.
- Don't use `generate_subscripts` beside a FROM `unnest`.
- Don't store a `hash()` result across versions.
- Don't look for `PARTITION BY` on a native table.

## MERGE and upsert

### Do

- Put a `UNIQUE` index under a MERGE with `WHEN NOT MATCHED THEN INSERT`.
- Use Postgres 17 `RETURNING merge_action()` for a one-pass SCD2 close-and-insert.
- Set dbt `on_schema_change: append_new_columns`.

### Don't

- Don't MERGE without a `UNIQUE` constraint under concurrent writers.
- Don't expect `RETURNING` from a Postgres 16 MERGE.
- Don't set dbt `on_schema_change: sync_all_columns`.

## History and deletions

### Do

- Filter late rows inside the extraction's own filter.
- Detect an upstream delete by a full-extract diff or a delete marker.
- Declare a quarantine sink's order against the main write, or give it its own transaction.
- Run a SQLMesh audit under `plan`.

### Don't

- Don't expect a cursor to re-filter what extraction returns.
- Don't expect an upsert or delete-insert to remove a deleted key.
- Don't expect dbt `store_failures` to quarantine rows.
- Don't rely on a SQLMesh audit under `run`.

## Hashing across engines

### Do

- Build the hash input from JSON `->>` text.
- Prefix each value with its byte length before joining.
- Hash a `timestamp`.
- Build the JSON array with one engine's spacing.

### Don't

- Don't build a hash input from a typed column.
- Don't join values with `concat_ws`.
- Don't hash a `timestamptz`.
- Don't hash a boolean through two different casts.

## Partitioned aggregation

### Do

- Write the combine as its own function, apart from the fold: [references/fold-as-combine.ts](references/fold-as-combine.ts)
- Emit the empty-stream seed once, from the stage that sees the whole stream.

### Don't

- Don't reuse a fold as its combine when the partial's type equals the item's type.
- Don't give a non-identity seed to every partition.

## Google Sheets

### Do

- Request `valueRenderOption=UNFORMATTED_VALUE`.
- Read every tab in one `values:batchGet`, repeating `ranges`: [references/sheets-batch-get.txt](references/sheets-batch-get.txt)
- Get the token with `GoogleAuth` from `google-auth-library` alone.
- Fall back to `""` per missing index when zipping a short row against the header.
- Trim header keys.

### Don't

- Don't request `FORMATTED_VALUE`.
- Don't add `googleapis` for a token.

## Glossary

- **SCD2** - a table that keeps each version of a row with its validity range.
- **2PC** - two-phase commit: `PREPARE TRANSACTION`, then commit.
- **Zonemap** - the min and max of a column per block, which lets a scan skip blocks.
- **Fold** - a function that adds one item to an accumulator.
- **Combine** - a function that merges two partials.
- **Partial** - one partition's accumulator.
- **Seed** - the accumulator a fold starts from.
- **Delete-insert** - a write that deletes the keys of the extract, then inserts its rows.
- **Ghost row** - a row whose source row was deleted upstream.
- **Quarantine sink** - the table that receives rejected rows.
- **COPY JOB** - Redshift's COPY that tracks loaded files by filename.
- **WRITE_TRUNCATE** - BigQuery's load disposition that replaces the table's contents.
- **Hive path** - a file path with `key=value` folders, such as `year=2024/`.
