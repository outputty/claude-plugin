# Docstring standard (enforced)

**Document intent and behaviour, not implementation.** A docstring tells a caller *what* a function
does, *why*, and *how to use it* — so they never have to read the body. Everything below follows from
that one rule.

Applies to every function BUILD adds or changes, in any language. QA checks against this file.

## The shape — three layers, in this order

```
1. One-line summary, IMPERATIVE mood        ← "Calculate the total", not "Calculates the total"
2. Extended context, 1–3 sentences          ← only when there is a real constraint or side effect
3. Args / Returns / Raises + an example     ← the structured part
```

**The summary is a command, and it stands alone.** It is what an IDE shows in a tooltip, so it has to
make sense with nothing around it. Not a noun phrase (`"The early-stop decision for a drain"`), not a
restatement of the name.

**Layer 3 is structured, not prose.** Use the language's section syntax (`Args:`/`Returns:`/`Raises:`,
`@param`/`@returns`/`@throws`) and make each carry what a caller can't infer from the signature:

| Section | Must convey |
|---|---|
| Args | the **constraint or range**, not the type — *"> 0"*, *"ISO-8601, UTC"*, *"non-empty"* |
| Returns | the **unit, shape, or state** — *"rounded to 2dp"*, *"sorted by `id`"*, *"`None` if absent"* |
| Raises | **which error and when** — *"`ValueError` if `rate` is negative"* |

Omit a section that has nothing to say. An arg whose description just restates its name and type is
noise — cut it rather than pad it.

**The example is outputty's own addition and is never optional** — at least one concrete
`input → output`, so the function is callable from its docstring alone. It is the code-level twin of
the task's `contract` and the PR's *How to call it*. A trivial helper gets a one-line docstring with a
one-line example; it still gets the example.

Use the language's idiom: Google-style `"""…"""` for Python, `/** … */` JSDoc/TSDoc for JS/TS, `///`
for Rust. Pick the one the tooling reads — never invent a layout.

## Include / skip

| Include | Skip |
|---|---|
| Side effects — *"writes to the state store"*, *"mutates the list in place"* | The parameter names again, with no added meaning |
| Preconditions — *"must be non-empty"*, *"call after `connect()`"* | How the body works, step by step |
| Edge cases — *"returns `None` when the key is missing"* | Types the signature already enforces |
| What it raises, and when | **Why the design is the way it is** — that belongs in `product.md` |

## The four failures to write out

These are the ones that actually happen. Each is a QA finding.

**1. Implementation history.** The single worst kind, because it rots.

```ts
// ❌ cites a spike, a finding number, and a design debate
/**
 * window.ts — the bounded-stateless-pull declaration `Lake.backfill()` consumes
 * (roadmap #5, `research/backfill-spike/SPIKE.md`). It carries NO cursor-write behavior of its
 * own — `Lake.backfill()` decides a windowed node's cursor is never persisted (spike Finding 3/4:
 * reporting the window's own `from` bound back would move a LIVE cursor backwards). `order` is a
 * DELIBERATELY SEPARATE axis from the bound (spike's "What this implies for the API SHAPE"…)
 */
```

The spike is deleted, the finding is renumbered, the debate is settled — and the docstring now lies.
**Decisions live in `product.md`; the trail records how you got there.** A docstring states what is
true now.

```ts
// ✅
/**
 * A bounded range for `Lake.backfill()` — a cursor `path` plus an inclusive `from` and exclusive
 * `until`. Backfilling never advances the model's stored cursor, so a forward run resumes untouched.
 *
 * `new Window({ path: "ts", from: "2023-01-01", until: "2024-01-01" })` -> pulls calendar 2023.
 */
```

**2. Policy rationale aimed at the next maintainer.** *"A real method, not a `.kind` a caller matches
on (the self-contained-strategy rule)"* is an argument about the codebase's conventions. The caller
does not need it, and the convention is already written down where conventions live.

**3. A noun phrase instead of a command.** *"The early-stop DECISION for a windowed backfill drain"*
names the thing; it doesn't say what calling it does. → *"Report whether a cursor value has passed the
window's `until` bound."*

**4. An example with no summary.** A docstring that is *only* an example still fails — the example
shows one case, the summary states the contract.

## Length

**A docstring longer than the function it documents is a smell.** Two sentences and an example covers
almost everything. If it genuinely needs more, the function is probably doing more than one thing —
that is a decomposition signal, not a licence to write six paragraphs.

The same discipline applies to **test names and inline comments**. A test name is a sentence, not a
paragraph:

```ts
// ❌ 190 characters, cites a spike file, and repeats the assertions
name: "backfill(): a bounded Window pull lands the requested rows WITHOUT touching the live cursor
  — the next run() resumes from the untouched position (research/backfill-spike/SPIKE.md lifecycle,
  verbatim)"

// ✅
name: "backfill() lands windowed rows without moving the live cursor"
```

An inline comment earns its place by explaining something the code cannot — a non-obvious *why*. Narrating
the next three lines is noise the reader has to skip.
