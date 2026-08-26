---
name: grill
description: Stress-tests a plan by asking the whole answerable frontier at once, each question carrying a recommendation. Use when the user asks to sharpen, challenge, interrogate or run an adversarial pass over a plan or idea. Use it also as the interview inside outputty's SPEC phase. Do NOT use to run the PLANNING stage.
---

# grill - stress-test a plan, one round at a time

Interview the user relentlessly about every aspect of the plan until you share an understanding. Walk the
design tree: each decision spawns the decisions that depend on it.

Input: the plan or the idea, and the task whose trail carries the record.

Output: an empty frontier, a verdict on every premise in that trail, and the resolved decisions routed to
the product docs.

## Ask in rounds - the whole frontier, then stop

The frontier is every question whose dependencies are already settled, and which is answerable now, without
assuming anything unconfirmed. A question that rests on an open decision belongs to a later round. Every
known question is frontier, blocked (waiting on a frontier answer), or fog (not yet phrasable, held in
the session).

**Ask the whole frontier in one round**, numbered, each with your recommendation. Then wait. Every frontier
question is one numbered item, whatever its shape: a preference between two options, a decision the rest
depends on, a yes or no. When one decision must land first, make it Q1 and name what waits on it.

```
**Q1** - **<question title>**: <the question, one idea. Alternatives if they exist.>

Recommend: <your recommended answer, and why in one line>

**Q2** - **<question title>**: <…>

Recommend: <…>
```

Each answer expands the frontier, so recompute it and ask the next round.

⚠ **Every frontier question goes in the reply, as prose.** The tool renders 2 to 4 labels and buries the
rest of the message.

`AskUserQuestion` serves session setup and the gates: the opening shape confirmation, the advanced-mode
offer, the panel multi-select, the over-scope split, and a stage gate that the calling skill owns. A gate
asked as prose ends the turn; asked with the tool, the answer continues the session.

**Finding facts is your job.** Answer a frontier question that needs environmental data yourself, and
`scout` for a real hunt. Research is non-blocking: carry on with the
rest of the frontier.

## Technique

### Structure every substantive turn

Present each numbered question. Carry a worked example on a code-shaped decision, and skip it otherwise. Mark
with ⚠ the one thing the user must weigh: the trade-off or the default that their answer changes.

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

A request carries premises the user left unsaid: "we already do X", "Y is what this is for",
"Z can't work". A ticket carries its own: the cause its brief names, and the fix it asks for. Both are
rows, whoever filed the ticket, and each gets its own verdict.

Keep the assumption ledger in the task's trail. Write down every premise the request rests on, and give
each one of three verdicts.

1. **Grounded** - it already exists: you found the code, ran it, or read the measurement. Cite one anchor,
   then move on.
   - **Repo-internal** - the code, or the `architecture.md` line.
   - **External** - the routed fact where its reader works, written if the run is fresh.
2. **Absent** - it does not exist, or it does not work the way the premise says. Say so immediately.
3. **Unknown** - nothing you can read settles it. It is a spike, not a discussion. Run it.

Three rules make the ledger real:

- **Absence:** check what *doesn't* exist, not just what does. "We already handle this" has a file behind
  it or it is a gap.
- **Lessons:** grep `.claude/lessons.md`, the index, then open the file a hit points at. Its absence is
  an answer, not an error. A hit answers *"this was tried; here is what killed it"*, and the user may
  still overrule.
- **Verification:** a premise is verified by a citation. "Yes, that's how it works" without one leaves it
  unverified.

Surfacing a premise as *absent* is help, not contradiction. A ledger entry you can't resolve stops the
grill.

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

Then stop. Take no action until the user confirms the shared understanding.

## Output

Everything below lands in the trail and the product docs.

- **Thought-trail:** append one `decision` entry per node to the item task in the `tasks` MCP server, with
  `append_trail`. Carry the `question`, the `answer` (the decision, and what was branched or dropped), and
  where the detail is filed. Write it for the answered question before asking the next, with no exception.
- **Assumption ledger:** append one `note` per premise the moment you verdict it, with `append_trail`.
  Carry the premise as the user stated it, its verdict, and the anchor or the spike name.
- **Resolved decisions:** route by doc as they crystallise, per the per-doc sections in
  `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Prune stale content only at the
  Done gate. Before you remove a line, show the user that exact line and the answer that superseded it. A
  real pivot becomes a lesson at the retrospective rather than a deletion.
- **Language:** pin every canonical term in the Language section of `product.md`: the term, a one-line
  definition, and the rejected synonyms it replaces.

Read auto-memory for known gotchas before you re-litigate a settled question. It holds what is true in
any repository; a lesson about *this* project is the retrospective's, under `.claude/lessons/`.

## Advanced mode

Two modes, and simple is the default: everything above.

**Ground before you offer.** Read the product docs, survey the code, and fetch the external references the
plan rests on. Grounding is the precondition of the offer.

**Offer advanced only when three or more frontier questions turn on judgement that no repo file settles.**
Make the offer with an `AskUserQuestion` whose labels name the extra turns and the one parallel fan-out.
Deselecting it continues the simple round-based interview above.

Advanced adds three stages:

1. **Interview along a Why → What → How agenda.** Ask about motivation, then about what to build, then
   about whether the implementation serves the why. Still one round at a time, with a standing "proceed
   now" escape.
2. **Assemble a panel and fan it out as parallel subagents.** The rules:
   - **Compose by orthogonal lens, not scope cluster.** One expert per risk-axis with real surface area: a
     lens that catches a class of failure the others structurally cannot. Collapse any two whose findings
     could be swapped unnoticed; they are one expert.
   - **Name each by canonical discipline slug**: `mobile-ux`, `determinism-algorithms`.
   - **Reuse before invent.** `Glob` `.claude/experts/*.md` first, and prefer refining an existing expert
     whose lens fits over minting a new one.
   - **Treat 4 as a hard ceiling**, one that doubles as a scope smell. If more than 4 distinct lenses fit,
     stop and surface the over-scope with `AskUserQuestion`. Offer 2 to 4 concrete ways to split or narrow
     the scope, plus a free-form Other. Each way is a smaller question that a ≤4-lens panel could grill.
     Then grill only the narrowed scope the user picks.
   - **References:** let the user multi-select and add their own via Other. Attach what they give per
     expert: a file to `Read`, a public URL to `WebFetch`, private material as pasted text.
   - **Dispatch** one `outputty:outputty-expert` per lens, plus the `adversary` skill on
     `outputty:outputty-reviewer` (always, even with zero experts). Put every `Agent` call in a single
     message so they run in parallel. Inject into each expert its `<slug>`, its knowledgebase path
     `.claude/experts/<slug>.md`, its sources and the question.
   - ⚠ **Select by the namespaced `subagent_type`.** The bare name errors at dispatch, and project
     `.claude/agents/` files do not register at all.
   - **Treat a dispatch that errors or returns nothing as a missing lens.** Name the failed slug,
     re-dispatch it once, and state the missing lenses in the verdict's first line.
   - **Model policy:** run the whole panel on Opus. Pass `model: 'opus'` explicitly on every `Agent` call.
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

   Every line is cite-or-drop, and an empty line is a real verdict.
