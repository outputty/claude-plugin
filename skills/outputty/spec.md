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

**First concrete artifact: the target program.** Before architecture is discussed, draft the
**"What we're building towards"** block — a concrete, runnable example of how the final implementation
(or the section this feature serves) will look to the user/agent: the exact code they'll write
(source → transform → destination for pipeline work), with expected output stated. Informed by the
North Star, but not the North Star — it shows the finished surface explicitly. Agree it with the user;
it becomes the build's executable acceptance (PLAN pins the last layer to it, master QA runs it) and the
canonical code every PR write **snapshots** — annotated implemented/pending per layer, with real outputs
(see `references/pr-description.md`).

## Log the thought-trail — before the next question, every time

**Write the trail line for the answered question BEFORE asking the next one — one line, lite format,
no exceptions.** Append to `.claude/trails/<branch>.md`: the question, what was decided, and **what was
branched or dropped** (the alternatives considered and set aside). This is not passive note-taking —
it is crash insurance: a session that dies mid-grilling with decisions living only in chat forces
recovery from raw transcripts (verified live: several locked API decisions existed nowhere else).
Keep it terse, one line per node.

## Resolve into product.md

When a business or technical point crystallises, write it into `.claude/product.md` immediately, in
its section order — the doc reads **top-down from surface to depth**:

1. **North Star** — why this exists, in business terms.
2. **What we're building towards** — the target program (above): the concrete final surface.
3. **Architecture** — the solution one level down: general direction, no implementation detail,
   supplemented with **Mermaid** flowcharts (product.md is agent-consumed markdown — Mermaid, never an
   SVG; SVGs via `outputty-diagram` are for human surfaces like the README and PRs).
4. **Protocols** — the agreed seams that tie each layer to the one above: per seam, the inputs the
   parent supplies and the outputs the child returns. **The child knows nothing about its parent** —
   it exposes inputs → outputs; the parent composes. PLAN derives task `contract`s from these.

Pin any term worth fixing under a short **Language** subsection there. Prune anything the new decision
makes stale — `product.md` is living, not append-only. No separate `CONTEXT.md`, no ADRs.

## Gate

Do not proceed to PLAN until the user confirms the spec is right.
