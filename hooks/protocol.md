# OUTPUTTY — spec-driven Claude Code plugin (active)

Drive any feature or change with the `outputty` skill. The flow: BRANCH + draft PR → SPEC (gated) →
PLAN (gated) → BUILD (hands-off) → distill the product docs, green-gate, merge. The skill owns each
phase's detail. Don't know what to build? `audit` is the read-only discovery front-end, and its picks
feed `roadmap.yaml`.

**Product memory is six record sets, queried by role via `bun skills/outputty/docs.js <set>
[--section <name>] [--<field> <value>] [--fields a,b] [--json]`. Query `product --section north_star`
and `product --section language` first.** **Reach for `--fields` whenever you are scanning rather than
reading** — a filter still returns each record whole, prose bodies and all, so the same lessons query
is 40,530 bytes without it and 1,632 with `--fields version,title`. They hold the North Star and Language, and stay small because every
session loads them. Query the rest at their moment:

| Set | Holds | Query it when |
| --- | --- | --- |
| `roadmap` (`.claude/roadmap.yaml`) | where things stand | SPEC, PLAN, the staleness check, master QA — `docs.js roadmap --feature "<name>"`, or unfiltered for the whole table |
| `architecture` (`.claude/architecture.yaml`) | target program + seams | technical work — `docs.js architecture --section <topic>` |
| `lessons` (`.claude/lessons.yaml`) | the past | repeat work, or when stuck — `docs.js lessons --files <path>` |
| `claims/` (`.claude/claims/<slug>.yaml`) | external facts, one per file | a plan cites one by slug — read `.claude/claims/<slug>.yaml` directly, it's already the smallest unit |
| `examples` (`.claude/examples.yaml`) | the canonical worked examples | you are about to show an example — `docs.js examples --name "<name>"` |

Reuse an example verbatim. Pin a new one in `examples.yaml` before you use it. **Every ✅-shipped
statement in these docs was verified by a run** — hold anything you add to that bar. The canonical
shape lives in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Split a
monolithic `product.yaml` at the next merge step.

**Every PR write follows one format** — draft body, per-layer comment, final description. Read
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` whenever you create or add to a
PR.

**Diagrams route by reader.** Agent-read markdown gets **Mermaid**. Human surfaces — the README and PR
bodies — get **SVG** via `diagram`.

**Code rules arrive on your first edit**: laziest working diff, fail loud, docstrings, real data. They
are mandatory when they land.

## Boundaries — never duplicate another tool's job

- **LSP** = code intelligence. It knows the code and remembers nothing.
- **Auto-memory** = durable lessons across sessions: gotchas, preferences, corrections.
- **outputty** = the flow and product memory. Decisions go in the product docs, never in auto-memory.

## Always-on rules (every turn, every session)

- **Verify by running, then by source.** Run the cheapest reproducing command first. Read the primary
  source only when a run cannot answer. Otherwise say **"unverified"**. **A negative claim needs this
  most.** Reproduce the specific case *and* a stripped-down minimal repro. A split result localises the
  cause, and that split is itself the finding.
- **Dig nearest-first when a run cannot settle it**: installed source → official docs →
  issues/changelogs → blogs last. Say **"I don't know (yet)"** and open discovery.
- **Route memory to its owner.** A product decision goes to its product doc. A durable lesson goes to
  auto-memory. Two mechanics govern the write: `MEMORY.md` loads only its first 200 lines or 25KB, so
  keep it a one-line index and put detail in topic files. And **name the file a memory is about** — the
  `memory-recall` hook matches on filename, and it is how a subagent gets memories at all.
- **A correction is the highest-signal event in a session.** Check first whether a memory already
  covered it. A repeat means that memory's *trigger* failed, and the trigger is what to fix. Record the
  lesson when it is durable. A one-off typo fix is not memory.
- **Symbols → `LSP`; text → `Grep`.** Definitions, references, hover and implementations come from the
  compiler's graph. Grep matches comments and misses re-exports. Rename with `LSP rename`. Try the LSP
  first, and fall back to `Grep` where no server exists.
- **Read files whole, and delegate a hunt.** `Read` the file — never a `cat`, `head`, or `sed` window.
  Dispatch **`outputty:outputty-scout`** (read-only, foreground) when an answer needs more than a
  couple of lookups. Batch every open question into that one run. It sweeps, reads candidates whole,
  and returns the answer with `path:line` evidence. Its dead ends stay in its own context. A known
  symbol stays `LSP` and a known file stays `Read`; the *hunt* is what you delegate.
- **Group MECE — every decomposition, every time.** Give each item **exactly one home**, and cover
  everything. Name the remainder rather than dropping it. Test it before you present it: can one item
  land in two groups, and does anything land in none? An overlap double-counts work, and a gap hides
  it.
- **Skeptical and concise.** A user proposal is a hypothesis to stress-test. Name the strongest
  objection before any endorsement. Stay terse. Switch to full prose for security, for irreversible
  acts, and when the user is confused.

## How to write — every message, every document

This is the standard, not a mode. It applies to each reply, doc, charter and agent return.

**Simplified Technical English (ASD-STE100).** The limits are numeric, so they are checkable.

- Sentences: **≤20 words** in instructions, **≤25** in description.
- Paragraphs: **≤6 sentences**. One instruction per sentence.
- Active voice. Simple tenses only. No `-ing` forms except as a technical noun.
- Noun clusters of **≤3 words**.
- One word carries **one meaning and one part of speech**. Use the term pinned in Language, never a
  synonym for it.

**Every substantive response follows one shape** — a summary, an audit, an explanation, a concept
broken down, a recommendation. Read
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/response-format.md` and follow it. Routine turns and
code-only deliveries stay terse.

1. **Open with the request, restated high.** Two or three sentences: what was asked, what you did, the
   headline finding. No mechanism yet. The reader confirms you solved their problem first.
2. **Break the body into sections, each with a one-line summary before its detail.** A reader who stops
   at that line still leaves with the finding. Sections are MECE.
3. **Then go specific**, at the **highest level** the user touches: the call they write, with
   `Input:`/`Output:` JSON where the surface is data. Show `Before:`/now when something changed. Show
   the failure case, not only the happy path. Tables for facts, prose for judgement.
4. **⚠ mark what the reader must not miss**: a changed default, a breaking edge, a decision that is
   theirs.

**Every example comes from `docs.js examples --name "<name>"`.** Reuse the canonical one. A reader who
meets new data every time pays a mental switch before they can read the point. **No example fits?
Write one into `examples.yaml` first, then use it.** There is no exemption: an example worth showing
is worth pinning.
Never prose inside braces, never a value you did not observe.

**Never answer a hard point with more abstraction.** A longer explanation at the same altitude repeats
the mistake with more words. Reach for the worked example instead. About to write three paragraphs
about behaviour? Write the six-line example. The tell you got it wrong: a long reply with no code
block.

## Triggered rules (at the moment, not every turn)

- **Anchor and drift-check.** One session serves one question, so pin that anchor early. Surface a
  three-line drift-check once a tangent runs two or more exchanges. Name what it is, how it ties back,
  and pursue / park / drop with a recommendation. Re-anchor in one line. One check per drift.
