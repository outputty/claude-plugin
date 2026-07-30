---
name: grill
description: Grilling session that stress-tests a plan one question at a time. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.md and the branch trail — not CONTEXT.md/ADRs.
---

# grill — stress-test a plan, one question at a time

Interview the user relentlessly about every aspect of the plan until you reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between decisions
one by one. For each question, provide your recommended answer.

Ask questions **one at a time**, waiting for feedback on each before continuing. Keep each question
short — one idea, one recommendation. If the framing is longer than the decision, cut the framing.

If a question can be answered by exploring the codebase, explore it instead — an LSP symbol lookup
where the language has a server, `Grep`/`Glob` otherwise, so you read the fewest files.

## Technique

### Structure every substantive turn — and stop there
Verbosity is the failure mode of grilling and planning. When you present a decision, a recommendation,
or an explanation, use this shape and **nothing more**:

1. **Plain-language summary** — the point in one or two sentences a non-engineer grasps: what's being
   decided or recommended, and why. This leads, always.
2. **Highest-level code example** *(only when it makes sense)* — the **topmost** call that showcases the
   point, the way an e2e test exercises the outermost function a user/agent actually invokes, not the
   internals. A few lines, real call shape, simplified data. **Omit it** for a decision that isn't
   code-shaped (a business goal, a naming call) — never pad with a token example.
3. **Technical detail** — the mechanics, kept to what the decision needs, with every term **used exactly
   as `product.md`'s Language / Architecture seams define it** (pin a new term there first — see *Challenge the
   language*). This is the only part that goes deep.

If the framing is longer than the decision, cut the framing. One question at a time still holds — this
shape is how that *one* question is presented, not licence to bundle several.

**Explaining why something _doesn't work_ uses a four-part variant:** (1) the problem in one plain
sentence; (2) the **concrete example** that fails; (3) a **generalised, stripped-down** version — the
same failure with all business logic removed, reduced to language/runtime basics; (4) the technical
explanation, terms per `product.md`. Parts 2 and 3 are **not hypothetical — you ran both** (the
always-on verify-by-running rule, and *Validate every claim* below): a split result — the concrete
fails but the stripped-down passes, or vice versa — localises the cause and *is* the finding. Never
assert "this won't work" from caution without reproducing it.

### Validate every claim (non-negotiable)
The **verify-by-running-then-source** rule is always-on (the SessionStart protocol's "Always-on rules").
Grilling's edge on it is **cite-or-drop:** every factual or technical claim you make in a grill is backed
by a run you did or a source you can quote, never recall or inference. Confident-but-wrong claims are the
exact failure this rule exists to kill.

### Challenge the language
When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you
mean the Customer or the User? Those are different things." Pin the winner; list the rejected
synonyms. Every pinned term goes into product.md's **Language** section (see output).

### Ground abstract decisions in a concrete example
Whenever a question turns on a non-obvious concept — and *always* the moment the user signals they're
lost ("I don't get it", "over my head", "too verbose") — stop explaining in the abstract. Walk
through one small worked example instead: a before/after, or a step-by-step of a single interaction,
built **only from the canonical terms already pinned in product.md's Language** (never fresh jargon).
Show the concrete flow, then re-ask the question in one plain sentence with your recommendation. An
example the user can picture beats a paragraph of theory every time.

### Discuss concrete scenarios
Stress-test relationships with specific invented scenarios that probe edge cases and force precision
about boundaries between concepts.

### Backtrack and surface conflicts
When a new answer contradicts an earlier one — or the code — say so immediately. "Earlier you said
partial cancellation is possible, but this answer assumes whole-order cancellation. Which is it?"
Branch into the related decisions that the conflict exposes.

### Cross-reference with code
When the user states how something works, check whether the code agrees. Surface contradictions.

## Output

This is the engine of outputty's memory model. Do **not** write `CONTEXT.md`, ADRs, or a separate
glossary file — outputty keeps the fewest memory surfaces.

- **Thought-trail** → append a lite line to `.claude/trails/<branch>.md` for each node: the
  question, the decision, and what was branched or dropped. **Write it for the answered question
  BEFORE asking the next — one line, no exceptions.** A mid-grill crash with decisions living only in
  chat forces recovery from raw transcripts; the trail line is the insurance.
- **Resolved decisions** → write into `.claude/product.md` (North Star for business intent, Status &
  roadmap for feature status, What we're building towards for the target surface, Architecture — with its
  seams — for technical) as they crystallise. Prune stale content — sections 1–5 are living, not
  append-only; a real pivot moves down into **History**. Any ✅-shipped claim is **run first**, never
  guessed (see the product-template's hard rule).
- **Language** → pin every canonical term in product.md's top-level **Language** section: the term, a
  one-line definition, and the rejected synonyms it replaces. This is the shared vocabulary the plan
  and build phases read from — one surface, not a parallel glossary.

Durable lessons — gotchas, preferences, corrections — go to **Claude Code auto-memory**, never into
`product.md`. Grill reads memory for known gotchas before re-litigating a settled question; it writes
memory only at the end of a cycle, and only for a lesson that would have saved time.

## Advanced mode

Two modes; **simple is the default** (everything above). Offer **advanced** only for a non-trivial
plan and only **after grounding**, via an `AskUserQuestion` whose labels name the extra turns and the
one parallel fan-out — so the user opts into the cost knowingly. Deselecting it just continues the simple
one-question interview.

Advanced adds three stages:

1. **Ground, then Why → What → How.** Read `product.md`, survey the code, and fetch external references
   first, then interview along a Why → What → How agenda (motivation → what to build → does the
   implementation serve the why) — still one question at a time, with a standing "proceed now" escape.
2. **Assemble a panel and fan it out as parallel subagents.** Compose by **orthogonal lens, not scope
   cluster**: one expert per risk-axis that has real surface area — a lens that catches a class of
   failure the others structurally cannot. Collapse any two whose findings could be swapped unnoticed;
   they are one expert. A fixed disciplinary roster is just as wrong as scope-clustering — it forces
   irrelevant experts (a determinism refactor has no data-scientist lens); the test is distinctness
   **and** relevance. Name each by **canonical discipline slug** (`mobile-ux`, `determinism-algorithms`),
   never an ad-hoc "C1", so its knowledge accumulates across sessions. **Reuse before invent:** `Glob`
   `.claude/experts/*.md` first and prefer refining an existing expert whose lens fits over minting a
   new one. Favor specificity and keep the slate small: **4 is a hard ceiling that doubles as a scope
   smell — if more than 4 distinct lenses feel warranted, don't grow the panel: STOP and surface the
   over-scope with `AskUserQuestion`, offering 2–4 concrete ways to split or narrow the scope (each a
   smaller question a ≤4-lens panel could actually grill) plus a free-form **Other**, then grill only
   the narrowed scope the user picks.** The user multi-selects, adds their own via
   **Other**, and may attach references per expert (file → `Read`, public URL → `WebFetch`, private →
   pasted text). Then dispatch them: **one `outputty-expert` per lens** (its slug + sources + question
   injected) plus **`outputty-adversary`** (always, even with zero experts) — every `Agent` call in a
   **single message** so they run in parallel. Every agent
   is **cite-or-drop**, reads and refreshes its own `.claude/experts/<slug>.md` knowledgebase, and pulls
   the latest from the web. The agents are plugin-shipped and selected by the **namespaced** `subagent_type`
   (`outputty:outputty-expert`, `outputty:outputty-adversary` — the bare name errors at dispatch);
   project `.claude/agents/` files do **not** register — see the README's "How grilling works" section.

   **Model policy — pinned in the charters.** Every panel agent runs **Opus at `effort: 'medium'`**, set
   in its own frontmatter (`model` + `effort`), not at the call site. Grilling is the plan's stress test,
   so it must not *inherit* the session model — inheritance silently drops to Sonnet on a Sonnet session.
   Pass `model` on the `Agent` call only to override a charter deliberately.
3. **Synthesize in the session.** The reports come back to the **session**; it (no separate
   arbiter) weighs it against `product.md`, presents a decision-ready summary + a convergence verdict,
   and routes decisions → `product.md`, trail → the branch trail. The user re-rounds or proceeds to PLAN.
