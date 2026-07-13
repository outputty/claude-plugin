# PR description format (enforced)

One format for **every** write to a PR in the outputty flow — same shape at every scale:

- the **draft PR body** opened at branch-cut (core objective only, at first);
- each **per-layer comment** the BUILD commit agent posts as work lands (a mini PR description scoped to
  that one layer);
- the **final PR body** written at merge via `outputty-review`.

Keep it **human-readable and as untechnical as possible** — a non-engineer should grasp the summary.
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

## One section per bullet

One section per summary bullet, **same order**, heading = the bullet's own wording. Per section, in this
order (drop the parts that don't apply):

1. **Why** — the first paragraph. The problem / motivation this solves, **not** the mechanics.
2. **How to verify** — the fastest way a reviewer confirms it works: the exact request to send, the
   file/response to inspect, or a specific test to run (e.g. `uv run pytest tests/… -k …`).
3. **Output — before / after** — REQUIRED whenever the change alters output (a record, a file, or the
   API response). Show both as JSON:

   ```json
   { "before": … }
   ```
   ```json
   { "after": … }
   ```
4. **How it works** — ONLY when the flow actually changes; no details (that's what code review is for).
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

A layer comment's diagram — on the **rare** layer that changes a flow — is scoped to **that one layer's**
change (the added-step-5-node, before/after, or new-process shape above), never the whole task. The
commit agent draws it by following the `outputty-diagram` house style directly
(`${CLAUDE_PLUGIN_ROOT}/skills/outputty-diagram/SKILL.md` — read and apply it), writing the SVG into the
repo, committing + pushing it, then embedding it by raw URL. Most layers don't touch a flow, so **most
layer comments are text-only**. The whole-task overview graph belongs to the PR body, never a layer comment.

Lead every per-layer comment with a hidden marker naming the layer's task ids, so a resumed session can
tell which layers already have a comment (see BUILD's resume-safe preflight):

    <!-- outputty:layer <task-id,task-id,…> -->

## Skeleton (copy, fill, delete the guidance)

Repeat the per-change block once per summary bullet, in the same order. Drop any part that doesn't apply.
For a per-layer comment, prepend the `<!-- outputty:layer … -->` marker and use the layer's tasks as the
bullets.

```markdown
## Summary

- <one plain-language bullet per notable change — a non-engineer should grasp it>

## <change — same wording as its summary bullet>

<Why — the problem / motivation this solves, not the mechanics.>

How to verify — <exact request to send, file/response to inspect, or a specific test to run>

<Output — before / after — as two JSON blocks, only when the change alters output>

<How it works — a high-level diagram via the outputty-diagram skill, only when the flow changes>

## Keep in mind

- <future work; and any gotcha found — how it was worked around, or noted so it isn't re-attempted>
```
