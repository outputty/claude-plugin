---
name: grill
description: Grilling session that stress-tests a plan in rounds — the whole answerable frontier at once, each question with a recommendation. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.yaml and the branch trail — not CONTEXT.md/ADRs.
---

# grill — stress-test a plan, one round at a time

Interview the user relentlessly about every aspect of the plan until you reach a shared
understanding. Walk the design tree: each decision spawns the decisions that depend on it. For every
question, give your recommended answer.

## Ask in rounds — the whole frontier, then stop

**The frontier is every question whose dependencies are already settled** — answerable **now**, without
assuming anything unconfirmed. A question resting on an open decision belongs to a later round; asking
it early buys an answer to a hypothetical. This makes a grill's state MECE and checkable: every known
question is **frontier** (askable now), **blocked** (waiting on a frontier answer), or **fog** (not yet
phrasable — the trail's *Not yet specified*).

**Ask the whole frontier in one round, numbered, each with your recommendation. Then wait.** One
question per message wastes a round-trip on every independent decision; a round lets the user answer
five settled questions in one pass and see how they relate.

```
❓ **Q1** — **<question title>**: <the question, one idea. Alternatives if they exist.>

➡️ <your recommended answer, and why in one line>

❓ **Q2** — **<question title>**: <…>

➡️ <…>
```

**Each answer expands the frontier**, so recompute and ask the next round. Never bundle a blocked
question into the current round to look thorough — that is the round the user answers wrong.

**Use `AskUserQuestion` for exactly two shapes, never as the default:**

| Shape | Why the tool |
| --- | --- |
| **"Which do you prefer?"** — 2–4 concrete options the user picks between | Selection is what the tool is for; the options render as choices instead of prose to re-type |
| **"Get this one right first"** — a single decision the rest of the round depends on | Isolating it stops four other answers being given against a premise that is about to change |

Everything else is the numbered round above. A frontier of five questions is five numbered items in one
message — not five tool calls, and not five separate turns.

**Finding facts is your job, never the user's.** A frontier question needing environmental data — what
the code does, what a library returns, what a doc says — is **not** a question for the user. Answer it
yourself: `LSP` for a symbol, `Read` for a known file, and **dispatch `outputty:outputty-scout`** when
it would take more than a couple of lookups. Research is **non-blocking**: a question waiting on a
lookup is simply an unsettled precondition, so carry on with the rest of the frontier meanwhile. The
user decides; you supply what the decision needs.

## Technique

### Structure every substantive turn — and stop there
Verbosity is the failure mode of grilling and planning. When you present a decision, a recommendation,
or an explanation, use this shape and **nothing more**:

1. **Plain-language summary** — the point in one or two sentences a non-engineer grasps: what's being
   decided or recommended, and why. This leads, always.
2. **Highest-level code example** — the **topmost** call that showcases the point, the way an e2e test
   exercises the outermost function a user invokes. A few lines, real call shape, simplified data.
   **Omit it when the decision is not code-shaped**: a business goal, a naming call. Never pad with a
   token example.
3. **Technical detail** — the mechanics, kept to what the decision needs, with every term **used exactly
   as `product.yaml`'s Language / `architecture.yaml`'s seams define it** (pin a new term there first — see *Challenge the
   language*). This is the only part that goes deep.

If the framing is longer than the decision, cut the framing. This shape is how **each numbered
question** in a round is presented — it is not licence to bundle a blocked question into the round. **⚠ mark the one thing
the user must weigh** — the trade-off or default their answer changes. And when a question lands badly,
**reframe it as a worked example at the highest level, never as more abstract prose** — a reframe that
adds abstraction is the thing being complained about.

**Option sets are MECE.** When you present choices, each option is a distinct home (no option contains
another) and together they cover the space — name "neither, because…" explicitly when it is live.

**Explaining why something _doesn't work_ uses a four-part variant:** (1) the problem in one plain
sentence; (2) the **concrete example** that fails; (3) a **generalised, stripped-down** version — the
same failure with all business logic removed, reduced to language/runtime basics; (4) the technical
explanation, terms per `product.yaml`. Parts 2 and 3 are **not hypothetical — you ran both** (the
always-on verify-by-running rule, and *Validate every claim* below): a split result — the concrete
fails but the stripped-down passes, or vice versa — localises the cause and *is* the finding. Never
assert "this won't work" from caution without reproducing it.

### Raise the user's assumptions, and check each one against reality

**A grill validates *your* claims (below). This validates *theirs*.** A request carries premises the user
never said out loud because to them they are simply true — "we already do X", "Y is what this is for",
"Z can't work". Those are the ones that survive into a SPEC unexamined and surface three layers into a
build as *"there has been some miscommunication"*.

**Keep a running assumption ledger and clear it before the SPEC resolves.** Every premise the request
rests on gets written down and given one of three verdicts:

| Verdict | What it means | What you do |
| --- | --- | --- |
| **Grounded** | It already exists — you found the code, ran it, or read the measurement | Cite the anchor: repo-internal → the code/`architecture.yaml` line; external (library, platform, searched opinion) → the claim file (`.claude/claims/<slug>.yaml`), created if the run is fresh. One line, move on. |
| **Absent** | It does not exist, or does not work the way the premise says | **Say so immediately.** This is the highest-value moment in a grill — the whole request may change shape, and it costs nothing now versus a build later. |
| **Unknown** | Can't be settled by reading | It is a **spike**, not a discussion. Run it. |

Three rules make the ledger real rather than ceremony:

- **Check what *doesn't* exist, not just what does.** A premise about a capability the project lacks reads
  identically to one about a capability it has — until you look. "We already handle this" is a claim with
  a file behind it or it is a gap.
- **Query `bun "/skills/outputty/docs.js" lessons --json`** — and **its absence is an answer, not an
  error.** The file is written by the docs agent at a merge step, so a project that has not completed
  a cycle does not have one yet; query it, and if it is missing, note "no lessons yet" and move on. A
  premise the project already tried and abandoned is not an open
  question, it is a settled one, and re-deciding it costs the same as deciding it did. If the ledger hits
  a lesson, the answer is *"this was tried; here is what killed it"* — the user may still overrule, but
  they overrule with the evidence in front of them.
- **Never verify a premise by agreeing with it.** "Yes, that's how it works" without a citation is the
  failure mode this exists to stop, and it is indistinguishable from a real answer at the time.

**The user's own premises get the same bar as yours.** They explore out loud and are sometimes wrong;
surfacing a premise as *absent* is help, not contradiction. A ledger entry you can't resolve stops the
grill — an unresolved premise is exactly what a gate is for.

### Validate every claim (non-negotiable)
The **verify-by-running-then-source** rule is always-on (the SessionStart protocol's "Always-on rules").
Grilling's edge on it is **cite-or-drop:** every factual or technical claim you make in a grill is backed
by a run you did or a source you can quote, never recall or inference. Confident-but-wrong claims are the
exact failure this rule exists to kill.

### Challenge the language
When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you
mean the Customer or the User? Those are different things." Pin the winner; list the rejected
synonyms. Every pinned term goes into product.yaml's **Language** section (see output).

### Ground abstract decisions in a concrete example
Whenever a question turns on a non-obvious concept — and *always* the moment the user signals they're
lost ("I don't get it", "over my head", "too verbose") — stop explaining in the abstract. Walk
through one small worked example instead: a before/after, or a step-by-step of a single interaction,
built **only from the canonical terms already pinned in product.yaml's Language** (never fresh jargon)
and **on the canonical data in `.claude/examples.yaml`** — reuse the example the user already knows; a
new one is pinned there first.
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

## Done — the frontier is empty

**The grill ends when the frontier is empty**: every branch of the design tree examined, every premise
in the ledger resolved to grounded / absent / spiked, and no question left that is answerable now.
"Feels like enough" is not a completion criterion — an unresolved premise is exactly what the SPEC gate
exists to catch, so name what is still fog and let it stay fog rather than closing over it.

Then stop. **Take no action until the user confirms the shared understanding** — that confirmation is
the SPEC gate.

## Output

This is the engine of outputty's memory model. Do **not** write `CONTEXT.md`, ADRs, or a separate
glossary file — outputty keeps the fewest memory surfaces.

- **Thought-trail** → append one record to the `decisions:` list in
  `.claude/trails/<branch>.trail.yaml` for each node: `question`, `answer` (the decision, and what was
  branched or dropped), `link`. **Write it for the answered question BEFORE asking the next — no
  exceptions.** A mid-grill crash with decisions living only in
  chat forces recovery from raw transcripts; the trail line is the insurance.
- **Resolved decisions** → route by doc (`product-template.md` owns the table): North Star/Language →
  `.claude/product.yaml`, feature status → `.claude/roadmap.yaml` (one-line rows, Status &
  roadmap for feature status, What we're building towards for the target surface, Architecture — with its
  seams — for technical) as they crystallise. Prune stale content — sections 1–5 are living, not
  append-only; a real pivot moves down into **History**. Any ✅-shipped claim is **run first**, never
  guessed (see the product-template's hard rule).
- **Language** → pin every canonical term in product.yaml's top-level **Language** section: the term, a
  one-line definition, and the rejected synonyms it replaces. This is the shared vocabulary the plan
  and build phases read from — one surface, not a parallel glossary.

Durable lessons — gotchas, preferences, corrections — go to **Claude Code auto-memory**, never into
`product.yaml`. Grill reads memory for known gotchas before re-litigating a settled question; it writes
memory only at the end of a cycle, and only for a lesson that would have saved time.

## Advanced mode

Two modes; **simple is the default** (everything above). Offer **advanced** only for a non-trivial
plan and only **after grounding**, via an `AskUserQuestion` whose labels name the extra turns and the
one parallel fan-out — so the user opts into the cost knowingly. Deselecting it just continues the simple
one-question interview.

Advanced adds three stages:

1. **Ground, then Why → What → How.** Read the product docs, survey the code, and fetch external references
   first, then interview along a Why → What → How agenda (motivation → what to build → does the
   implementation serve the why) — still one round at a time, with a standing "proceed now" escape.
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
   arbiter) weighs it against the product docs, presents a decision-ready summary + a convergence verdict,
   and routes decisions → the product docs, trail → the branch trail. The user re-rounds or proceeds to PLAN.
