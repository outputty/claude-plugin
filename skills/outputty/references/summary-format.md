# Summary format (enforced) — cases with runnable examples

One shape for **any summary of shipped work**: a cycle, a build, a stack of PRs, a set of changes.
Reach for it on "summarise", "show me what changed", "what did we ship".

**Get the examples before you write.** Read the executed docs, the test, or the run output, and quote
them. A snippet reconstructed from memory of the API is how a wrong example ships inside a summary that
otherwise looks authoritative.

## The shape

1. **One base pipeline, established once**, at the top. Every later case reads against it, so the
   reader builds the mental model once instead of once per section.
2. **One numbered case per capability, titled by the user's problem.** Write "Rebuild one model — *my
   transform was wrong*", never "TableResetStrategy". The feature name is what you called it; the
   problem is what they came for.
3. **Per case: `Before:` the old call, then the new code.** The contrast carries the change. A new API
   shown alone does not say what moved.
4. **Real observed output, in fenced blocks.** Actual run output, actual error text, actual returned
   JSON. **Never prose inside braces, never an invented value.** A value you did not observe does not
   appear.
5. **Show the failure case, not only the happy path** — the typo, the error now raised, the thing that
   used to be silent. This is usually the most valuable case on the page.
6. **Close with a cost/caught table.** Diff size, suite numbers, gate results. Then the bugs found,
   each **attributed**: the adversary at SPEC, master QA round 2, a spike, the user's own instinct. Say
   what was killed. Say when the user's instinct beat the plan.
7. **Tables for scannable facts. Prose only for judgement.**

## Why this shape

The reader uses a summary to decide what to do next, not to be reassured. Real code beside real output
is checkable in seconds; prose about what the code does is not. One invented output value destroys
trust in every other number on the page.

Attribution earns its own line because it says which parts of the process are paying for themselves.

## Skeleton

````markdown
## The base pipeline

```ts
<the one program every case reads against>
```

## 1. <the user's problem, in their words>

Before:

```ts
<the old call>
```

Now:

```ts
<the new call>
```

```text
<REAL output — pasted from the run, never composed>
```

## 2. <the next problem>
…

## What it cost, and what it caught

| | |
| --- | --- |
| Diff | +N / −M across K files |
| Suite | N passed, M skipped |
| Gates | <green-gate result, master QA verdict> |

| Bug | Found by |
| --- | --- |
| <what it was> | <adversary at SPEC / master QA round 2 / spike / the user> |
````
