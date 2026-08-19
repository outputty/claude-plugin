# PR description format (enforced)

This is the body format for every PR write, used by **both PR bodies**: each layer's own PR body (the
per-layer write-up, scoped to that layer) and the **final bottom-PR body** at merge (the whole task). Both
are PR bodies, not comments. The build stage owns which you are writing; this file owns the format. A
per-layer body differs only mechanically — a hidden `<!-- outputty:layer … -->` marker, a layer-name heading
in place of `## Summary`, and no diagram — as the skeleton shows. Nothing depends on a repo `.github/`
template; each body is written explicitly (`gh pr create --body …` / `gh pr edit --body-file …`).

**Write in plain language stating *why* the work was done**, minimal jargon — a non-engineer grasps the
summary and its reason. Define an unavoidable term in a few words at first use, ideally with a
**rudimentary example** (a two-line snippet or a before/after JSON pair). Keep the **summary and each
section's opening line plain**; **below the summary, get into the weeds** — mechanics, types, edge cases.

## Summary

One plain-language bullet per notable change — **what**, not how, as untechnical as possible. Example:

- Implemented overriding and setting new properties in variable pay records
- Replaced parquet with jsonl

## What we're building towards (right after Summary — every PR write)

The **eyes-on-the-prize block**: a concrete, runnable example of how the **final implementation** (or the
part this work serves) looks to the user/agent — source → transform → destination for pipeline work.
**Informed by the North Star, not the North Star**: show the finished surface, not the goal statement. Two
parts:

1. **The program** — one fenced code block: the canonical top-level call. Simplified data, real call
   shape; never the implementation.
2. **Input → output, as distinct JSON blocks BELOW the code.** **Never** an inline `# -> …` comment or an
   appended `// [ … ]`. Give each input and each output its **own** ` ```json ` block, labelled `Input:` /
   `Output:`, as **valid JSON the reader can copy and validate**: real values, no `…`, no prose stand-ins.
   (Non-data surface — a CLI that prints a flow, a UI — show its observable result in kind; the JSON rule
   is for records / API payloads / pipeline rows.)

For **multi-run** behaviour — e.g. an **SCD2** load (slowly-changing dimension type 2: a second load of
the *same* key retires the first version and opens a new one, never overwrites) — show **one input→output
pair per run**, labelled `Run 1 input:` / `Run 1 output:` / …, so the reader watches state evolve.

**It is a SNAPSHOT, not a copy.** Each write shows the canonical program **as it stands now**, not a
re-paste of the identical block:

- **The program's code stays canonical** — taken from `.claude/architecture.md` (the target program),
  never paraphrased or redesigned per layer.
- **Annotate what this layer made real**: mark each part implemented (✅) or pending (⏳ names the
  layer/task it waits on).
- **Output JSON is real only where a run produced it.** The one real run happens at master QA. So: the
  **final PR body** carries **REAL** output (reuse master QA's run); a **per-layer write-up** and the
  **draft body** carry *expected* output, **marked as such** — no run.

## One section per bullet

One section per summary bullet, **same order**, heading = the bullet's wording. Per section, in order
(drop the parts that do not apply):

1. **Why** — the first paragraph: the problem this solves, **not** the mechanics.
2. **How to call it — ONLY if something real is callable.** Show the **highest-level, user-facing call a
   user writes** — the DX, not the internals of what you changed: **one** top-level function, or — for a
   pipeline feature — the **toppest-level composition** (source, transform, destination); data simplified,
   call shape real, as in *The program* above. One short block; show its result only as the `Input:` /
   `Output:` JSON blocks defined above:

   ```python
   run(source(rows), transform(clean), destination(out))   # the user-facing call — not its guts
   ```

   **If nothing real is callable yet** (internal plumbing, a placeholder entry point), **omit this
   section entirely** — never write "nothing to call yet" or paste a placeholder export.
3. **How to verify** — the fastest way a reviewer confirms it works: the exact request to send, the
   file/response to inspect, or a specific test to run — **in this repo's own runner and invocation**,
   copy-pasteable, never a generic form.
4. **Tests — gotchas only.** Flag **only** tests that pin a **gotcha or tricky bit** — a non-obvious edge,
   a boundary someone could re-break, a bug found while building. **Never list every test.** No tricky
   tests → omit.

   | Test | Gotcha it pins |
   |---|---|
   | `test_override_null_vs_missing` | a null value overrides; a *missing* key must not |
5. **Output — before / after** — ONLY when the change alters an actual **data value** the reader could
   inspect: a record, a file's contents, or an API request/response payload. A `before` and an `after`
   block, real JSON values per the rule up top:

   ```json
   { "before": <real value — e.g. {"count": 1}> }
   ```
   ```json
   { "after": <real value — e.g. {"count": 2}> }
   ```

   **before/after JSON is for data changes; before/after *graphs* are for flow changes.** If what changed
   is **behaviour or flow, not a record**, there is **no** before/after JSON: show it as the
   **before/after diagram** in *How it works*. No record change → no JSON block here.
6. **How it works** — **final PR body only** (per-layer write-ups are text-only), ONLY when the flow
   actually changes; no details. Prefer a **diagram over prose**, in the **`diagram`** house style (a
   committed self-contained SVG, embedded by its `github.com/<owner>/<repo>/raw/<branch>/…` URL so it
   renders in the PR). **Scope the graph to the change**; pick its shape
   by the kind of change:
   - **A whole new process / flow** → draw the **entire thing** as one graph.
   - **A new step added to an existing flow** → **exactly 5 nodes**: a **start** summarising everything up
     to the step before it → the **step before** → the **step you added** (centre, highlighted) → the
     **step after** → an **end** summarising how the flow ends. Everything outside the middle three
     collapses into those two summary end-nodes.
   - **A change to how an existing flow works** → a **before / after** pair — the old path and the new
     path, stacked or side by side; the home for a flow change with no record diff (section 5 redirects here).

   A bugfix / format-swap that does not change the flow gets no diagram.

## What was tried before, and why it didn't work

**Include whenever the work has prior art** — an earlier design this replaces, a reverted attempt, an
approach the user proposed that evidence killed, a round QA rejected. One row each:

| Attempt | Why it was tried | Why it didn't work |
|---|---|---|
| One dynamic workflow per build | one script could fan out and return a single verdict | a workflow can't pause, so a layer-1 failure surfaced only after layers 2–3 were built on it |

Two rules keep it honest. **Name the evidence that killed it** — "QA failed it three rounds running",
"183 of 615 shell calls" — never a vibe. And **say when it would become viable again** if the blocker was
circumstantial, not fundamental.

No prior art → omit. Never pad with a strawman you never seriously considered.

## Keep in mind (last)

Future work; and any gotcha found — how it was worked around, or, if unsolved, noted so it is not
re-attempted.

## Skeleton (copy, fill, delete the guidance)

Repeat the per-change block once per summary bullet, same order. Drop any part that does not apply.
**PR body:** keep the `## Summary` heading. **Per-layer write-up:** prepend the marker line and rename the
`## Summary` heading to the layer (`## <what this layer did>`, stage-prefixed if staged).

```markdown
<!-- outputty:layer <task-id,…> -->        (per-layer write-up only)

## Summary        (PR body) — in a per-layer write-up, replace with: "## Build · <what this layer did>"

- <plain-language bullet: what changed and, in a few words, why — a non-engineer should grasp it>

## What we're building towards

<the canonical top-level program from architecture.md's "What we're building towards" section — code never paraphrased, annotated ✅ done / ⏳ pending>

Input:
```json
<valid JSON — real values a reader can copy and validate; no ellipsis, no prose>
```
Output:
```json
<final PR body: REAL output (master QA ran it). Per-layer write-up / draft: marked-expected JSON — no run.>
```
<for multi-run behaviour (e.g. SCD2), repeat as labelled pairs — "Run 1 input:" / "Run 1 output:" / …>

## <change — same wording as its summary bullet>

<Why — in plain language: the problem this solves. Define any jargon at first use.>

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

<Output — before / after — two JSON blocks of REAL data values, ONLY when a record/file/API payload changes; never prose-in-JSON. Flow changed but no record? → the before/after graph below, not here>

<How it works — final PR body only (per-layer write-ups are text-only); a high-level diagram via the diagram skill, only when the flow changes — incl. the before/after graph for a no-record flow change>

## Keep in mind

- <future work; and any gotcha found — how it was worked around, or noted so it isn't re-attempted>
```
