---
name: issue-authoring
description: Author or revise a tasks-mcp issue — the brief and contract that render as its GitHub issue body, for a task or a roadmap TARGET. Use whenever creating (add_task / add_target), editing (amend_task / edit_task), or reviewing an issue: a Problem / Expected solution / What to account for body a builder can act on COLD, every claim validateable, every reference complete, the implementation delegated to the builder.
---

# issue-authoring — task issues a builder can act on cold

A task issue is picked up by a builder who has **none** of your context. It must carry the whole
reasoning by itself: what's wrong, what "done" looks like, and what to watch — with **every claim
checkable** and the **how left to the builder**.

tasks-mcp renders a task's `brief` and `contract` as the issue body in three sections. Write to those:

| Section | Field | Holds |
| --- | --- | --- |
| **Problem** | `brief` (lead) | what happens today, the gap in it, and why the gap matters |
| **Expected solution** | `brief` (rest) | the target surface + an end-to-end example (input → output **shape**) — never the implementation |
| **What to account for** | `contract` | the definition of done, the constraints, the open questions — each validateable |

## A TARGET's brief is a different document

A target is a roadmap row, not work: it is never dispatched and nothing ever builds it, so it carries a
`brief` and **no `contract`** (tasks-mcp refuses `contract`, `scope`, `tier`, `qa` and `stage` on one).
Its brief answers one question — **why is this worth building, and now** — in a paragraph:

- **The problem at product altitude**, not code altitude: what a user or the project cannot do today, or
  pays for repeatedly. Name the cost.
- **Why now**: what changed, what it unblocks, or what it stops costing. A target with no "now" is a
  someday, and a someday is not a roadmap row.
- **Never the implementation, and never a task list.** The spec lives in the tasks under it, and the
  graph derives which tasks those are — writing them into the brief creates a second, staler copy.

`add_target` refuses a target with no brief. That is deliberate: if the why will not go into a
paragraph, the item is not a target yet. File it as a task, or leave it out.

## Principle

**Every sentence earns its place; every claim is checkable; the implementation is the builder's.** Two
failure modes point opposite ways and fail the same test. A wall of undefined jargon and forensics —
nothing is actionable. A bare one-liner — nothing is buildable. The test both fail: *could a builder
who has never seen this pick it up, verify each claim independently, and know when they are done?*

## Problem — build up, don't drop into jargon

- **Open where a cold reader can follow, then narrow to the exact gap.** Define every domain term inline
  the first time it appears — what a _sink_ / _appender_ / _WAP transaction_ IS, in a few words. A term
  that can't earn a short definition gets cut, not left dangling.
- **Current behaviour first, then the gap.** Say what happens _today_ before you name what's missing.
- **Every claim carries its _why_ — the "so what".** State the fact and what breaks without it: "never
  durably captured" → "so a rejected row is silently lost".

## Expected solution — show the shape, delegate the how

Show the **end-to-end surface**, not the implementation:

1. The top-level call the user or builder will write.
2. **Input** and **Output** as real fenced blocks — at minimum the output _shape_ (fields, types),
   valid and copyable, no ellipsis.
3. Stop there. The builder picks the implementation. If you catch yourself naming functions, files, or
   step-by-step how-to, cut it — that is the builder's job, and code review's.

```ts
// what "done" looks like from OUTSIDE — the builder fills in the how
validate(rows, { strategy: quarantine({ into: model.staging() }) })
```

Input:

```json
[{ "id": 1, "email": "a@x" }, { "id": 2, "email": "nope" }]
```

Output (shape — real fields, types stand in for values the builder produces):

```json
{
  "accepted": [{ "id": 1 }],
  "quarantined": { "table": "staging.rejects", "rows": [{ "id": 2, "reason": "<string>" }] }
}
```

## What to account for — three buckets, never a forensic dump

The `contract` is where a draft rots into a pile of half-explained facts. Split it into three, and make
every line checkable:

- **Definition of done** — the acceptance criteria, each a **check a builder can run**. The builder
  turns these into a failing test. _"300k rows appended inside BEGIN (past DuckDB's 204,800-row
  auto-commit threshold) then rolled back → `count(*)` is 0, on a lake table and a same-transaction
  TEMP table."_ Concrete, checkable — keep it.
- **Constraints to respect** — a fact that shapes the build, each with its **"so what"**. _"the appender
  writes positionally and `columnType(i)` returns no names — so resolve target column order via
  `DESCRIBE` / `duckdb_columns()`, or columns land shuffled."_ A constraint with no consequence is
  trivia; cut it.
- **Open questions / spikes** — anything unverified, flagged as **settle first**, never asserted as
  fact. _"the row claims 'no engine change' — unverified and likely wrong (nested BEGIN differs across
  engines); spike the transaction shape before costing."_

Two hard rules for this section:

- **Every claim is validateable — and never gospel.** Assert a number ("6.5× @10k rows") only with the
  way to reproduce it: **where the benchmark lives / how to run it.** A figure a builder must take on
  faith is cut, or becomes a _"verify X"_ task of its own.
- **No dangling references.** "Pinned `@duckdb/node-api@1.5.4-r.1` exposes it" — exposes _what_? A
  `file:line` cited with no reason — _why does it matter_? Complete the reference or drop it. And keep
  **forensics/provenance out of the body** ("was audit row D2", "benchmarked 2026-08-11") — those go in
  the task's **trail** (a comment), never the issue.

## Checklist

- [ ] A cold reader follows the Problem with no prior context; every term is defined inline.
- [ ] Every claim states its _why_; every asserted fact or number says **how to verify it**.
- [ ] An end-to-end example with an **Input** and an **Output shape**; no implementation is prescribed.
- [ ] "What to account for" splits into **definition of done** (checkable) / **constraints** (each with
      a consequence) / **open questions** (flagged, not asserted).
- [ ] No dangling references; no forensics in the body (those go in the trail).
- [ ] Deletion test: every sentence, removed, would lose reasoning — otherwise cut it.

## Worked example — before / after

**Before** — a "What to account for" that is really a forensic dump; a builder can't act on it or check
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

**After** — split, each line checkable, the how left open (values illustrative):

```text
## Definition of done
- Rollback holds past the auto-commit boundary: append 300k rows inside BEGIN (DuckDB auto-commits
  every 204,800 rows), roll back → count(*) = 0, on a lake table AND a same-transaction TEMP table.
- Transport is covered, not just row count: today the only loader-touching conformance case checks
  landed count (sql-family-cases.ts:603-619), so it can't catch a transport regression — add a case
  that asserts the transport path.

## Constraints to respect
- The appender writes POSITIONALLY and columnType(i) returns no names, so resolve target column order
  via DESCRIBE / duckdb_columns() first — else columns land shuffled. (staging adds __laygo_group;
  direct load stamps _laygo_batch_id.)
- Use @duckdb/node-api@1.5.4-r.1 (pinned): it exposes the appender's transaction binding; drive it
  through the connection's own transaction context, not a fresh connection.
- Keep the 65535-parameter split — it is NOT the bottleneck; removing it is slower (7488 ms unsplit
  vs 4549 ms split @200k, reproducible via <bench path>).

## Open questions
- (none — shape is settled) OR: spike <X> before costing, because <Y>.
```

The perf numbers move to the Problem's _why_ (with a pointer to the benchmark so a builder can rerun
it), or to the trail if they are just history. "Was audit row D2" is gone — provenance lives in the
trail, not the body.
