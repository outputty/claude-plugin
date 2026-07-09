---
name: outputty-grill
description: Grilling session that stress-tests a plan one question at a time. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.md and the branch trail — not CONTEXT.md/ADRs.
---

# outputty-grill — stress-test a plan, one question at a time

Interview the user relentlessly about every aspect of the plan until you reach a shared
understanding. Walk down each branch of the design tree, resolving dependencies between decisions
one by one. For each question, provide your recommended answer.

Ask questions **one at a time**, waiting for feedback on each before continuing. Keep each question
short — one idea, one recommendation. If the framing is longer than the decision, cut the framing.

If a question can be answered by exploring the codebase, explore it instead — check OpenWolf's
`.wolf/anatomy.md` first so you read the fewest files.

## Technique

### Validate every claim (non-negotiable)
The **verify-by-running-then-source** rule is always-on — injected every session (see the SessionStart
protocol's "Always-on rules"): run the cheapest reproducing command first, only reach outward to a
source when a run can't answer, else say "unverified". It applies here with grilling's edge —
**cite-or-drop:** every factual or technical claim you make in a grill is backed by a run you did or a
source you can quote, never recall or inference. Confident-but-wrong claims are the exact failure this
rule exists to kill.

### Challenge the language
When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you
mean the Customer or the User? Those are different things." Pin the winner; list the rejected
synonyms. Every pinned term goes into product.md's **Language** subsection (see output).

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
  question, the decision, and what was branched or dropped.
- **Resolved decisions** → write into `.claude/product.md` (North Star for business, Architecture
  for technical) as they crystallise. Prune stale content — product.md is living, not append-only.
- **Language** → pin every canonical term in product.md's short **Language** subsection: the term, a
  one-line definition, and the rejected synonyms it replaces. This is the shared vocabulary the plan
  and build phases read from — one surface, not a parallel glossary.

Operational memory stays OpenWolf's — **never hand-write `.wolf/`** (no CLI writes
cerebrum/buglog/memory; its own hooks own them). Read `.wolf/anatomy.md` for navigation and
`openwolf bug search <term>` to check known gotchas; that is the extent of grill's OpenWolf
interaction.

## Advanced mode

Two modes; **simple is the default** (everything above). Offer **advanced** only for a non-trivial
plan and only **after grounding**, via an `AskUserQuestion` whose labels name the extra turns and the
one workflow wait — so the user opts into the cost knowingly. Deselecting it just continues the simple
one-question interview.

Advanced adds three stages:

1. **Ground, then Why → What → How.** Read `product.md`/`anatomy.md` and fetch external references
   first, then interview along a Why → What → How agenda (motivation → what to build → does the
   implementation serve the why) — still one question at a time, with a standing "proceed now" escape.
2. **Assemble a panel, run it as ONE dynamic workflow.** Compose by **orthogonal lens, not scope
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
   pasted text). Then run one dynamic workflow that fans out `outputty-expert` (one per lens — its slug
   + sources + question injected) and `outputty-adversary` (always, even with zero experts). Every agent
   is **cite-or-drop**, reads and refreshes its own `.claude/experts/<slug>.md` knowledgebase, and pulls
   the latest from the web. The agents are plugin-shipped and selected by `agentType`; project
   `.claude/agents/` files do **not** register — see the README's "How grilling works" section.

   **Model policy — pin per-call.** Fan out every agent on `{ model: 'opus', effort: 'medium' }` (real
   `agent()` options). Grilling is the plan's stress test, so it must not *inherit* the session model:
   inheritance silently drops to Sonnet on a Sonnet session, or balloons to Opus-at-xhigh under
   `ultracode`. The pin has to ride the `agent()` call — agent-frontmatter `model` is **moot inside a
   workflow** (it is honored only for interactive Agent-tool dispatch), the same silent-inheritance trap
   [build.md](../outputty/build.md)'s two-tier model policy guards against.
3. **Synthesize in the session.** The workflow returns one report; the **session** (no separate
   arbiter) weighs it against `product.md`, presents a decision-ready summary + a convergence verdict,
   and routes decisions → `product.md`, trail → the branch trail. The user re-rounds or proceeds to PLAN.
