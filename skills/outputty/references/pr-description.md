# PR description format

Two writes use this format, and both are PR bodies rather than comments:

- **Final PR body** - the bottom PR at merge. It covers the whole task.
- **Layer PR body** - one layer's own PR. It covers that layer only.

The build stage owns which one you write, and this file owns the format. Nothing depends on a repo
`.github/` template. Write each body explicitly, with `gh pr create --body …` or `gh pr edit --body-file …`.

They differ in exactly five places:

| Final PR body | Layer PR body |
| --- | --- |
| carries no marker line | opens with `<!-- outputty:layer <task-id,…> -->` |
| heads with `## Summary` | heads with `## <what this layer did>`, stage-prefixed when the task carries a stage |
| covers the whole task | covers that layer only |
| shows real output, from master QA's run | shows expected output, labelled expected |
| carries a diagram in *How it works* | stays text-only |

## Which section to read

| Section | Read it for |
| --- | --- |
| What is checked, and what is not | a body that you want to verify |
| Plain language first | every body |
| Summary | every body |
| More than one problem in one PR | a body that covers two problems |
| What we're building towards | every body |
| One section per bullet | every body |
| What was tried before, and why it didn't work | a task with prior art |
| Keep in mind (last) | every body |
| Skeleton | the write itself |

## What is checked, and what is not

One checker exists, and it ships only in the outputty plugin's own repository. A session working in any
other repo has no checker, so every rule below falls to the writer. Inside the plugin repo, run it on a
drafted body:

```bash
node .claude/skills/run-outputty/driver.mjs prbody <the body file>
```

The checker reads prose mechanics plus one structural rule. Every other rule here is on the writer.

| Rule | Enforced by |
| --- | --- |
| No em dash, every sentence within 25 words, and no sentence opening on a lowercase identifier | the checker |
| No slash compound, and no word shouted for emphasis | the checker |
| Every section heading reuses its summary bullet | the checker |
| Real output only where a run produced it | the writer |
| Valid JSON, real values, no ellipsis and no prose | the writer |
| Gotcha-only tests, and the diagram rules | the writer |

⚠ The body is prose that a reviewer reads cold, so the output style governs every sentence in it. A
format-perfect body still fails on its writing.

## Plain language first

Write in plain language, and state why the work was done. A non-engineer grasps the summary and its
reason. Define an unavoidable term in a few words at first use. Give a rudimentary example with it: a
two-line snippet, or a pair of before-and-after JSON values. Keep the summary plain, and keep each
section's opening line plain. Below the summary, get into the weeds: mechanics, types, edge cases.

## Summary

One plain-language bullet per notable change: what, not how, as untechnical as possible. Example:

- Implemented overriding and setting new properties in variable pay records
- Replaced parquet with jsonl

## More than one problem in one PR

This should not happen. Stack the PRs instead, one problem per PR, and let the stack carry the order. A PR
solving two problems cannot be accepted or rejected on its own terms, which is the whole test for a layer.
QA catches this and sends it back to be split. Reaching a reviewer is already a failure.

When it happens anyway, the body makes it unmissable rather than blending the two:

1. **The summary** - state the problems only, one bullet each, and say nothing about the solution. Keep it
   a short restatement of what was wrong. The reader learns how many problems this PR closes before
   learning anything about how.
2. **Each problem** - give it its own full section, applying everything this file specifies once per
   problem. Each section repeats "What we're building towards", with its own input and output. Each also
   repeats How to call it, How to verify, Tests, and Output before and after.
3. **The shared tail** - keep "What was tried before" and "Keep in mind" single, at the end, covering the
   whole PR.

```markdown
## Summary

- A table that already held data could not be declared at all.
- A downstream read could only ever follow one hardcoded column.

# Problem 1: a table that already held data could not be declared at all

<the full per-problem body: What we're building towards, then its sections>

# Problem 2: a downstream read could only ever follow one hardcoded column

<the same, again>
```

Two problems means two of everything above the shared tail. If that feels like too much to write, it is
the correct signal: the PR should have been two PRs.

## What we're building towards

Place it right after Summary, in every body. The eyes-on-the-prize block is a concrete, runnable example
of how the final implementation looks to the user or the agent. For pipeline work, show source →
transform → destination. The North Star informs it, and it is not the North Star: show the finished
surface, not the goal statement. Two parts:

1. **The program** - one fenced code block, holding the canonical top-level call. Simplified data, real
   call shape, never the implementation.
2. **Input and output** - two distinct JSON blocks below the code. Give each input and each output its own
   ` ```json ` block, labelled `Input:` and `Output:`. Write valid JSON that the reader can copy and
   validate: real values, no ellipsis, no prose stand-ins. Never inline a `# -> …` comment, and never
   append a `// [ … ]`.

A non-data surface, such as a CLI that prints a flow or a UI, shows its observable result in kind. The
JSON rule covers a record, an API payload and a pipeline row.

Multi-run behaviour gets one input-and-output pair per run, labelled `Run 1 input:`, `Run 1 output:` and
so on. The reader then watches state evolve. An SCD2 load is the case in point. (Slowly-changing dimension
type 2: a second load of the *same* key retires the first version. It opens a new one, and never
overwrites.)

It is a snapshot, not a copy. Each write shows the canonical program as it stands now, never a re-paste of
the identical block:

- **The code stays canonical** - taken from `.claude/architecture.md` (the target program), never
  paraphrased and never redesigned per layer.
- **The annotation marks this layer** - mark each part implemented (✅) or pending (⏳ names the layer or
  the task that it waits on).
- **The output realness** - see the differences table above. ⚠ Never show output that no run produced. The
  one real run happens at master QA, so a layer body labels its output expected.

## One section per bullet

One section per summary bullet, in the same order. ⚠ Each heading reuses its bullet's wording, so the
summary indexes the body. Per section, in order, and dropping the parts that do not apply:

1. **Why** - the first paragraph: the problem that this solves, never the mechanics.
2. **How to call it** - only when something real is callable. Show the highest-level call that a user
   writes, which is the DX rather than the internals of what you changed. Give one top-level function, or,
   for a pipeline feature, the toppest-level composition (source, transform, destination). Data
   simplified, call shape real, as in *The program* above. Use one short block, and show its result only
   as the `Input:` and `Output:` blocks defined above.

   ```python
   run(source(rows), transform(clean), destination(out))   # the user-facing call, not its guts
   ```

   When nothing real is callable yet, omit this section entirely. Never write "nothing to call yet", and
   never paste a placeholder export.

3. **How to verify** - the fastest way that a reviewer confirms it works: the exact request to send, the
   file or the response to inspect, or a specific test to run. Use this repo's own runner and invocation,
   copy-pasteable, never a generic form.
4. **Tests, gotchas only** - flag only a test that pins a gotcha or a tricky bit: a non-obvious edge, a
   boundary that someone could re-break, or a bug found while building. Never list every test. No tricky
   test means no section.

   | Test | Gotcha it pins |
   | --- | --- |
   | `test_override_null_vs_missing` | a null value overrides; a *missing* key must not |

5. **Output, before and after** - only when the change alters a data value that the reader can inspect: a
   record, a file's contents, or an API payload. Give one `before` block and one `after` block, in real
   JSON values per the rule up top.

   ```json
   { "before": <real value, e.g. {"count": 1}> }
   ```

   ```json
   { "after": <real value, e.g. {"count": 2}> }
   ```

   Before-and-after JSON covers a data change, and a before-and-after graph covers a flow change. When the
   change is behaviour or flow rather than a record, write no JSON here. Show it as the before-and-after
   diagram in *How it works*.

6. **How it works** - the final PR body only, and only when the flow actually changes. No details. Prefer
   a diagram over prose, in the `diagram` house style: a committed self-contained SVG. Embed it by its
   `github.com/<owner>/<repo>/raw/<branch>/…` URL, so that it renders in the PR. Scope the graph to the
   change, and pick its shape by the kind of change:

   | The change | The graph |
   | --- | --- |
   | a whole new process or flow | draw the entire thing as one graph |
   | a new step inside an existing flow | draw exactly 5 nodes, in order: start, the step before, your step (centre, highlighted), the step after, end. The two end nodes summarise everything outside the middle three. |
   | a change to how an existing flow works | draw a before-and-after pair: the old path and the new path, stacked or side by side |

   A bugfix or a format swap that does not change the flow gets no diagram.

## What was tried before, and why it didn't work

Include this section whenever the work has prior art. That covers an earlier design that this replaces, a
reverted attempt, and an approach that evidence killed. A round that QA rejected counts too. One row each:

| Attempt | Why it was tried | Why it didn't work |
| --- | --- | --- |
| One dynamic workflow per build | one script could fan out and return a single verdict | a workflow can't pause, so a layer-1 failure surfaced only after layers 2 and 3 were built on it |

Two rules keep it honest. Name the evidence that killed it, such as "QA failed it three rounds running" or
"183 of 615 shell calls", never a vibe. Then say when it would become viable again, if the blocker was
circumstantial rather than fundamental.

No prior art means no section. Never pad with a strawman that you never seriously considered.

## Keep in mind (last)

Future work, plus any gotcha found. Say how each gotcha was worked around. An unsolved one is noted here,
so that nobody re-attempts it.

## Skeleton (copy, fill, delete the guidance)

The skeleton below is the final PR body, and a layer body differs by the five rows in the table up top.
Repeat the per-change block once per summary bullet, in the same order. Drop any part that does not apply.

````markdown
<!-- outputty:layer <task-id,…> -->        (layer PR body only)

## Summary        (final PR body; a layer body heads with "## <what this layer did>" instead)

- <plain-language bullet: what changed and, in a few words, why. A non-engineer should grasp it.>

## What we're building towards

<the canonical top-level program from architecture.md's "What we're building towards" section. Code never paraphrased, annotated ✅ done or ⏳ pending.>

Input:

```json
<valid JSON: real values a reader can copy and validate; no ellipsis, no prose>
```

Output:

```json
<final PR body: real output, because master QA ran it. Layer PR body: expected output, labelled expected.>
```

<multi-run behaviour, such as an SCD2 load, repeats as labelled pairs: "Run 1 input:", "Run 1 output:", …>

## <change: the same wording as its summary bullet>

<Why, in plain language: the problem that this solves. Define any jargon at first use.>

How to call it        (only when something real is callable. Otherwise omit the section, with no filler.)

```lang
<the top-level, user-facing call: one function, or a source → transform → destination composition;
 simplified data but a real call shape; not the implementation of what changed>
```

How to verify: <the exact request to send, the file or response to inspect, or a specific test to run>

Tests        (gotcha tests only, never the full list. None means omit.)

| Test | Gotcha it pins |
| --- | --- |
| <test name> | <the non-obvious edge it protects> |

<Output, before and after: two JSON blocks of real data values, only when a record, a file or an API payload changes. Never prose inside JSON. Flow changed but no record? Use the before-and-after graph below instead.>

<How it works: final PR body only. A high-level diagram via the diagram skill, only when the flow changes, including the before-and-after graph for a flow change with no record diff.>

## Keep in mind

- <future work, plus any gotcha found: how it was worked around, or a note so that nobody re-attempts it>
````
