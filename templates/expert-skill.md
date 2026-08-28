---
name: <domain>
description: <one tool, vendor or discipline - dlt, dbt, duckdb, snowflake, dimensional-modelling - and when a session needs it, in the words a ticket would use. e.g. "DuckDB: the engine's SQL dialect, transactions, appender and extension behaviour. Use when a ticket reads or writes DuckDB directly.">
---

# <domain>

<!--
Self-contained for quick judgements. Every line below is one thing a session can act on without opening anything else.
The explanation behind a line (why, the measurement, the worked case, the long form) goes under references/, and the line points at it.
A few hundred lines at most; this body stays in context once loaded.
Generic to the domain: no reference to this repo's code or a current ticket.
A planning session that disproves or extends a line updates this file. A loading session treats every line as a prior to re-verify against its source.
-->

Validated: <YYYY-MM-DD, the last planning session that checked the claims it used>

## Patterns

- **<pattern>** - <what it is for, and what makes you pick it over its neighbour>. [<source>]

## Rules

- <one line: the moment, the action>. [<source>]

## Traps

- <what goes wrong, and how it shows>. [<source>]

## Disproven

<!-- Claims this skill once made that a session overturned; kept so they are not re-learned. -->

- ~~<the old claim>~~ - disproven <YYYY-MM-DD>: <what contradicted it>. [<source>]

## References

<!--
The explanations, read on demand: why each line above holds, the measurements, the worked cases, the cached sources by version or date.
One line per file under references/: what it holds and its version or fetch date.
-->

- `references/<file>.md` - <what it holds>, <version or fetched YYYY-MM-DD>
