# The product docs - the canonical shape of the five files

Product memory is five prose Markdown docs in `.claude/`. This file fixes their shape. Output: the five
files below, each authored from its skeleton.

```
.claude/
├── product.md
├── roadmap.md
├── architecture.md
├── lessons.md
├── lessons/
│   └── <YYYY-MM-DD>-<slug>.md
└── examples.md
```

**The tree is fixed.** Add no memory file. Rename none. There is no `CONTEXT.md`, and there are no ADRs.
`lessons/` is the one directory, and it holds one file per lesson.

## Living docs, one archive

`product.md`, `roadmap.md` and `architecture.md` are **living, and pruned on every write.** When a
decision makes prose stale, delete it. A pivot worth remembering becomes a lesson under `lessons/`, and
`lessons.md` indexes it. That pair is the only append-only memory.

## `.claude/product.md` - North Star and Language

The smallest doc. Two sections, nothing else:

1. **North Star: the pitch, then the wedge.** The elevator-pitch paragraph first, in plain language and
   with no technical example. Then high-level examples, one per strong side. Then the **wedge**: the
   precise thing this does that the alternatives do not.
2. **Language: the glossary.** Every canonical term, one line each: the definition, then the rejected
   synonyms it replaces. Current vocabulary only; a dead term is deleted, or its story goes to
   a lesson. Pin a term here **before** using it in the other docs.

## `.claude/roadmap.md` - why each target is worth building

⚠ **Status, dependencies and the task list are derived from the task graph.** Hand-write none of the
three here. The `tasks` MCP tool `roadmap` `{ project }` answers where a target stands.

A row is a **target, a link to its issue, and a paragraph.** Nothing else.

- **The paragraph is the why** - what problem this solves, and what makes it worth building *now*. The
  spec lives in the tasks.
- **File the target first**, then write its paragraph.
- **High altitude only.** A bug, a spike or a task-shaped item is filed as a task instead.
- **Shipped targets compress.** Leave at most a line: the arc goes to a lesson and the mechanism to
  `architecture.md`. A killed target keeps its reasoning in a lesson.

## `.claude/architecture.md` - the target program, then its machinery

One prose doc. Sections, top to bottom:

1. **What we're building towards** - the canonical top-level call, end to end, in one fenced block with
   `Input:` and `Output:` examples. The JSON rules live in `pr-description.md`.
2. **The machinery** - one `##` section per part: shape, what it stacks on, flow, branch model, guards.
3. **The seams** - one entry per seam: what the parent supplies, and what the child returns.
4. **Feature index** - one entry per feature, knob, limitation or pattern: what a user uses or works
   around, then how it works.

Design rationale for a mechanism that no longer exists goes to a lesson.

## `.claude/lessons.md` and `.claude/lessons/` - the index and the archive

**`lessons.md` is an index, and it holds no lesson text.** One line per lesson, newest first, grouped
under the three kinds: communication that broke down, an assumption that broke, and a killed approach.

**`lessons/` holds one file per lesson**, named `<YYYY-MM-DD>-<kebab-slug>.md`, so the folder sorts by
itself. A lesson is written for a reader who has your repository and nothing else. It carries its own
context, its own example, and its own real output.

⚠ **The `retro` skill owns both files, and nothing else writes them.** It runs at the end of PLANNING,
after the documentation layer and before a build's merge, and on the replan exit. Read
`${CLAUDE_PLUGIN_ROOT}/skills/retro/SKILL.md` for the five-section shape, the repeat rule and the
landing rules. A feature's story belongs in its PR and its roadmap entry. Either path's absence means a
first cycle, not an error.

## `.claude/examples.md` - the canonical examples

Every worked example lives here, **named**, one canonical per concept (MECE). Each `##` section holds
the call with its `Input:` and `Output:`, in real observed values. An example that overlaps an existing
one evolves that one instead.

## Skeletons - copy, fill, delete the placeholders

````markdown
<!-- product.md -->
# <project> - Product

## North Star

<pitch paragraph; strong-side examples; then the Wedge: the precise thing alternatives do not do>

## Language

- **<term>** - <one-line definition>. (replaces: <rejected synonyms>)
````

````markdown
<!-- roadmap.md -->
# <project> - Roadmap

## Live

### <target, nameable in one sentence>

[#<issue>](<url>)

<one paragraph: the problem this solves, and what makes it worth building NOW>

## Shipped

<one numbered line per shipped target: its name, then the version that shipped it>
````

One filled Live entry, for the shape of the paragraph:

````markdown
### Quarantine bad rows instead of failing the load

[#128](https://github.com/acme/pipeline/issues/128)

One malformed row fails the whole nightly load today. An operator reruns the job by hand, and the
warehouse stays stale until they do. Quarantining the rejects into a staging table lands the good rows on
time and leaves each reject where an analyst can query it. The staging model shipped last month, so the
destination already exists.
````

````markdown
<!-- architecture.md -->
# <project> - Architecture

## What we're building towards

<the target program: a fenced block, then its Input: and Output: examples>

## <machinery section>

<one `##` per part>

## The seams (protocols)

- **<parent> → <child>.** In: <what the parent supplies>. Out: <what the child returns>.

## Feature index

- **<name>** - <feature | knob | limitation | pattern>. <what it is, then how it works>
````

````markdown
<!-- examples.md -->
# <project> - Examples

## <example name>

Input - <the call or the data, in real values>:

```json
<the call>
```

Output - <the observed result, or the expected result marked expected>:

```json
<the result>
```
````

````markdown
<!-- lessons.md -->
# <project> - Lessons

One file per lesson under `.claude/lessons/`, newest first. A line carries the date, the stage that
wrote it, and the pattern in one clause. Open a file when its clause names your situation.

## Communication that broke down

- [<YYYY-MM-DD> · <STAGE>](lessons/<file>.md) - <the pattern in one clause>. ×<N>

## Assumptions that broke

## Killed approaches
````

````markdown
<!-- lessons/<YYYY-MM-DD>-<slug>.md -->
# <the pattern, as a sentence a reader matches against their own situation>

**Stage:** <PLANNING | BUILD> · **Filed:** <YYYY-MM-DD> · **Shipped in:** <version> (<PR>)

## 1. The problem

<the context, for a reader who has never opened this repository; then the BEFORE block>

## 2. What was expected

## 3. What actually happened

## 4. Where it showed, and whether it repeats

## 5. How to prevent it

<the rule in bold, as an action at a named moment; then the AFTER block, same shape as BEFORE>

## References

<numbered, only where the session read official documentation>
````

One filled index line and the lesson it points at:

````markdown
- [2026-08-11 · BUILD](lessons/2026-08-11-a-whole-batch-failed-on-one-bad-row.md) - a loader treated one
  malformed row as a batch-level failure, because the reject had nowhere to land. ×2
````

````markdown
# A whole batch failed on one bad row, because a reject had nowhere to land

**Stage:** BUILD · **Filed:** 2026-08-11 · **Shipped in:** 0.9.0 (#128)

## 1. The problem

`orders sync` loads a page of orders, then writes each row. `validate.ts` raised on the first row that
failed its schema, and the raise left the transaction rolled back:

```text
BEFORE - one bad row, no batch

fetchPage()      128 orders
  upsertOrder()  row 1..46   ok
  upsertOrder()  row 47      raise: placed_at is not a date
                             the transaction rolls back, and 0 rows land
```

## 2. What was expected

An operator reran the job by hand and expected the rerun to land the good rows. The same row failed it
again, so the warehouse stayed stale until someone edited the source data.

## 3. What actually happened

Input:

```bash
orders sync --since 2026-08-01
```

Output - stderr, on three consecutive nights:

```text
error: placed_at is not a date (row 47 of page 1)
upserted 0 rows into orders
```

## 4. Where it showed, and whether it repeats

1. `src/load/validate.ts:31` raised inside the write transaction, so a row-level fault took the batch.
2. The same shape shipped in the customer loader at 0.4.0, and it was patched there rather than fixed.
3. ×2. Both times a row-level fault had no destination, so the code promoted it to a batch-level one.

## 5. How to prevent it

**A row-level fault lands in a destination, and it never raises past its row.** Name that destination
before the loader is written, because a fault with nowhere to go becomes a batch failure by default.

```text
AFTER - one bad row, quarantined

fetchPage()      128 orders
  upsertOrder()  row 1..127  ok            127 rows land
  reject()       row 47      staging.rejects, with reason 'placed_at is not a date'
```
````

## The task filing shape

A task is filed with `add_task`:

```json
{
  "project": "<absolute repo path>",
  "id": "<kebab-slug>-<stamp>",
  "title": "<one line>",
  "deps": [],
  "scope": ["<folder the task may work in>"],
  "qa": "subagent",
  "spec": "settled",
  "brief": "<Problem, then Expected solution>",
  "contract": "<What to account for>"
}
```

**The `brief` and the `contract` are the GitHub issue body.** Draft and revise both from
`${CLAUDE_PLUGIN_ROOT}/skills/issue-authoring/SKILL.md`. It owns what goes in them. This skeleton fixes the
shape alone.

- `qa`: `skip` | `inline` | `subagent` - how much review the work earns. Default `subagent`.
- `spec`: `drafting` while the graph forms, `settled` once the `contract` holds, `replan` on a gap.

**Write `qa` into the filing**, explicitly, on every task.
