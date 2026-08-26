---
name: issue-authoring
description: Writes or revises the brief and contract that tasks-mcp renders as a task's or a target's GitHub issue body. Triggers on a tasks-mcp write (add_task, add_target, amend_task, edit_task) or a review of an issue body. Not the planning stage (planning), not a build review (qa).
---

# issue-authoring - task issues a builder can act on cold

A builder picks up a task issue with **none** of your context. The issue carries the whole reasoning by
itself: what is wrong, what "done" looks like, and what to watch. Every claim is checkable, and the how
is left to the builder.

## What the server renders, and what you write

The tasks-mcp server regenerates the issue body on every write. It emits exactly one heading, `**What
to account for**`, above the `contract`. The `brief` renders verbatim above that, with no heading and
no split, so the two headings inside it are yours to write.

1. **Problem** - your heading, inside `brief`. What happens today, the gap in it, and why the gap
   matters.
2. **Expected solution** - your heading, inside `brief`. The target program and an end-to-end example
   (input → output **shape**). The implementation is the builder's.
3. **What to account for** - the server's heading, above `contract`. The definition of done, the
   constraints, the open questions, each validateable.

A `brief` opens in this shape. A brief with no headings renders as one undivided wall:

```markdown
## Problem

<what happens today, the gap in it, and what the gap costs>

## Expected solution

<the top-level call, then Input and Output blocks>
```

## A target's brief is a different document

A target is a roadmap row, not work. Its brief answers one question, **why is this worth building, and
now**, in a paragraph:

- **The problem at product altitude**, not code altitude: what a user or the project cannot do today, or
  pays for repeatedly. Name the cost.
- **Why now**: what changed, what it unblocks, or what it stops costing. A target with no "now" is a
  someday, and a someday is not a roadmap row.
- **The spec and the task list live in the tasks under it**, and the graph derives which tasks those are.
  A copy in the brief is the staler one.

## Principle

Every sentence earns its place. Every claim is checkable. The implementation is the builder's.

Two failure modes point opposite ways. A wall of undefined jargon and forensics leaves nothing
actionable. A bare one-liner leaves nothing buildable. Both fail one test: *could a builder who has
never met this pick it up, verify each claim independently, and know when they are done?*

## Problem - build up to the gap

- **Open where a cold reader can follow, then narrow to the exact gap.** Define every domain term inline
  the first time it appears: what a _sink_, an _appender_ or a _WAP transaction_ **is**, in a few words. A
  term that cannot earn a short definition gets cut, not left dangling.
- **Current behaviour first, then the gap.** Say what happens _today_ before you name what is missing.
- **Every claim carries its _why_, the "so what".** State the fact and what breaks without it: "a
  rejected row is dropped in memory" → "so it is lost without a trace".

## Expected solution - show the shape, delegate the how

Show the **end-to-end surface**, not the implementation:

1. The top-level call the user or builder will write.
2. **Input** and **Output** as real fenced blocks, at minimum the output _shape_ (fields, types),
   valid and copyable, no ellipsis.
3. Stop there. The builder picks the implementation. If you catch yourself naming functions or writing
   step-by-step how-to, cut it.

```ts
// what "done" looks like from OUTSIDE - the builder fills in the how
validate(rows, { strategy: quarantine({ into: model.staging() }) })
```

Input:

```json
[{ "id": 1, "email": "a@x" }, { "id": 2, "email": "nope" }]
```

Output (shape - real fields, types stand in for values the builder produces):

```json
{
  "accepted": [{ "id": 1 }],
  "quarantined": { "table": "staging.rejects", "rows": [{ "id": 2, "reason": "<string>" }] }
}
```

### A reference is not an implementation

Four references survive the rule above. Each one is required, and cutting one costs the builder a hunt.

1. **Sibling** - the `file:line` of the nearest existing thing that this must resemble, or `none, new
   surface`. Required on every brief, a trivial task included.
2. **Architecture** - a Mermaid diagram of the shape: the new pieces, the seams, and what flows where.
   Agents read text, so keep it in Mermaid source.
3. **Where** - the one folder that the work belongs in. The `scope` field stays out of the rendered body,
   so name the folder in the brief for the cold reader.
4. **Anchor** - the `file:line`, the architecture entry, or the probe that a structural claim rests on.
   An unanchored claim is an open question, not a fact.

A typed `none, new surface` is signal; a skipped row is not.

## What to account for - three buckets

The `contract` is where a draft rots into a pile of half-explained facts. Split it into three, and make
every line checkable:

- **Definition of done** - **numbered cases**, each a check that a builder can run. Case 1 is the worked
  input to output example from `.claude/examples.md`, copied verbatim. That case is the definition of
  done: "300k rows appended inside BEGIN, then rolled back → `count(*)` is 0 on a lake table." Concrete
  and checkable, so keep it.
- **Constraints to respect** - a fact that shapes the build, each with its **"so what"**: "the appender
  writes positionally, so resolve column order via `DESCRIBE` or columns land shuffled." A constraint
  with no consequence is trivia, so cut it.
- **Open questions and spikes** - anything unverified, flagged as **settle first**: "the row claims 'no
  engine change', unverified and likely wrong. Spike the transaction shape before costing."

Two hard rules for this section:

- **Every claim is validateable.** Assert a number ("6.5× @10k rows") only with the
  way to reproduce it: **where the benchmark lives, and how to run it.** A figure a builder must take on
  faith is cut, or becomes a _"verify X"_ task of its own.
- **Complete every reference, or drop it.** "Pinned `@duckdb/node-api@1.5.4-r.1` exposes it" - exposes
  _what_? A `file:line` cited with no reason - _why does it matter_? And keep
  **forensics and provenance out of the body**, such as "was audit row D2" or "benchmarked 2026-08-11".
  Those go in the task's **trail**, as a comment.

## The dispatchable bar - what a ticket has to clear before it is settled

**A settled ticket is built by a cold, unattended child.** Nothing between authoring and merge asks a
question: `AskUserQuestion` is stripped from every subagent, so a ticket that leaves a ruling unmade
buys a competent implementation of a guess. The interview moved here. This is the gate.

Five conditions, each checkable by reading the ticket alone:

1. **A `contract` of numbered cases**, each one a check a stranger can run. "Works correctly" is not a
   case; a command with an expected output is.
2. **A `scope`**, one folder. It is also what a dispatcher draws its lane against, so a ticket without
   one is in every lane and collides with everything.
3. **One checkable done-condition**, stateable in a sentence.
4. **Every open question is settled or tagged.** Settle it here, or tag the ticket `spike` and make its
   deliverable the ticket the answer makes possible.
5. **It leaves the program working, and its `deps` stay inside its target.** A ticket shipping half a
   cutover breaks the default branch when its layer merges. One depending on another target cannot be
   built inside that target's stack. Both are re-scoping, so send either back to planning.

A ticket that fails the bar is not blocked from dispatch by any mechanism. The runtime backstop is the
build's replan exit, which costs a whole dispatched child to discover what a reader could have seen.
The bar exists to make that exit rare, not to make it unreachable.

## Checklist

A worked before-and-after, plus every tasks-mcp gotcha an author hits, live in
`${CLAUDE_PLUGIN_ROOT}/skills/issue-authoring/references/worked-example.md`.

- [ ] The `brief` carries its own `## Problem` and `## Expected solution` headings.
- [ ] A cold reader follows the Problem with no prior context; every term is defined inline.
- [ ] Every claim states its _why_; every asserted fact or number says **how to verify it**.
- [ ] An end-to-end example with an **Input** and an **Output shape**; no implementation is prescribed.
- [ ] The four references are present: **Sibling**, **Architecture**, **Where** and **Anchor**.
- [ ] "What to account for" splits into a **numbered definition of done**, **constraints** (each with a
      consequence) and **open questions** (flagged, not asserted).
- [ ] Case 1 of the definition of done is the `examples.md` example, verbatim.
- [ ] No dangling references; no forensics in the body (those go in the trail).
- [ ] Deletion test: every sentence, removed, would lose reasoning, otherwise cut it.
- [ ] **Dispatchable**: numbered contract, one scope folder, one done-condition, no unsettled
      question. A cold, unattended child can build it from the ticket alone.
