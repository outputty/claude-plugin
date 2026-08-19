---
name: grill
description: Grilling session that stress-tests a plan in rounds — the whole answerable frontier at once, each question with a recommendation. Use when the user wants to sharpen a plan or idea, or as the engine of outputty's SPEC phase. Outputs go to product.md and the task's trail — not CONTEXT.md/ADRs.
---

# grill — stress-test a plan, one round at a time

Interview the user relentlessly about every aspect of the plan until you share an understanding. Walk the
design tree: each decision spawns the decisions that depend on it.

## Ask in rounds — the whole frontier, then stop

**The frontier is every question whose dependencies are already settled** — answerable **now**, without
assuming anything unconfirmed. A question resting on an open decision belongs to a later round. Every known
question is **frontier**, **blocked** (waiting on a frontier answer), or **fog** (not yet phrasable — held
in the session).

**Ask the whole frontier in one round, numbered, each with your recommendation. Then wait.**

```
❓ **Q1** — **<question title>**: <the question, one idea. Alternatives if they exist.>

➡️ <your recommended answer, and why in one line>

❓ **Q2** — **<question title>**: <…>

➡️ <…>
```

**Each answer expands the frontier**, so recompute and ask the next round.

**Use `AskUserQuestion` for exactly two shapes, never as the default:**

- **"Which do you prefer?"** — 2–4 concrete options the user picks between.
- **"Get this one right first"** — a single decision the rest of the round depends on.

Everything else is the numbered round above. A frontier of five questions is five numbered items in one
message — not five tool calls, not five turns.

**Finding facts is your job, never the user's.** A frontier question needing environmental data is not for
the user — answer it yourself, `scout` for a real hunt. Research is
**non-blocking**: carry on with the rest of the frontier.

## Technique

### Structure every substantive turn — and stop there

Present each numbered question; skip a worked example when the decision is not code-shaped — do not force
one. **⚠ mark the one thing the user must weigh** — the trade-off or default their answer changes.

Name "neither, because…" explicitly when that option is live.

**Explaining why something _doesn't work_ uses a four-part variant:** (1) the problem in one plain
sentence; (2) the **concrete example** that fails; (3) a **generalised, stripped-down** version — the same
failure with all business logic removed, reduced to language/runtime basics; (4) the technical
explanation, terms per `product.md`. You **ran** parts 2 and 3 — they are not hypothetical. A split
result, where the concrete fails but the stripped-down passes, *is* the finding.

### Raise the user's assumptions, and check each against reality

**A grill validates *your* claims (below). This validates *theirs*.** A request carries premises the user
never said out loud: "we already do X", "Y is what this is for", "Z can't work".

**Keep a running assumption ledger and clear it before the SPEC resolves.** Write down every premise the
request rests on and give it one of three verdicts:

| Verdict | What it means | What you do |
| --- | --- | --- |
| **Grounded** | It already exists — you found the code, ran it, or read the measurement | Cite the anchor: repo-internal → the code/`architecture.md` line; external → the routed fact where its reader works, written if the run is fresh. One line, move on. |
| **Absent** | It does not exist, or does not work the way the premise says | **Say so immediately.** |
| **Unknown** | Can't be settled by reading | It is a **spike**, not a discussion. Run it. |

Three rules make the ledger real:

- **Check what *doesn't* exist, not just what does.** "We already handle this" has a file behind it or it
  is a gap.
- **Read `.claude/lessons.md`** (grep it by path or title) — its absence is an answer, not an error.
  Missing → note "no lessons yet" and move on. A hit answers *"this was tried; here is what killed it"*,
  and the user may still overrule.
- **Never verify a premise by agreeing with it.** "Yes, that's how it works" without a citation is not
  verification.

Surfacing a premise as *absent* is help, not contradiction. A ledger entry you can't resolve stops the grill.

### Validate every claim (non-negotiable)

Grilling's edge is **cite-or-drop:** back every factual or
technical claim with a run you did or a source you can quote.

### Challenge the language

When a term is vague or overloaded, propose a precise canonical one. "You said 'account' — the Customer or
the User? Those are different things." Pin the winner and list the rejected synonyms.

### Discuss concrete scenarios

Stress-test relationships with specific invented scenarios that probe edge cases and force precision about
boundaries between concepts.

### Backtrack and surface conflicts

When a new answer contradicts an earlier one — or the code — say so immediately. "Earlier you said partial
cancellation is possible, but this answer assumes whole-order cancellation. Which is it?" Branch into the
related decisions the conflict exposes. When the user states how something works, check the code agrees.

## Done — the frontier is empty

**The grill ends when the frontier is empty**: every branch examined, every premise resolved to grounded /
absent / spiked, no question left that is answerable now. "Feels like enough" is not a completion
criterion. Name what is still fog and let it stay fog.

Then stop. **Take no action until the user confirms the shared understanding** — that confirmation is the
SPEC gate.

## Output

Do **not** write `CONTEXT.md`, ADRs, or a separate glossary file.

- **Thought-trail** → for each node, `append_trail` one `decision` entry to the item task in the `tasks`
  MCP server: the `question`, the `answer` (the decision, and what was branched or dropped), and where the
  detail is filed. **Write it for the answered question BEFORE asking the next — no exceptions.**
- **Resolved decisions** → route by doc as they crystallise (`product-template.md` owns the routing
  table). Prune stale content; a real pivot moves to
  `.claude/lessons.md`.
- **Language** → pin every canonical term in product.md's **Language** section: the term, a one-line
  definition, and the rejected synonyms it replaces.

Grill reads **auto-memory** for known gotchas before re-litigating a settled question, and writes it only
at cycle end, for a lesson that would have saved time. Durable lessons route to auto-memory, not
`product.md`.

## Advanced mode

Two modes; **simple is the default** (everything above). Offer **advanced** only for a non-trivial plan and
only **after grounding**, via an `AskUserQuestion` whose labels name the extra turns and the one parallel
fan-out. Deselecting it continues the simple one-question interview.

Advanced adds three stages:

1. **Ground, then Why → What → How.** Read the product docs, survey the code, and fetch external references
   first. Then interview along a Why → What → How agenda (motivation → what to build → does the
   implementation serve the why) — still one round at a time, with a standing "proceed now" escape.
2. **Assemble a panel and fan it out as parallel subagents.** The rules:
   - **Compose by orthogonal lens, not scope cluster.** One expert per risk-axis with real surface area —
     a lens that catches a class of failure the others structurally cannot. Collapse any two whose findings
     could be swapped unnoticed; they are one expert. A fixed disciplinary roster is as wrong as
     scope-clustering; the test is distinctness **and** relevance.
   - **Name each by canonical discipline slug** (`mobile-ux`, `determinism-algorithms`), never an ad-hoc
     "C1".
   - **Reuse before invent:** `Glob` `.claude/experts/*.md` first and prefer refining an existing expert
     whose lens fits over minting a new one.
   - **4 is a hard ceiling that doubles as a scope smell.** If more than 4 distinct lenses feel warranted,
     STOP and surface the over-scope with `AskUserQuestion`, offering 2–4 concrete ways to split or narrow
     the scope (each a smaller question a ≤4-lens panel could grill) plus a free-form **Other**. Then grill
     only the narrowed scope the user picks.
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
     frontmatter; the reviewer running `adversary` is generic, so set its `model`/`effort` at the call
     site. Never *inherit* the session model. Pass `model` on the `Agent` call only to override a charter
     deliberately.
3. **Synthesize in the session.** The reports come back to the **session**; it (no separate arbiter) weighs
   them against the product docs, presents a decision-ready summary + a convergence verdict, and routes the
   outputs as the Output section directs. The user re-rounds or proceeds to PLAN.
