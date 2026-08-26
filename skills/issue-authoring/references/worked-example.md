# A worked example, and the server's gotchas

Open this to calibrate a contract you are unsure of, or when a tasks-mcp write does not land the
way you expected. `SKILL.md` holds the rules themselves.

## Worked example - before and after

**Before**, a "What to account for" that is really a forensic dump. A builder cannot act on it or check
it:

```text
1. Benchmarked 2026-08-11 against a reproduction of laygo's transport: 6.5x @10k, 9.3x @200k...
2. Rollback works: 300k rows appended inside BEGIN past DuckDB's 204,800-row auto-commit threshold...
3. The 65535-parameter split is NOT the cost (removing it is worse: 7488 ms unsplit vs 4549 ms split).
4. The appender appends positionally and columnType(i) yields no names, so resolve via DESCRIBE...
5. Pinned @duckdb/node-api@1.5.4-r.1 exposes it; use the connection's transaction context.
6. The only loader-touching conformance case asserts landed row count, not transport (…:603-619).
Was audit row D2.
```

**After**, split, each case numbered and checkable, the how left open (values illustrative):

```text
## Definition of done
1. Rollback holds past the auto-commit boundary: append 300k rows inside BEGIN (DuckDB auto-commits
   every 204,800 rows), roll back → count(*) = 0, on a lake table AND a same-transaction TEMP table.
   (examples.md: rollback-past-auto-commit, verbatim)
2. Transport is covered, not just row count: today the only loader-touching conformance case checks
   landed count (sql-family-cases.ts:603-619), so it cannot catch a transport regression. Add a case
   that asserts the transport path.

## Constraints to respect
- The appender writes POSITIONALLY and columnType(i) returns no names, so resolve target column order
  via DESCRIBE or duckdb_columns() first, else columns land shuffled. (staging adds __laygo_group;
  direct load stamps _laygo_batch_id.)
- Use @duckdb/node-api@1.5.4-r.1 (pinned): it exposes the appender's transaction binding. Drive it
  through the connection's own transaction context, not a fresh connection.
- Keep the 65535-parameter split. It is NOT the bottleneck; removing it is slower (7488 ms unsplit
  vs 4549 ms split @200k, reproducible via <bench path>).

## Open questions
- (none - shape is settled) OR: spike <X> before costing, because <Y>.
```

The perf numbers move to the Problem's _why_, with a pointer to the benchmark so a builder can rerun it.
They move to the trail instead when they are just history. "Was audit row D2" is gone: provenance lives in the
trail, not the body.

## Gotchas

Server behaviour that an author hits, verified against tasks-mcp. Append an item on every new one.

1. **A hand edit to the rendered body** - dropped on the next write, because the server regenerates
   everything between its `<!-- outputty:spec -->` sentinels. Edit the field, and the body follows.
   Prose added BELOW the closing sentinel survives every write, so a human note is safe there.
2. **A target with no brief** - the `add_target` call refuses it, and promoting a task to a target
   checks the same. Write the why first. The check runs on create and on promotion.
3. **A build field on a target** - absent from `add_target`'s schema, so the call succeeds and sets
   nothing. Clear those fields before you promote a task, or file the row as a task instead.
4. **`amend_task`** - reaches `brief` and `scope`, and nothing else. Its `brief` replaces the whole
   field. Read the current brief with `get_task` and the thread with `get_trail` first, then carry
   forward every part you are not changing. Its `scope` only widens: it appends a folder, and it errors
   when the task already covers that folder.
5. **A `contract`, `spec` or `qa` passed to `amend_task`** - absent from its schema, so the call
   sets nothing. Revise all four with `edit_task`, the one tool that reaches every field and narrows
   `scope`.
6. **`amend_task` on a done task** - refused outright. Use `edit_task`, which edits a task that is
   already done.
