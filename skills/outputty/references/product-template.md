# The product docs (canonical): five prose Markdown docs, loaded by role

Product memory is **five prose Markdown docs, read whole**. This file is their canonical shape. SPEC,
`bootstrap`, and the merge step write them **from here**. The task graph lives in the `tasks` MCP server
(synced to GitHub Issues), not here.

**The file tree is fixed.** Add no memory files. Rename none. Author each from its skeleton below.

```
.claude/
├── product.md        # North Star + Language — every session reads this
├── roadmap.md        # where things stand: one entry per target, with status
├── architecture.md   # the target surface, then its machinery
├── lessons.md        # the past: chronology + abandoned approaches (append-only)
└── examples.md       # the canonical worked examples, named
```

**Splitting saves nothing on its own: five docs read together cost the same as one.** The point is that
different work needs a different slice, so each session reads only its slice.

| Doc | Holds | Who reads it |
| --- | --- | --- |
| `product.md` | North Star + Language | **every session** (the block's read-first rule) |
| `roadmap.md` | status + targets | SPEC, PLAN, the before-dispatch staleness check, master QA |
| `architecture.md` | target surface + machinery | SPEC (technical pass), PLAN, BUILD, master QA |
| `lessons.md` | chronology + abandoned approaches | grill's ledger, repeat work, master QA when stuck |
| `examples.md` | the canonical worked examples | anyone about to show or author an example |

Every doc is small enough to read whole. Read it whole; for the large `lessons.md`, `grep` it by path
or title when you want one entry.

## Living docs, one archive

`product.md`, `roadmap.md`, and `architecture.md` are **living: pruned, never append-only.** When a
decision makes prose stale, delete it. A real pivot worth remembering goes to `lessons.md`, the **only
append-only doc**, written at the merge step. It exists so the living docs stay lean: superseded detail
moves there instead of lingering.

## The hard verification rule (non-negotiable)

**Every claim about already-shipped behaviour, in any doc, is backed by a run in the codebase. No
guessing, no recall.**

- **Shipped ⇒ run it.** Before writing what an existing API/command/flag does, run it and use the
  *actual* result. Prose describing shipped behaviour that was not run is a defect. A ✅ in any doc
  carries the obligation: it means "I ran this, here is real output".
- **Not shipped yet ⇒ mark it expected.** Never assert it as shipped.

## `.claude/product.md` — North Star + Language

Small on purpose: **every** session reads it, so every word costs on every session.

1. **North Star: the pitch + the wedge.** The elevator-pitch first paragraph in plain language (no
   technical examples), then high-level examples one per strong side, then the precise **wedge**: the
   specific thing this does that the alternatives do not. The anchor the whole flow drift-checks
   against.
2. **Language: the glossary.** Every canonical term, one line each: definition + the rejected synonyms
   it replaces. Current vocabulary only; a dead term is deleted (or its story goes to `lessons.md`). Pin
   a term here **before** using it in the other docs.

## `.claude/roadmap.md` — WHY each target is worth building

**The roadmap is two things now, and this file is only one of them.** A target is a node in the task
graph (`add_target`), so its status, its dependencies and its task list are all **derived** — call the
`tasks` MCP tool `roadmap` `{ project }` for where things stand. This file holds the half nothing
derives: **why** each target is on the list at all.

A row is a **target, a link to its issue, and a paragraph.** Nothing else.

- **Never hand-write a status, a percentage, or a dependency here.** The moment you do there are two
  answers to the same question, and the hand-written one is the one that goes stale. The graph already
  knows.
- **The paragraph is the WHY:** what problem this solves, and what makes it worth building *now*. Not a
  spec — the spec belongs to the tasks under the target, and their briefs carry it.
- **File the target first, then write its paragraph.** `add_target { project, id, title, brief }` refuses
  a row with no brief, which is the point: an idea you cannot justify in a paragraph is not a roadmap
  row. Park it in the session or file it as a task; do not open a placeholder target for it.
- **High altitude only — never task tracking.** A bug, spike, or task-shaped item goes to `add_task
  { target }`; the task graph never lives here.
- **Shipped targets compress.** Once a target has shipped, its arc belongs in `lessons.md` and its
  mechanism in `architecture.md`; leave at most a line here. Killed targets keep their reasoning in
  `lessons.md`.

## `.claude/architecture.md` — the target surface, then its machinery

One prose doc, read whole. Sections, top to bottom:

1. **What we're building towards** — the canonical top-level call, end to end, in one fenced block with
   `Input:`/`Output:` examples (the JSON rules live in `pr-description.md`). PLAN pins the last layer to
   it; master QA runs it; every PR write snapshots it.
2. **The machinery** — one `##` section per part (shape, what it stacks on, flow, branch model,
   guards, …). Each concept has **one home**; describe it once. A flow diagram is **inline Mermaid**
   (never a separate `.mmd`, never SVG — product memory is agent-consumed).
3. **The seams** — the parent-supplies / child-returns protocols, one per seam. PLAN derives task
   `contract`s from these.
4. **Feature index** — one table row per feature, knob, limitation, or pattern: what a user uses or
   works around, and how it works.

Send design rationale for a mechanism that **no longer exists** to `lessons.md`.

## `.claude/lessons.md` — the archive (append-only)

The chronology, newest first, one entry per pivot, plus abandoned approaches and what killed each. Each
entry is a **bold-title-led paragraph** (`**Title (version).**`) with a trailing `Files:` line naming
the paths it touched. A feature's story belongs in its PR and its roadmap entry, never here. **Its
absence means a first cycle, not an error.**

## `.claude/examples.md` — the canonical examples, reused everywhere

Every worked example lives here, **named**, one canonical per concept (MECE). Each `##` section holds
the call and its `Input:`/`Output:` per the JSON rules (real observed values). Pin a new example here
**first**; if it overlaps an existing one, evolve that one.

## The task graph — in the `tasks` MCP server, not a repo file

The graph lives in the `tasks` MCP server (one task per GitHub Issue), authored and read through its
tools. A task carries `deps`, a `scope` folder, `tier`, `qa`, `spec`, and its **trail** (a thread of
`decision`/`action`/`note` entries). **PLAN authors the graph** from the skeleton below; `audit` files
task-shaped picks with `add_task`; the merge step closes each task.

## Skeletons (copy, fill, delete the guidance)

````markdown
<!-- product.md — North Star + Language only. Keep it small. Every ✅ claim is verified by a run. -->
# <project> — Product

## North Star

<pitch paragraph; strong-side examples; then the Wedge: the precise thing alternatives don't do>

## Language

- **<term>** - <one-line definition>. (replaces: <rejected synonyms>)
````

````markdown
<!-- roadmap.md — WHY each target is worth building. Status, deps and tasks are DERIVED: call the
     `tasks` MCP tool `roadmap` for those. A row is a target, a link to its issue, and a paragraph. -->
# <project> — Roadmap

## Where we are

<one paragraph: the current version and what is in flight>

## Live

### <target, nameable in one sentence>

[#<issue>](<url>)

<one paragraph: the problem this solves, and what makes it worth building NOW. Never a status, never a
dependency, never a task list — all three are derived from the graph.>

## Shipped

<a compact table: target | version. The mechanism of each lives in architecture.md; the arc that
produced it, and the approaches dropped on the way, in lessons.md.>
````

````markdown
<!-- architecture.md — the target surface, then the machinery. Mermaid INLINE, never SVG. -->
# <project> — Architecture

## What we're building towards

<the finished surface, a fenced block + Input:/Output: examples>

## <machinery section>

<one `##` per part; a flow diagram is inline Mermaid>

## The seams (protocols)

- **<parent> → <child>.** In: <what the parent supplies>. Out: <what the child returns>.

## Feature index

| Entry | Kind | What it is, and how it works |
| --- | --- | --- |
| <name> | feature \| knob \| limitation \| pattern | <what, then how> |
````

````markdown
<!-- examples.md — canonical worked examples, one per concept. Reused verbatim; pin new ones here first. -->
# <project> — Examples

## <example name>

Input - <the call / data, real values>:

```json
<the call>
```

Output - <the observed result; real if ✅, marked-expected otherwise>:

```json
<the result>
```
````

````markdown
<!-- lessons.md — append-only archive: discoveries, bug fixes, user directions, experiments. Never features. -->
# <project> — Lessons & chronology

## Chronology (newest first)

**<the pivot, in one line> (<version>).** <beginning state · problem · end state>.

Files: `<the paths it touched>`.
````

Author the task graph in the `tasks` MCP server, not as a file. PLAN files each task with `add_task`:

```json
{
  "project": "<repo>",
  "id": "<kebab-slug>",
  "title": "<one line>",
  "deps": [],
  "scope": ["<folder the task may work in>"],
  "tier": 3,
  "qa": "subagent",
  "spec": "settled",
  "brief": "<end state, the verified file:line sites, what is out of scope>",
  "contract": "<what this task supplies to its dependents>"
}
```

- `tier`: 1-4, how much model the task needs (1 haiku … 4 fable). Default 3.
- `qa`: `skip` | `inline` | `subagent` — how much review the work earns. Default `subagent`.
- `spec`: `drafting` while the graph forms, `settled` once the `contract` holds, `replan` on a gap.
- The **trail** is the task's comment thread — append `decision`/`action`/`note` with `append_trail`,
  read with `get_trail`.

**Author `tier` and `qa` at PLAN, never in the build session.** Both default safely, so absence never
skips a step. Still write them, so the model and review are explicit.
