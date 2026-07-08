# SPEC phase — intent, gated

Goal: a shared, precise understanding of **what** to build and **why**, separated cleanly into
business and technical intent. Output lands in the trail (thought-trail) and, once resolved, in
`product.md`.

## Load first

`.claude/product.md` is already in context from the SessionStart hook. Re-read it now as the
baseline — every question is asked against the current North Star + Architecture.

## Run the grilling

Use the `outputty-grill` skill's technique: interview relentlessly, **one question at a time**,
recommend an answer for each, backtrack and surface conflicts, explore the codebase (via OpenWolf's
`anatomy.md`) instead of asking when the answer is discoverable.

**Simple grilling is the default.** For a non-trivial plan, after grounding, offer the user
**advanced** grilling (an `AskUserQuestion`, cost named) — the `outputty-grill` skill's advanced mode
adds a Why → What → How agenda and an expert + adversary panel run as one dynamic workflow. Simple
stays the default.

Ask in **two distinct passes — never conflate them**:

1. **Business goals.** Who is this for, what outcome, what does "done" mean in user/business terms,
   what is explicitly out of scope. Feeds the **North Star**.
2. **Technical goals.** Constraints, integration points, data shape, trade-offs, what must not
   break. Feeds the **Architecture**.

## Log the thought-trail

As you go, append a *lite* line to `.claude/trails/<branch>.md` for each meaningful node: the
question, what was decided, and **what was branched or dropped** (the alternatives you considered
and set aside). This is the record grill never kept — keep it terse, one line per node.

## Resolve into product.md

When a business or technical point crystallises, write it into `.claude/product.md` immediately
(North Star or Architecture section). Pin any term worth fixing under a short **Language**
subsection there. Prune anything the new decision makes stale — `product.md` is living, not
append-only. No separate `CONTEXT.md`, no ADRs.

## Gate

Do not proceed to PLAN until the user confirms the spec is right.
