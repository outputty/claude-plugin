# Response format (enforced) — restate, section, show

One shape for **every substantive response**: a summary of shipped work, an audit, an explanation, a
concept broken down, a recommendation. Routine turns and code-only deliveries stay terse.

**Get the examples before you write.** Read the executed docs, the test, or the run output, and quote
them. A snippet reconstructed from memory of the API is how a wrong example ships inside a response
that otherwise looks authoritative.

## 1. Open with the request, restated high

Two or three sentences naming **what was asked and what you did about it** — no detail, no mechanism.
The reader confirms you solved their problem before spending attention on how.

Support the restatement with a worked example when the request itself was ambiguous. That example
shows what you understood, and it lets a misread surface in one line rather than three sections later.

## 2. Break the body into sections, each with its own summary first

Every section and subsection opens with **one line** saying what it covers and what it concluded. Only
then the specifics. A reader who stops at the summary line still leaves with the finding.

Sections are **MECE**: one topic per section, and together they cover the answer. Name the remainder
rather than dropping it.

## 3. Go specific, in the established order

Inside a section, work down the ladder:

1. **The highest-level example the user touches** — the call they write, never the internals.
2. **`Input:` / `Output:` as JSON** where the surface is data. Real observed values, from a run.
3. **`Before:` and now** when something changed. The contrast carries the change; a new API shown
   alone does not say what moved.
4. **The failure case**, not only the happy path — the typo, the error now raised, the thing that used
   to be silent. Usually the most valuable part.
5. **Tables for scannable facts. Prose only for judgement.**

**⚠ mark what the reader must not miss**: a changed default, a breaking edge, a decision that is
theirs.

## 4. Every example comes from `docs.js examples --name "<name>"`

**Reuse the canonical example. Do not invent one per response.** A reader who meets new data every
time pays a mental switch before they can read the point, and the example never accumulates meaning.

**No example fits? Write one into `examples.yaml` first, then use it.** The library grows by use, and the
same example evolves across responses instead of being replaced. This has no exemption: an example
worth showing is worth pinning.

**Never prose inside braces, never an invented value.** Show a value you observed, or show none.

## Shipped work adds one closing section

A response that summarises shipped work — a cycle, a build, a stack of PRs — closes with **what it cost
and what it caught**:

| | |
| --- | --- |
| Diff | +N / −M across K files |
| Suite | N passed, M skipped |
| Gates | green-gate result, master QA verdict |

Then the bugs, each **attributed**: the adversary at SPEC, master QA round 2, a spike, the user's own
instinct. Say what was killed. Say when the user's instinct beat the plan. Attribution is what tells
you which parts of the process are paying for themselves.

## Skeleton

````markdown
<2–3 sentences: what was asked, what you did, the headline finding.>

## <Section, named for the reader's question>

<One line: what this section covers and what it concluded.>

```ts
<the highest-level call — from examples.yaml, via `docs.js examples --name "<name>"`>
```

```json
<REAL observed output — pasted from the run, never composed>
```

⚠ <the thing they must not miss>

## <Next section>
…
````
