# The product docs - the canonical shape of the five files

Product memory is five prose Markdown docs in `.claude/`. This file fixes their shape. Output: the five
files below, each authored from its skeleton.

```
.claude/
├── product.md
├── roadmap.md
├── architecture.md
├── lessons.md
└── examples.md
```

**The tree is fixed.** Add no memory file. Rename none. There is no `CONTEXT.md`, and there are no ADRs.

## Living docs, one archive

`product.md`, `roadmap.md` and `architecture.md` are **living: pruned, never append-only.** When a
decision makes prose stale, delete it. A pivot worth remembering goes to `lessons.md`, the only
append-only doc.

## `.claude/product.md` - North Star and Language

The smallest doc. Two sections, nothing else:

1. **North Star: the pitch, then the wedge.** The elevator-pitch paragraph first, in plain language and
   with no technical example. Then high-level examples, one per strong side. Then the **wedge**: the
   precise thing this does that the alternatives do not.
2. **Language: the glossary.** Every canonical term, one line each: the definition, then the rejected
   synonyms it replaces. Current vocabulary only; a dead term is deleted, or its story goes to
   `lessons.md`. Pin a term here **before** using it in the other docs.

## `.claude/roadmap.md` - why each target is worth building

⚠ **Status, dependencies and the task list are derived from the task graph.** Hand-write none of the
three here. The `tasks` MCP tool `roadmap` `{ project }` answers where a target stands.

A row is a **target, a link to its issue, and a paragraph.** Nothing else.

- **The paragraph is the why** - what problem this solves, and what makes it worth building *now*. Never
  a spec.
- **File the target first**, then write its paragraph.
- **High altitude only.** A bug, a spike or a task-shaped item is never a row here.
- **Shipped targets compress.** Leave at most a line: the arc goes to `lessons.md` and the mechanism to
  `architecture.md`. A killed target keeps its reasoning in `lessons.md`.

## `.claude/architecture.md` - the target program, then its machinery

One prose doc. Sections, top to bottom:

1. **What we're building towards** - the canonical top-level call, end to end, in one fenced block with
   `Input:` and `Output:` examples. The JSON rules live in `pr-description.md`.
2. **The machinery** - one `##` section per part: shape, what it stacks on, flow, branch model, guards.
3. **The seams** - one entry per seam: what the parent supplies, and what the child returns.
4. **Feature index** - one entry per feature, knob, limitation or pattern: what a user uses or works
   around, then how it works.

Design rationale for a mechanism that no longer exists goes to `lessons.md`.

## `.claude/lessons.md` - the archive, append-only

The chronology, newest first, one entry per pivot. Then the abandoned approaches, and what killed each.
An entry is a bold-title-led paragraph, `**Title (version).**`, with a trailing `Files:` line naming the
paths it touched. A feature's story belongs in its PR and its roadmap entry, never here. The file's
absence means a first cycle, not an error.

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
# <project> - Lessons & chronology

## Chronology (newest first)

**<the pivot, in one line> (<version>).** <beginning state · problem · end state>.

Files: `<the paths it touched>`.

## Abandoned approaches

### <the shape that was dropped>

- **Why it was tried** - <what it promised>
- **Why it did not work** - <the run, measurement or review that killed it>
- **When it becomes viable again** - <the blocker that would have to lift, or `never, fundamental`>
````

One filled chronology entry and one filled abandoned approach:

````markdown
**Rejected rows land in staging, not on the floor (0.9.0).** The loader failed a whole batch on one bad
row, so an operator reran it by hand. Rejects now land in `staging.rejects` with a reason column, and the
good rows land on time.

Files: `src/load/validate.ts`, `src/model/staging.ts`.

### A dead-letter JSONL file per run

- **Why it was tried** - it needed no schema and no migration
- **Why it did not work** - no reject could be joined back to its source row, so every triage started
  with a grep
- **When it becomes viable again** - when rejects carry a stable row id
````

## The task filing shape

A task is filed with `add_task`:

```json
{
  "project": "<absolute repo path>",
  "id": "<kebab-slug>",
  "title": "<one line>",
  "deps": [],
  "scope": ["<folder the task may work in>"],
  "tier": 3,
  "qa": "subagent",
  "spec": "settled",
  "brief": "<Problem, then Expected solution>",
  "contract": "<What to account for>"
}
```

**The `brief` and the `contract` are the GitHub issue body.** Draft and revise both from
`${CLAUDE_PLUGIN_ROOT}/skills/issue-authoring/SKILL.md`. It owns what goes in them. This skeleton fixes the
shape, never the semantics.

- `tier`: 1-4, how much model the task needs (1 haiku … 4 fable). Default 3.
- `qa`: `skip` | `inline` | `subagent` - how much review the work earns. Default `subagent`.
- `spec`: `drafting` while the graph forms, `settled` once the `contract` holds, `replan` on a gap.

**Write `tier` and `qa` into the filing.** Never leave either to its default.
