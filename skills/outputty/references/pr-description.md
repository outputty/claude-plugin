# PR description format (enforced)

One format for **every** write to a PR in the outputty flow — same shape at every scale:

- the **draft PR body** opened at branch-cut (core objective only, at first);
- each **per-layer comment** the BUILD commit agent posts as work lands (a mini PR description scoped to
  that one layer);
- the **final PR body** written at merge via `outputty-review`.

Write it in **plain language that states *why* the work was done**, with as little technical jargon as
possible — a non-engineer should grasp the summary and the reason for it. If a technical term is
unavoidable, **define it in a few words** the first time you use it — and ideally ground the definition
with a **very rudimentary example**: a two-line snippet, or simply a before/after JSON pair (e.g.
*"idempotent — safe to run twice; the second run leaves `{"count": 1}` as `{"count": 1}`, not
`{"count": 2}`"*). The **summary and each section's opening line stay plain**; **below the summary you may
get into the weeds** (mechanics, types, edge cases) — that's where detail belongs, not up top.

This file is both the rules (below) and the fill-in **skeleton** (bottom). The flow writes PR bodies and
comments from it explicitly (`gh pr create --body …` / `gh pr comment`), so nothing depends on a
repo-level `.github/` template — a plugin install wouldn't carry one into the consumer repo anyway.

**Scope splits by surface — this is the important part.**

- The **PR body** (draft, then final) is the **whole task**: a general, high-level overview spanning
  **all layers**. Its diagram, if any, covers the whole task.
- A **per-layer comment** covers **only its own layer's code** — that layer's tasks and diff, nothing
  from other layers. Its diagram, if any, covers only that layer's change.

Pick the graph to match the scope (see "How it works" below).

## Summary

One plain-language bullet per notable change — **what** was done, not how. As untechnical as possible.
Example:

- Implemented overriding and setting new properties in variable pay records
- Replaced parquet with jsonl

The sections below appear in the **same order** as these bullets.

## What we're building towards (right after Summary — every PR write)

The **eyes-on-the-prize block**: a concrete, runnable example of how the **final implementation** (or
the section of it this work serves) will look to the user/agent — the exact program they'll write, with
a source → transform → destination shape for pipeline-style work. It is **informed by the North Star but
is not the North Star**: it shows the finished surface explicitly, not the goal statement. Two parts, in
this order:

1. **The program** — one fenced code block: the canonical top-level call. Simplified data, real call
   shape; never the implementation.
2. **Input → output, as distinct JSON blocks BELOW the code.** **Never** an inline `# -> …` comment or
   an appended `// [ … ]` — those are unreadable. Each input and each output is its **own** fenced
   ` ```json ` block, labelled `Input:` / `Output:`, and is **valid JSON the reader can copy and validate
   themselves**: real values, no `…`, no ellipsis, no prose stand-ins. (When the program's surface isn't
   data — a CLI that prints a flow, a UI — show its observable result in kind; the JSON rule is for the
   common case of records / API payloads / pipeline rows.)

If the behaviour only makes sense across **multiple runs** — e.g. an **SCD2** load (slowly-changing
dimension type 2: a second load of the *same* key must retire the first version and open a new one, not
overwrite) — show **one input→output pair per run**, labelled `Run 1 input:` / `Run 1 output:` /
`Run 2 input:` / `Run 2 output:` / …, so the reader watches the state evolve.

**It is a SNAPSHOT, not a copy — same program, current truth.** Repeating the identical block in every
comment is repetition with zero information. Instead, each write shows the canonical program **as it
stands right now**:

- **The program's code stays canonical** — taken from product.md's section, never paraphrased or
  redesigned per comment (the anti-drift rule: the *shape* is fixed; only its *status* evolves).
- **Annotate what this layer made real**: mark each part implemented (✅) or pending (⏳ names the
  layer/task it waits on).
- **The output JSON is REAL** for the parts that now run — execute the runnable slice and paste its
  actual output; grounded in a run, never imagined. For a part still pending, the JSON is the *expected*
  output, **marked as such**.
- Draft PR body: nothing implemented yet — the target program + expected-output JSON. Per-layer comment:
  the snapshot after that layer (real JSON for what runs, marked-expected for what doesn't). Final PR
  body: the fully-working program with its real output JSON (master QA just ran it — reuse that evidence).

## One section per bullet

One section per summary bullet, **same order**, heading = the bullet's own wording. Per section, in this
order (drop the parts that don't apply):

1. **Why** — the first paragraph, in **plain language**: the problem / motivation this solves, **not**
   the mechanics. Define any technical term the first time it appears.
2. **How to call it — ONLY if there is something real to call.** The **top-level, user-facing way to
   use this** — the DX, **not the implementation**. Show the **highest-level call a user actually
   writes**: ideally **one** top-level function, or — for a pipeline-style feature — the **toppest-level
   composition** (a source, a transform, a destination). That surface is what the user touches, and
   where a rough edge shows up first. **Simplify the data, keep the call shape real**, and **never paste
   the internals of what you changed** (that's what code review is for). One short block — and if you
   show its result, use distinct `Input:` / `Output:` JSON blocks below it (the *What we're building
   towards* convention), **never** an inline `# -> …` comment:

   ```python
   run(source(rows), transform(clean), destination(out))   # the user-facing call — not its guts
   ```

   **If the change exposes nothing real to call yet** (internal plumbing, a placeholder entry point),
   **omit this section entirely** — never write "nothing to call yet" or paste a placeholder export.
   The grounding job is done by *What we're building towards* (below), not by filler.
3. **How to verify** — the fastest way a reviewer confirms it works: the exact request to send, the
   file/response to inspect, or a specific test to run (e.g. `uv run pytest tests/… -k …`).
4. **Tests — gotchas only.** Flag **only** the tests that pin a **gotcha or tricky bit** — a non-obvious
   edge, a boundary someone could plausibly re-break, a bug found while building. **Never list every
   test** — routine coverage restates the diff and adds nothing for the reader. No tricky tests → omit
   the section.

   | Test | Gotcha it pins |
   |---|---|
   | `test_override_null_vs_missing` | a null value overrides; a *missing* key must not |
5. **Output — before / after** — REQUIRED whenever the change alters output (a record, a file, or the
   API response). Show both as JSON:

   ```json
   { "before": … }
   ```
   ```json
   { "after": … }
   ```
6. **How it works** — ONLY when the flow actually changes; no details (that's what code review is for).
   Prefer a **diagram over prose**, drawn with the **`outputty-diagram`** house style (a committed
   self-contained SVG, embedded by its `github.com/<owner>/<repo>/raw/<branch>/…` URL so it renders in
   the PR) — **never hand-authored Mermaid**. **Scope the graph to the change**, and pick its shape by
   what kind of change it is:
   - **A whole new process / flow** → draw the **entire thing** as one graph.
   - **A new step added to an existing flow** → **exactly 5 nodes**: a **start** node summarising
     everything up to the step before it → the **step before** → the **step you added** (centre, the
     highlighted one) → the **step after** → an **end** node summarising how the flow ends. Everything
     outside the middle three collapses into those two summary end-nodes.
   - **A change to how an existing flow works** → a **before / after** pair — the old path and the new
     path, stacked or side by side — so the change is explicit.

   A bugfix / format-swap that doesn't change the flow gets no diagram.

## Keep in mind (last)

Future work; and any gotchas found — how each was worked around, or, if it was never solved, noted so
it isn't re-attempted. A gotcha that never worked is worth recording as a caution for next time.

## Per-layer comment specifics (BUILD commit agent)

A per-layer comment is a mini PR description scoped to the **one layer** just committed: that layer's
tasks are the summary bullets, each with its own section, same format as above. It is **not** the whole
PR — the full body is written once at merge via `outputty-review`. Build it from the layer's commit
messages (title + one-line work summary) and its committed diff.

**Header — the layer name *is* the summary heading.** A per-layer comment opens with:

1. a **hidden marker** (first line — the preflight matches on this to tell which layers already have a
   comment): `<!-- outputty:layer <task-id,task-id,…> -->`
2. then, **in place of the `## Summary` heading**, a heading that names the layer in plain language —
   `## <what this layer did>` — with the summary bullets directly under it. If the tasks carry a `stage`
   (`prototype` / `build` / `sweep` — see [plan.md](../plan.md)), prefix it: `## Build · <what this layer
   did>`, so the PR reads as a maturation story. **Don't** add a separate layer line *and* a `## Summary`
   — the layer heading **replaces** Summary. (A whole-task PR body keeps a plain `## Summary`.)

A layer comment's diagram — on the **rare** layer that changes a flow — is scoped to **that one layer's**
change (the added-step-5-node, before/after, or new-process shape above), never the whole task. The
commit agent draws it by following the `outputty-diagram` house style directly
(`${CLAUDE_PLUGIN_ROOT}/skills/outputty-diagram/SKILL.md` — read and apply it), writing the SVG into the
repo, committing + pushing it, then embedding it by raw URL. Most layers don't touch a flow, so **most
layer comments are text-only**. The whole-task overview graph belongs to the PR body, never a layer comment.

## Skeleton (copy, fill, delete the guidance)

Repeat the per-change block once per summary bullet, in the same order. Drop any part that doesn't apply.
**PR body:** keep the `## Summary` heading. **Per-layer comment:** prepend the marker line and rename the
`## Summary` heading to the layer (`## <what this layer did>`, stage-prefixed if staged).

```markdown
<!-- outputty:layer <task-id,…> -->        (per-layer comment only)

## Summary        (PR body) — in a per-layer comment, replace with: "## Build · <what this layer did>"

- <plain-language bullet: what changed and, in a few words, why — a non-engineer should grasp it>

## What we're building towards

<the canonical top-level program from product.md — code never paraphrased, annotated ✅ done / ⏳ pending>

Input:
```json
<valid JSON — real values a reader can copy and validate; no ellipsis, no prose>
```
Output:
```json
<valid JSON — REAL output for what runs; expected (marked) for what's still pending>
```
<for multi-run behaviour (e.g. SCD2), repeat as labelled pairs — "Run 1 input:" / "Run 1 output:" / "Run 2 input:" / …>

## <change — same wording as its summary bullet>

<Why — in plain language: the problem this solves. Define any jargon the first time you use it.>

How to call it —        (ONLY if something real is callable — else omit the section entirely, no filler)
```lang
<the top-level, user-facing call — one function, or a source → transform → destination composition;
 simplified data but a real call shape; NOT the implementation of what changed>
```

How to verify — <exact request to send, file/response to inspect, or a specific test to run>

Tests —        (gotcha/tricky tests ONLY — never the full list; none → omit)
| Test | Gotcha it pins |
|---|---|
| <test name> | <the non-obvious edge it protects> |

<Output — before / after — as two JSON blocks, only when the change alters output>

<How it works — a high-level diagram via the outputty-diagram skill, only when the flow changes>

## Keep in mind

- <future work; and any gotcha found — how it was worked around, or noted so it isn't re-attempted>
```
