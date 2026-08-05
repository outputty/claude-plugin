# SPEC phase — intent, gated

Goal: a shared, precise understanding of **what** to build and **why**, separated cleanly into
business and technical intent. Output lands in the trail (thought-trail) and, once resolved, in
`product.md`.

## Load first

`.claude/product.md` is already in context from the SessionStart hook. Re-read it now as the
baseline — every question is asked against the current North Star + Architecture.

## Run the grilling

Use the `grill` skill's technique: interview relentlessly, **one question at a time**,
recommend an answer for each, backtrack and surface conflicts, and explore the codebase (LSP symbol
lookup where the language has a server, `Grep`/`Glob` otherwise) instead of asking when the answer is
discoverable.

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

## Spike — the default, not the fallback

Grilling is cheap talk. Cheap talk cannot settle an empirical question, and **most of what a SPEC decides
is empirical**: does this already work, what does it cost, what breaks if it goes. So a spike is not what
you reach for when the argument stalls — it is what you do **instead of having the argument**.

**Never state a design position you have not run.** "This won't work", "that would be ambiguous", "this
costs too much" are all claims a spike settles in minutes, and a position taken without one is a guess
wearing a rationale. Measured on a real cycle: a design was argued against across two rounds of pushback
and a flat *"No, this is wrong"* — then spiked **thirteen hours later** and proven viable on the first
try. The spike was never the expensive part; the argument was.

**How much spike, by what kind of change:**

| The change is… | Spike |
| --- | --- |
| **A variation on something already here** — a different flavour of an existing shape, and you can point at the evidence it already works | **Quick.** One question, minutes, enough to confirm the shape holds. Not a survey, not a write-up, no "does this make sense" essay. |
| **New capability, or a change in direction** | **Heavily, before any proposal.** No plan is drafted until the spike answers whether it works and what it costs. |
| **A simplification, a deletion, or "can we make this simpler?"** | **Heavily, before any proposal** — and see the deletion rule below, which is the one people skip. |

**Assumptions need existing evidence.** You may build on something only when you can point at what makes
it true — code that already does it, a measurement, a doc you read. "It should work like X" is a spike
waiting to happen, not a premise. This is where SPECs go wrong quietly: an unspiked assumption is
indistinguishable from a settled one three documents later.

### Deleting is a spike too — and the tests are the specification

**Simplification means the same expected outcome with less machinery.** That framing is load-bearing: if
the outcome is unchanged, **the tests that define the outcome must still pass, unchanged.**

- **Keep every test exactly as it is** through a simplification. They are the proof the outcome survived.
  Rewriting a test to fit the new shape converts "I simplified this" into "I changed what it does" without
  anyone noticing.
- **Delete a test only when the feature it covers is being deleted** — when the capability is judged
  useless and will not be supported. That is a **product decision**, not a simplification, and it belongs
  in `product.md` before the test goes.
- **Price what you are removing before you scope its removal.** A deletion is a claim that the thing is
  not worth its cost; that claim needs a number. Measured on a real cycle: a component was scoped for
  deletion, then re-priced at **~156 lines confined to the two packages that benefit, buying ~50% on the
  path it serves** — the verdict **inverted** and it stayed. The measurement had existed the whole time
  and nobody consulted it until after the kill was written.
- **Delete one thing at a time.** The same cycle bundled four separate concerns into one narrative and
  applied a single verdict to all of them; exactly one turned out to be harmful. **A verdict applies to
  the unit you measured, never to the story it arrived in.** If you cannot price it separately, you have
  not scoped it separately.

**How it runs:**

1. **2–3 variants, not one.** Build option A/B/C so the user picks elements from each — a concrete choice
   beats an abstract one. For a state model or a protocol, a tiny interactive CLI beats a description.
2. **It lives in `tmp/` at the repo root** — gitignored, created on first use:

   ```bash
   mkdir -p tmp && grep -qxF 'tmp/' .gitignore || echo 'tmp/' >> .gitignore
   ```

   **Inside the repo, not the session scratchpad.** A path outside the project root triggers a
   permission prompt on every single write, which stalls exactly the workflow a spike is meant to keep
   moving. Gitignored gives the isolation the scratchpad was for: it cannot reach a commit, and the
   commit stage stages only each task's declared scope (never `git add -A`), so there are two
   independent reasons it can't leak into the branch. A variant that must run inside the app (a UI
   option) still goes on a **throwaway branch that is never merged** — say so when you cut it.
3. **The answer survives; the code dies.** Write the trail line (decision + what was dropped), then
   **redraft the target program above** with what you learned — that is the whole point of the spike.
   **Delete the spike.** It is never the reference implementation: BUILD works from the `contract` and its
   test, never from spike code, so a spike's shortcuts can't ride into production under "cleanup".

**Quick spikes stay quick.** A variation on something that exists gets one question and a run, not a
report. The write-up is the trail line; if you are drafting sections, you have turned a five-minute check
into the deliverable.

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
