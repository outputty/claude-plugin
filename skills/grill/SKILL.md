---
name: grill
description: Stress-tests a plan by asking the whole answerable frontier in one round, each question carrying a recommendation. Use when the user asks to sharpen, challenge, interrogate or run an adversarial pass over a plan or idea. Use it also as the interview inside outputty's SPEC phase. Do NOT use to run the PLANNING stage, which owns the branch, gates and task graph.
---

# grill - stress-test a plan, one round at a time

Interview the user relentlessly about every aspect of the plan until you share an understanding. Walk the
design tree: each decision spawns the decisions that depend on it.

## Ask in rounds - the whole frontier, then stop

The frontier is every question whose dependencies are already settled, and which is answerable now, without
assuming anything unconfirmed. A question that rests on an open decision belongs to a later round. Every
known question is frontier, blocked (waiting on a frontier answer), or fog (not yet phrasable, held in
the session).

**Ask the whole frontier in one round, numbered, each with your recommendation. Then wait.**

```
❓ **Q1** - **<question title>**: <the question, one idea. Alternatives if they exist.>

➡️ <your recommended answer, and why in one line>

❓ **Q2** - **<question title>**: <…>

➡️ <…>
```

Each answer expands the frontier, so recompute it and ask the next round.

⚠ Never ask a frontier question with `AskUserQuestion`. There is no exception.

The tool renders 2 to 4 labels and buries the rest of the message. A round that also fires it teaches the
user to answer one question and drop the other four. The round is lost, and every recommendation you wrote
goes unread. "Get this one right first" is not a reason to reach for it.

Every frontier question is a numbered item, whatever its shape: a preference between two options, a
decision the rest depends on, a yes or no. A frontier of five questions is five numbered items in one
message. Not five tool calls, not five turns, and not one tool call plus four items. When one decision must
land first, say so in the round: make it Q1 and name what waits on it.

`AskUserQuestion` serves session setup only: the opening shape confirmation, the advanced-mode offer, the
panel multi-select, and the over-scope split. Those pick how to grill, and they are never part of the
frontier.

**Finding facts is your job, never the user's.** A frontier question that needs environmental data is not
for the user. Answer it yourself, and `scout` for a real hunt. Research is non-blocking: carry on with the
rest of the frontier.

## Technique

### Structure every substantive turn, then stop there

Present each numbered question. Skip a worked example when the decision is not code-shaped, and never force
one. Mark with ⚠ the one thing the user must weigh: the trade-off or the default that their answer changes.

Name "neither, because…" explicitly when that option is live.

### The four-part failure shape

Explaining why something does not work takes four parts:

1. The problem, in one plain sentence.
2. The concrete example that fails.
3. A generalised, stripped-down version: the same failure with all business logic removed, reduced to
   language or runtime basics.
4. The technical explanation, in the terms that `product.md` pins.

You ran parts 2 and 3, so they are not hypothetical. A split result, where the concrete example fails but
the stripped-down one passes, is the finding.

### Raise the user's assumptions, and check each against reality

A grill validates *your* claims (below). This validates *theirs*. A request carries premises that the user
never said out loud: "we already do X", "Y is what this is for", "Z can't work".

Keep the assumption ledger in the task's trail, and clear it before the SPEC resolves. Write down every
premise the request rests on, and give each one of three verdicts.

| Verdict | What it means | What you do |
| --- | --- | --- |
| **Grounded** | It already exists: you found the code, ran it, or read the measurement | Cite the anchor: repo-internal → the code or the `architecture.md` line; external → the routed fact where its reader works, written if the run is fresh. One line, move on. |
| **Absent** | It does not exist, or it does not work the way the premise says | Say so immediately. |
| **Unknown** | Nothing you can read settles it | It is a spike, not a discussion. Run it. |

These three verdict names and their meanings are grilling's, and the BUILD stage reuses them with its own
actions.

Three rules make the ledger real:

- **Absence:** check what *doesn't* exist, not just what does. "We already handle this" has a file behind
  it or it is a gap.
- **Lessons:** read `.claude/lessons.md` (grep it by path or title), whose absence is an answer, not an
  error. Missing means you note "no lessons yet" and move on. A hit answers *"this was tried; here is what
  killed it"*, and the user may still overrule.
- **Verification:** never verify a premise by agreeing with it. "Yes, that's how it works" without a
  citation is not verification.

Surfacing a premise as *absent* is help, not contradiction. A ledger entry you can't resolve stops the
grill.

### Validate every claim (non-negotiable)

Grilling's edge is **cite-or-drop:** back every factual or technical claim with a run you did or a source
you can quote.

### Challenge the language

When a term is vague or overloaded, propose a precise canonical one. "You said 'account' - the Customer or
the User? Those are different things." Pin the winner and list the rejected synonyms.

### Discuss concrete scenarios

Stress-test relationships with specific invented scenarios that probe edge cases and force precision about
boundaries between concepts.

### Backtrack and surface conflicts

When a new answer contradicts an earlier one, or the code, say so immediately. "Earlier you said partial
cancellation is possible, but this answer assumes whole-order cancellation. Which is it?" Branch into the
related decisions the conflict exposes. When the user states how something works, check the code agrees.

## Done - the frontier is empty

The grill ends when the frontier is empty. Three conditions say so: every branch examined, every ledger
entry in the trail carrying a verdict, and no answerable question left. Read the ledger back with
`get_trail` before you call it done. "Feels like enough" is not a completion criterion. Name what is still
fog and let it stay fog.

Then stop. Take no action until the user confirms the shared understanding, which is the SPEC gate.

## Output

Do not write `CONTEXT.md`, ADRs, or a separate glossary file.

- **Thought-trail:** append one `decision` entry per node to the item task in the `tasks` MCP server, with
  `append_trail`. Carry the `question`, the `answer` (the decision, and what was branched or dropped), and
  where the detail is filed. Write it for the answered question before asking the next, with no exception.
- **Assumption ledger:** append one `note` per premise the moment you verdict it, with `append_trail`.
  Carry the premise as the user stated it, its verdict, and the anchor or the spike name. Those notes are
  the ledger that the Done gate reads back.
- **Resolved decisions:** route by doc as they crystallise, per the routing table in
  `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Prune stale content only at the
  Done gate. Before you remove a line, show the user that exact line and the answer that superseded it. A
  real pivot moves to `.claude/lessons.md` rather than being deleted. Additions route as they crystallise;
  deletions wait for the gate.
- **Language:** pin every canonical term in the Language section of `product.md`: the term, a one-line
  definition, and the rejected synonyms it replaces.

Grill reads auto-memory for known gotchas before re-litigating a settled question. It writes auto-memory
only at cycle end, for a lesson that would have saved time. Durable lessons route to auto-memory, not
`product.md`.

## Advanced mode

Two modes, and simple is the default: everything above.

**Ground before you offer.** Read the product docs, survey the code, and fetch the external references the
plan rests on. Grounding is the precondition of the offer, never a stage inside it.

**Offer advanced only when three or more frontier questions turn on judgement that no repo file settles.**
Make the offer with an `AskUserQuestion` whose labels name the extra turns and the one parallel fan-out.
Deselecting it continues the simple round-based interview above.

Advanced adds three stages:

1. **Interview along a Why → What → How agenda.** Ask about motivation, then about what to build, then
   about whether the implementation serves the why. Still one round at a time, with a standing "proceed
   now" escape. Inside the SPEC stage that stage's three passes are the agenda, and this one yields to
   them.
2. **Assemble a panel and fan it out as parallel subagents.** The rules:
   - **Compose by orthogonal lens, not scope cluster.** One expert per risk-axis with real surface area: a
     lens that catches a class of failure the others structurally cannot. Collapse any two whose findings
     could be swapped unnoticed; they are one expert. A fixed disciplinary roster is as wrong as
     scope-clustering; the test is distinctness and relevance.
   - **Name each by canonical discipline slug** (`mobile-ux`, `determinism-algorithms`), never an ad-hoc
     "C1".
   - **Reuse before invent.** `Glob` `.claude/experts/*.md` first, and prefer refining an existing expert
     whose lens fits over minting a new one.
   - **Treat 4 as a hard ceiling**, one that doubles as a scope smell. If more than 4 distinct lenses fit,
     stop and surface the over-scope with `AskUserQuestion`. Offer 2 to 4 concrete ways to split or narrow
     the scope, plus a free-form Other. Each way is a smaller question that a ≤4-lens panel could grill.
     Then grill only the narrowed scope the user picks.
   - **References:** let the user multi-select and add their own via Other. Attach what they give per
     expert: a file to `Read`, a public URL to `WebFetch`, private material as pasted text.
   - **Dispatch** one `outputty-expert` per lens, plus the `adversary` skill on `outputty-reviewer`
     (always, even with zero experts). Put every `Agent` call in a single message so they run in parallel.
     Inject into each expert its `<slug>`, its knowledgebase path `.claude/experts/<slug>.md`, its sources
     and the question. Every one is cite-or-drop and pulls the latest from the web. That base is
     domain-generic: the problem you inject comes back in the expert's return, never into its memory.
   - **Treat a dispatch that errors or returns nothing as a missing lens.** Name the failed slug,
     re-dispatch it once, and state the missing lenses in the verdict's first line. Never synthesise as if
     the panel came back whole.
   - ⚠ Select by the namespaced `subagent_type` (`outputty:outputty-expert`, and
     `outputty:outputty-reviewer` for the adversary). The bare name errors at dispatch, and project
     `.claude/agents/` files do not register at all.
   - **Model policy:** run the whole panel on Opus. Pass `model: 'opus'` on every `Agent` call, and never
     *inherit* the session model. Effort is not a dispatch argument, so each charter pins its own. The
     expert runs at its frontmatter effort. The reviewer that runs `adversary` pays the charter's
     `effort: xhigh`, which makes the adversary lens the expensive one in the panel.
3. **Synthesize in the session.** The reports come back to the session, and it weighs them against the
   product docs. There is no separate arbiter. Present the verdict in this shape, then route the outputs as
   the Output section directs:

   ```
   Missing lenses: <the slugs that did not report, or "none">
   Converged: <the claim every lens supports, and who grounded it>
   Split: <the claim the lenses disagree on, each side with its citation>
   Unopposed: <what the adversary raised no grounded objection against>
   Ready to decide: <the decision this makes answerable, and your recommendation>
   ```

   Every line is cite-or-drop, and an empty line is a real verdict. An adversary that returns no grounded
   objection is Unopposed, so never manufacture a threat to fill the slot. The user re-rounds or proceeds
   to PLAN.
