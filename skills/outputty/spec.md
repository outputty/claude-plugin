# SPEC phase — intent, gated

Goal: a shared, precise understanding of **what** to build and **why**, separated cleanly into
business and technical intent. Output lands in the trail (thought-trail) and, once resolved, in
`product.md`.

## Load first

`.claude/product.md` is already in context from the SessionStart hook. Re-read it now as the
baseline — every question is asked against the current North Star + Architecture.

## Run the grilling

Use the `grill` skill's technique: interview relentlessly, **one question at a time**,
recommend an answer for each, backtrack and surface conflicts, explore the codebase (via OpenWolf's
`anatomy.md`) instead of asking when the answer is discoverable.

**Simple grilling is the default.** For a non-trivial plan, after grounding, offer the user
**advanced** grilling (an `AskUserQuestion`, cost named) — the `grill` skill's advanced mode
adds a Why → What → How agenda and an expert + adversary panel fanned out as parallel subagents. Simple
stays the default.

Ask in **two distinct passes — never conflate them**:

1. **Business goals.** Who is this for, what outcome, what does "done" mean in user/business terms,
   what is explicitly out of scope. Feeds the **North Star**.
2. **Technical goals.** Constraints, integration points, data shape, trade-offs, what must not
   break. Feeds the **Architecture**.

**First concrete artifact: the target program.** Before architecture is discussed, draft the
**"What we're building towards"** block — a concrete, runnable example of how the final implementation
(or the section this feature serves) will look to the user/agent: the exact code they'll write
(source → transform → destination for pipeline work), with **Input / Output as distinct valid-JSON
blocks**, then descending into per-feature detail (its knobs, each with example JSON I/O). Informed by
the North Star, but not the North Star — it shows the finished surface explicitly. Agree it with the user;
it becomes the build's executable acceptance (PLAN pins the last layer to it, master QA runs it) and the
canonical code every PR write **snapshots** — annotated implemented/pending per layer, with real outputs
(see `references/pr-description.md`).

## Spike — optional, when talk can't settle it

Grilling is cheap talk, and cheap talk answers most questions. Some questions it **structurally can't**:
those are empirical, not arguable. For those, build a **throwaway spike** — code whose only job is to
answer one question — and have the higher-fidelity conversation against something real.

**Trigger it only when one holds** (otherwise keep grilling — this is opt-in, not a stage everyone walks
through):

- the same question has taken **2+ grilling rounds without converging**, or
- the question is about **feel/ergonomics** ("how should this read at the call site?"), **behaviour under
  edge cases** (a state model that's hard to reason about), or **what a dependency actually does** — the
  kind of thing the always-on verify-by-running rule settles by *running*, not by arguing.

**How it runs:**

1. **2–3 variants, not one.** Build option A/B/C so the user picks elements from each — a concrete choice
   beats an abstract one. For a state model or a protocol, a tiny interactive CLI beats a description.
2. **It lives in the scratchpad dir**, not the repo — session-isolated, so it *cannot* leak into the
   branch. The one exception is a variant that must run inside the app (a UI option): put it on a
   **throwaway branch that is never merged**, and say so when you cut it.
3. **The answer survives; the code dies.** Write the trail line (decision + what was dropped), then
   **redraft the target program above** with what you learned — that is the whole point of the spike.
   **Delete the spike.** It is never the reference implementation: BUILD works from the `contract` and its
   test, never from spike code, so a spike's shortcuts can't ride into production under "cleanup".

A spike can fire mid-grilling — take the answer back into the interview and carry on. Not to be confused
with two neighbours: **SIMULATE** (PLAN — *which design*, read-only reports, never code) and
**`stage: prototype`** (BUILD — the first *real* commit, kept and matured). Spike is SPEC only, and its
artifact is always discarded.

## Log the thought-trail — before the next question, every time

**Write the trail line for the answered question BEFORE asking the next one — one line, lite format,
no exceptions.** Append to `.claude/trails/<branch>.md`: the question, what was decided, and **what was
branched or dropped** (the alternatives considered and set aside). This is not passive note-taking —
it is crash insurance: a session that dies mid-grilling with decisions living only in chat forces
recovery from raw transcripts (verified live: several locked API decisions existed nowhere else).
Keep it terse, one line per node.

## Resolve into product.md

When a business or technical point crystallises, write it into `.claude/product.md` immediately, in the
canonical section order (the full rules + skeleton live in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md` — read it). The doc reads
**top-down, surface → depth**:

1. **North Star** — the elevator pitch (plain-language first paragraph, no technical examples) + the
   strong-side examples + the precise wedge. Business intent.
2. **Status & roadmap** — where things stand + one table of **every** feature, status-badged
   (✅ shipped / 🔨 in progress / 📋 planned), ordered so deps precede dependents. Feature-level, not
   the task graph.
3. **Language** — its own section now: canonical terms, one line each, rejected synonyms. Current
   vocabulary only.
4. **What we're building towards** — the target program (above) with Input/Output JSON, descending into
   per-feature detail (knobs + example JSON I/O).
5. **Architecture** — the solution one level down: the **seams** (the protocols — per seam, inputs the
   parent supplies → outputs the child returns; the child knows nothing of its parent; PLAN derives task
   `contract`s from these), the shape, and each pattern shown explicitly. Direction-level, no
   implementation detail, **Mermaid**-heavy (agent-consumed markdown — Mermaid, never an SVG; SVGs via
   `diagram` are for human surfaces like the README and PRs).
6. **History** — the chronology oldest → latest; superseded detail folds down here.

**Verify before you write.** Any claim about **already-shipped** behaviour (a ✅ feature, an existing
API/flag) must be **run in the codebase first** — real output, no guessing (see the template's hard
rule). Target behaviour (🔨/📋) is shown as *expected*, marked, never asserted as shipped.

Sections 1–5 are living: **prune** anything the new decision makes stale — or move a real pivot down into
**History**, the only append-only section. No separate `CONTEXT.md`, no ADRs.

## Gate

Do not proceed to PLAN until the user confirms the spec is right.
