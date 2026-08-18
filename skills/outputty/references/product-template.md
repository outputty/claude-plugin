# The product docs (canonical) — five record sets, loaded by role

Product memory is **five YAML record sets**. `roadmap` and `architecture` each carry a sibling markdown
depth folder. This file is their canonical shape. SPEC, `bootstrap`, and the merge write them **from
here**. The task graph lives in the `tasks` MCP server (synced to GitHub Issues), not here.

**The file tree is fixed.** Add no memory files. Rename none. Author each file from its skeleton below.

```
.claude/
├── product.yaml              # North Star + Language — every session reads this
├── roadmap.yaml              # what we're building: one mini-spec record per target
├── roadmap/
│   └── <name>.md             # the full writeup of one shipped target
├── architecture.yaml         # what exists: the coverage index (+ target_program, protocols)
├── architecture/
│   └── <topic>.md            # depth: one self-contained topic file per area, Mermaid inline
├── lessons.yaml              # the past: discoveries, bug fixes, user directions, experiments
└── examples.yaml             # the canonical worked examples, named
```

**Migration.** A monolithic `product.yaml` splits at the next merge step. Move the sections. Leave a
one-line pointer per moved section at the top until the next cycle confirms nothing reads them there.

## Living docs, one archive

`product.yaml`, `roadmap.yaml`, and `architecture.yaml` are **living: prune them, never append only.**
Delete prose a decision makes stale. Send a real pivot to `lessons.yaml`, the **only append-only doc**,
written at the merge step.

## `.claude/product.yaml` — North Star + Language

Keep it small — **every** session reads it.

- **North Star: pitch + wedge.** The elevator-pitch paragraph, plain language, no technical examples.
  Then high-level examples, one per strong side. Then the **wedge**: the specific thing this does that
  alternatives do not.
- **Language: the glossary.** Each canonical term on one line: definition + the rejected synonyms it
  `replaces`. Current vocabulary only; delete a dead term.

## `.claude/roadmap.yaml` + `roadmap/<name>.md` — the targets

One record per **target you can name in one sentence**. Order rows so dependencies precede dependents.
Keep it readable whole without grepping.

- **Every row carries `summary`: a mini-spec.** A problem statement, a clear solution, plus an **e2e code
  snippet with example inputs and outputs**. Shipped row: **real observed** output. Open row: desired
  shape, marked. Killed row: the problem chased + proposed shape. Behaviour added, removed, or changed ⇒
  in/out examples required.
- **A shipped target closes clean:** status `✅`, a one-line `status_detail`, `doc` pointing at the
  writeup. **No notes accumulate on the row.**
- **High altitude only — target-level memory, never task tracking.** Send a bug, spike, debt item, or
  task-shaped work to the `tasks` MCP (`add_task`); the task graph never moves here.
- **Live rows carry a plan reference, not progress prose.** Link the task in the `tasks` MCP.
- **Killed rows stay.** Their reasoning lives in `lessons.yaml` and git.

## `.claude/architecture.yaml` — the coverage index, with depth in topic files

Two layers: a YAML **coverage index** and markdown **topic files**. Write **one index record per feature,
knob, limitation, and code pattern** (`kind: pattern`) — one per thing a user uses or works around.

1. **Target program first** (`target_program` prose): the canonical top-level call, end to end, one fenced
   block, with `Input:`/`Output:` examples (the JSON rules live in `pr-description.md`). PLAN pins the last
   layer to it, master QA runs it, every PR write snapshots it.
2. **The index** (`features` records): one per feature/knob/limitation/pattern — `name`, `kind`, `what`
   (plain-language), `how` (technical, summarized), `doc` (its topic file), `example` (the canonical name
   in `examples.yaml`, or `""`), `related` (**every other entry it touches, by exact name**). An unnamed
   reference is incomplete. A `status` field marks an unshipped entry; its absence means shipped and
   verified.
3. **The depth** (`architecture/<topic>.md`): **self-contained — a reader opens ONE file and understands
   one feature, knob, or limitation in full.** In-depth description, flow diagram as **inline Mermaid**
   (never `.mmd`), real e2e examples from `examples.yaml`, gotchas, links to touched topics. One `##` per
   index entry whose `doc` points here; the heading is the entry's `name`. With an executable-docs
   harness, every fence runs.
4. **The seams** (`protocols` records): parent-supplies → child-returns, one per seam. PLAN derives task
   `contract`s from these.

Send design rationale for a mechanism that **no longer exists** to `lessons.yaml`.

## The task graph — how: in the `tasks` MCP server

**Not a repo file** — the graph lives in the `tasks` MCP server (one task per GitHub Issue), authored and
read through its tools (never hand-edit it as YAML — `docs.js` does not serve it). A
task carries `deps`, a `scope` folder, `tier`, `qa`, `spec`, and its **trail** (a thread of
`decision`/`action`/`note` entries). **PLAN authors the graph** from the skeleton below; `audit` files
task-shaped picks with `add_task`; the merge step closes each task.

## `.claude/examples.yaml` — the canonical examples, reused everywhere

Every worked example lives here, **named**, one canonical per concept (MECE). Each record: `name`, the
code/call, `input`/`output` per the JSON rules. Pin a new example here **first**; if it overlaps an
existing one, evolve that one.

## `.claude/lessons.yaml` — the archive

Chronology oldest → latest, one entry per pivot. It
also carries abandoned approaches and what killed each. A feature's story belongs in its PR and its roadmap
row, never here. **Its absence means a first cycle, not an error.**

## The YAML record shapes — to author

Author every surface as **YAML text**. Author prose as a YAML `|` block; never `Bun.YAML.stringify`.
(Sessions READ these by querying `docs.js`.)

**The prose-in-YAML convention** (`architecture`, `lessons`): a section that was a whole paragraph or
bulleted run — not a short field — stays verbatim as one `|` block value under a section key. Only a
genuine record-shaped list becomes records: a table row, or a `{ field: value, … }` bullet repeated.

Each set's records. **A `[bracketed]` field is optional** — real records often omit it. A **list** set is
a flat list of records; a **sectioned** set is a YAML mapping — a prose `|` block alongside record-list
sections.

| Set | Shape | One record is | Array fields (match by containment) |
| --- | --- | --- | --- |
| `product` | sectioned: `north_star` (prose), `language` (records) | a glossary term: `{ term, definition, replaces: [] }` | `replaces` |
| `roadmap` | list | one target row: `{ row, feature, summary, status, depends_on: [], links: [], [status_detail], [doc], [absorbs] }`; `status_detail`/`doc`/`absorbs` are shipped-row fields | `depends_on`, `absorbs`, `links` |
| `architecture` | sectioned: `target_program` (prose) + `features`/`protocols` (records) | one index entry: `{ name, kind, what, how, doc, example, related: [] }`; one seam: `{ protocol: "stage -> gh", from, to, in, out }` | `related` |
| `lessons` | list | one chronology entry: `{ title, kind, files: [], body, [version] }` (`body` is a `\|` block; `version` only where the project versions releases) | `files` |
| `examples` | list | one named worked example: `{ name, input, output }` | - |

The task graph is **not a `docs.js` set** — it lives in the `tasks` MCP server (see "The task graph"
above). Author each task from the JSON skeleton below.

A surface not yet converted to YAML stays markdown until its own task lands.

## Skeletons (copy, fill, delete the guidance)

```yaml
# product.yaml — North Star + Language only. Keep it small. Every ✅ claim is verified by a run.
north_star: |
  <pitch paragraph; strong-side examples; Wedge: the precise thing alternatives don't do>
language:
  - term: <term>
    definition: <one-line definition>
    replaces: [<rejected synonyms>]
```

```yaml
# roadmap.yaml — one row per TARGET you can name in one sentence. (Rules above.)
- row: <n>
  feature: <the target, nameable in one sentence>
  summary: |
    Problem: <what is wrong or missing>. Solution: <the shape that fixes it>.

      <e2e code snippet — the desired call>

    Output (<REAL OBSERVED on ✅; desired shape, marked, on 🔨/📋>): <example inputs and outputs>
  status: "✅ shipped" # or 🔨 in progress / 📋 planned / ❌ killed
  status_detail: <one line>
  depends_on: []
  doc: roadmap/<name>.md # shipped rows only: the full writeup
  absorbs: [] # former row numbers the writeup covers — a cited "#n" greps to its story
  links: []
```

````markdown
# roadmap/<name>.md — the full writeup of one shipped target. The row keeps only the mini-spec.

# <Target> (roadmap #<n>)

<the capability in one paragraph — what a user can now do>

## Before / After

<the contrast, on the canonical example from examples.yaml — real observed output>

## The arc

<how it got here: the branches, the pivots, what was tried and dropped>

## Where the record lives

<the code, tests, docs, and PRs that now own this>
````

Author the task graph in the `tasks` MCP server, not as a YAML file. PLAN files each task with `add_task`:

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
- The **trail** is the task's comment thread — append `decision`/`action`/`note` with `append_trail`, read
  with `get_trail`.

**Author `tier` and `qa` at PLAN, never in the build session.** Both default safely, so absence never
skips a step. Still write them, so the model and review are explicit.

```yaml
# examples.yaml — the canonical worked examples, named, one per concept. Reused verbatim; pin new ones here first.
- name: <example name>
  input: |
    <the call / data — real values>
  output: |
    <the observed result — real if ✅, marked-expected otherwise>
```

```yaml
# lessons.yaml — append-only archive: discoveries, bug fixes, user directions, experiments. Never features.
- title: <the pivot, in one line>
  kind: discovery # or bugfix / direction / experiment
  files: [<the paths it touched>]
  version: <release it landed in> # only where the project versions its releases
  body: |
    Beginning state · problem · end state · trail link.
```

```yaml
# architecture.yaml — the coverage index: one record per feature/knob/limitation/pattern.
# Depth lives in .claude/architecture/<topic>.md — self-contained, Mermaid INLINE (no .mmd files).
target_program: |
  <the finished surface — a fenced code block + Input:/Output: examples>
features:
  - name: <entry name>
    kind: feature # or knob / limitation / pattern
    what: |
      <plain-language: what happens, high level>
    how: |
      <the technical solution, summarized>
    doc: architecture/<topic>.md
    example: "<canonical example name from examples.yaml, or ''>"
    related: [<every other entry this touches, by exact name>]
protocols:
  - protocol: "<parent> -> <child>"
    from: <parent>
    to: <child>
    in: <what the parent supplies>
    out: <what the child returns>
```

````markdown
# architecture/<topic>.md — one self-contained topic file per area. One `##` section per index entry
# whose `doc` points here; the heading text IS the entry's `name`. (Rules above.)

# <Topic>

<One short paragraph: what this file covers — and what belongs elsewhere, linked away:
"X itself belongs to [<entry name>](<other-topic>.md); this file only covers Y.">

```mermaid
flowchart LR
    <the topic's orientation diagram — inline, never a separate .mmd file>
```

## <entry name>

<What it is, before any mechanism — the index record's `what`, expanded.>

<How it works — the depth the index record's `how` summarizes.>

### Example

<the canonical example from examples.yaml, verbatim — the code fence, then Input:/Output: as distinct
valid-JSON blocks with real observed values (🔨/📋 marked expected). Run it through the executable-docs
harness when one exists.>

### Gotchas

- <the non-obvious edge — each related entry linked to its own section>
````
