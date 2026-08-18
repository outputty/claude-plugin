---
name: grill
description: Grilling session that stress-tests a plan in rounds — the whole answerable frontier at once, each question with a recommendation. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.yaml and the task's trail — not CONTEXT.md/ADRs.
---

# grill — stress-test a plan, one round at a time

Interview the user relentlessly about every aspect of the plan until you reach a shared understanding.
Walk the design tree: each decision spawns the decisions that depend on it. Give your recommended answer
for every question.

## Ask in rounds — the whole frontier, then stop

**The frontier is every question whose dependencies are already settled** — answerable **now**, without
assuming anything unconfirmed. A question resting on an open decision belongs to a later round. Every
known question is **frontier** (askable now), **blocked** (waiting on a frontier answer), or **fog** (not
yet phrasable — held as fog in the session).

**Ask the whole frontier in one round, numbered, each with your recommendation. Then wait.**

```
❓ **Q1** — **<question title>**: <the question, one idea. Alternatives if they exist.>

➡️ <your recommended answer, and why in one line>

❓ **Q2** — **<question title>**: <…>

➡️ <…>
```

**Each answer expands the frontier**, so recompute and ask the next round. Never bundle a blocked
question into the current round to look thorough.

**Use `AskUserQuestion` for exactly two shapes, never as the default:**

- **"Which do you prefer?"** — 2–4 concrete options the user picks between.
- **"Get this one right first"** — a single decision the rest of the round depends on.

Everything else is the numbered round above. A frontier of five questions is five numbered items in one
message — not five tool calls, and not five separate turns.

**Finding facts is your job, never the user's.** A frontier question needing environmental data — what the
code does, what a library returns, what a doc says — is **not** for the user. Answer it yourself: `LSP`
for a symbol, `Read` for a known file, and **dispatch the `scout` skill on `outputty:outputty-reviewer`**
when it would take more than a couple of lookups. Research is **non-blocking**: carry on with the rest of
the frontier meanwhile. The user decides; you supply what the decision needs.

## Technique

### Structure every substantive turn — and stop there

Present each numbered question in the output style's response shape: a plain-language summary, the
**highest-level** code example (omit it when the decision is not code-shaped — a business goal, a naming
call — never pad with a token one), then only the technical detail the decision needs. Use every term
exactly as `product.yaml`'s Language / `architecture.yaml`'s seams define it, pinning a new one there
first (see *Challenge the language*). If the framing is longer than the decision, cut it. This is per
numbered question, not licence to bundle a blocked question into the round. **⚠ mark the one thing the
user must weigh** — the trade-off or default their answer changes.

**Option sets are MECE.** Name "neither, because…" explicitly when it is live.

**Explaining why something _doesn't work_ uses a four-part variant:** (1) the problem in one plain
sentence; (2) the **concrete example** that fails; (3) a **generalised, stripped-down** version — the same
failure with all business logic removed, reduced to language/runtime basics; (4) the technical
explanation, terms per `product.yaml`. Parts 2 and 3 are **not hypothetical — you ran both**. A split
result, where the concrete fails but the stripped-down passes, *is* the finding. Never assert "this won't
work" from caution without reproducing it.

### Raise the user's assumptions, and check each against reality

**A grill validates *your* claims (below). This validates *theirs*.** A request carries premises the user
never said out loud: "we already do X", "Y is what this is for", "Z can't work".

**Keep a running assumption ledger and clear it before the SPEC resolves.** Every premise the request
rests on is written down and given one of three verdicts:

| Verdict | What it means | What you do |
| --- | --- | --- |
| **Grounded** | It already exists — you found the code, ran it, or read the measurement | Cite the anchor: repo-internal → the code/`architecture.yaml` line; external → the routed fact where its reader works (the `kind: limitation` architecture entry or CLAUDE.md rule carrying its probe, written if the run is fresh). One line, move on. |
| **Absent** | It does not exist, or does not work the way the premise says | **Say so immediately.** |
| **Unknown** | Can't be settled by reading | It is a **spike**, not a discussion. Run it. |

Three rules make the ledger real:

- **Check what *doesn't* exist, not just what does.** "We already handle this" has a file behind it or it
  is a gap.
- **Query `bun "${CLAUDE_PLUGIN_ROOT}/skills/outputty/docs.js" lessons --json`** — and **its absence is an
  answer, not an error.** If it is missing, note "no lessons yet" and move on. If the ledger hits a
  lesson, the answer is *"this was tried; here is what killed it"*, and the user may still overrule.
- **Never verify a premise by agreeing with it.** "Yes, that's how it works" without a citation is not
  verification.

**The user's own premises get the same bar as yours.** Surfacing a premise as *absent* is help, not
contradiction. A ledger entry you can't resolve stops the grill.

### Validate every claim (non-negotiable)

Grilling's edge on the always-on verify-by-running rule is **cite-or-drop:** every factual or technical
claim you make is backed by a run you did or a source you can quote.

### Challenge the language

When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — do you mean the
Customer or the User? Those are different things." Pin the winner; list the rejected synonyms. Every pinned
term goes into product.yaml's **Language** section (see output).

### Ground abstract decisions in a concrete example

The moment the user signals they're lost ("I don't get it", "over my head", "too verbose"), re-pitch as
the output style says: walk through one small worked example — a before/after, or a step-by-step of a
single interaction — built only from the canonical terms in `product.yaml`'s Language and the canonical
data in `.claude/examples.yaml`. Then re-ask the question in one plain sentence with your recommendation.

### Discuss concrete scenarios

Stress-test relationships with specific invented scenarios that probe edge cases and force precision about
boundaries between concepts.

### Backtrack and surface conflicts

When a new answer contradicts an earlier one — or the code — say so immediately. "Earlier you said partial
cancellation is possible, but this answer assumes whole-order cancellation. Which is it?" Branch into the
related decisions the conflict exposes.

### Cross-reference with code

When the user states how something works, check whether the code agrees. Surface contradictions.

## Done — the frontier is empty

**The grill ends when the frontier is empty**: every branch of the design tree examined, every premise in
the ledger resolved to grounded / absent / spiked, and no question left that is answerable now. "Feels
like enough" is not a completion criterion. Name what is still fog and let it stay fog.

Then stop. **Take no action until the user confirms the shared understanding** — that confirmation is the
SPEC gate.

## Output

Do **not** write `CONTEXT.md`, ADRs, or a separate glossary file.

- **Thought-trail** → for each node, `append_trail` one `decision` entry to the item task in the `tasks`
  MCP server: the `question`, the `answer` (the decision, and what was branched or dropped), and where the
  detail is filed. **Write it for the answered question BEFORE asking the next — no exceptions.**
- **Resolved decisions** → route by doc (`product-template.md` owns the table): North Star/Language →
  `.claude/product.yaml`; feature status → `.claude/roadmap.yaml` (one-line rows); technical shape and
  seams → `.claude/architecture.yaml`, as they crystallise. Prune stale content; a real pivot moves to
  `.claude/lessons.yaml`, the archive. Any ✅-shipped claim is **run first**, never guessed.
- **Language** → pin every canonical term in product.yaml's top-level **Language** section: the term, a
  one-line definition, and the rejected synonyms it replaces.

Durable lessons — gotchas, preferences, corrections — go to **Claude Code auto-memory**, never into
`product.yaml`. Grill reads memory for known gotchas before re-litigating a settled question; it writes
memory only at the end of a cycle, and only for a lesson that would have saved time.

## Advanced mode

Two modes; **simple is the default** (everything above). Offer **advanced** only for a non-trivial plan
and only **after grounding**, via an `AskUserQuestion` whose labels name the extra turns and the one
parallel fan-out. Deselecting it just continues the simple one-question interview.

Advanced adds three stages:

1. **Ground, then Why → What → How.** Read the product docs, survey the code, and fetch external
   references first. Then interview along a Why → What → How agenda (motivation → what to build → does the
   implementation serve the why) — still one round at a time, with a standing "proceed now" escape.
2. **Assemble a panel and fan it out as parallel subagents.** The rules:
   - **Compose by orthogonal lens, not scope cluster.** One expert per risk-axis with real surface area —
     a lens that catches a class of failure the others structurally cannot. Collapse any two whose
     findings could be swapped unnoticed; they are one expert. A fixed disciplinary roster is as wrong as
     scope-clustering; the test is distinctness **and** relevance.
   - **Name each by canonical discipline slug** (`mobile-ux`, `determinism-algorithms`), never an ad-hoc
     "C1".
   - **Reuse before invent:** `Glob` `.claude/experts/*.md` first and prefer refining an existing expert
     whose lens fits over minting a new one.
   - **4 is a hard ceiling that doubles as a scope smell.** If more than 4 distinct lenses feel warranted,
     don't grow the panel: STOP and surface the over-scope with `AskUserQuestion`, offering 2–4 concrete
     ways to split or narrow the scope (each a smaller question a ≤4-lens panel could grill) plus a
     free-form **Other**. Then grill only the narrowed scope the user picks.
   - The user multi-selects, adds their own via **Other**, and may attach references per expert (file →
     `Read`, public URL → `WebFetch`, private → pasted text).
   - **Dispatch:** one `outputty-expert` per lens (its slug + sources + question injected) plus the
     **`adversary` skill on `outputty-reviewer`** (always, even with zero experts) — every `Agent` call in
     a **single message** so they run in parallel. Every one is **cite-or-drop** and pulls the latest from
     the web; each expert reads and refreshes its own `.claude/experts/<slug>.md` knowledgebase.
   - Select by the **namespaced** `subagent_type` (`outputty:outputty-expert`; `outputty:outputty-reviewer`
     for the adversary — the bare name errors at dispatch); project `.claude/agents/` files do **not**
     register — see the README's "How grilling works" section.
   - **Model policy — Opus at `effort: 'medium'`** for the whole panel. The expert pins that in its own
     frontmatter; the reviewer running the `adversary` skill is generic, so set its `model`/`effort` at the
     call site. Never *inherit* the session model. Pass `model` on the `Agent` call only to override a
     charter deliberately.
3. **Synthesize in the session.** The reports come back to the **session**; it (no separate arbiter) weighs
   them against the product docs, presents a decision-ready summary + a convergence verdict, and routes
   decisions → the product docs, trail → the task's `tasks` MCP trail. The user re-rounds or proceeds to
   PLAN.
