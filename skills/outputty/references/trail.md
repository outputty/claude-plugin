# The trail — the branch's map, and its canonical format

The trail is `.claude/trails/<branch>.md`. It is written during SPEC, read by every session that picks
the branch up, and distilled into `product.md` at merge.

**It is a map, not a log.** A log records what happened; a map also shows **what you cannot see yet** and
**where the edge is**. That difference is the whole point: a plan written across territory nobody has
seen becomes a plan that gets re-scoped, parked and restarted. Measured on a real project — 17 planning
commits against 1 code commit in the stretch where the fog was written as tasks instead of as fog.

**The map is an index, not a store.** A decision lives in exactly one place. The trail gists it in a line
and links to where the detail is (`product.md`, the PR, the spike). It never restates it — a decision
written twice drifts in two directions.

## Format

```markdown
# <branch> — <one line: what this cycle is finding its way to>

Planned-at: <sha>

## Core objective (the destination)

<What reaching the end of this looks like — the spec, decision, or shipped change this cycle is heading
for. One or two lines. Every session re-reads this before choosing what to do next, and it fixes the
scope: work beyond it is out of scope, not fog.>

## Decisions so far

<!-- one line per settled question: enough to judge relevance, then follow the link for the detail -->

- **<the question, named>** — <the answer in a line>, and what was dropped. → `product.md` §<n>

## Not yet specified

<!-- the fog: in-scope questions you can SEE but cannot yet phrase sharply. Graduates into tasks as the
     frontier advances. Delete a patch when it graduates — it then lives only as its task. -->

- <the suspected question, as loosely or fully as the view allows>

## Out of scope

<!-- ruled beyond the destination. Closed, never graduates, and deliberately NOT a decision. -->

- <the gist> — out of scope because <why>.
```

## Fog of war — do not chart what you cannot see

Beyond the sharp questions lies the fog: decisions you can tell are coming but cannot yet pin down,
because they hang on questions still open. **Write it down as fog.** An unknown recorded as an unknown is
a signpost; the same unknown guessed into a task is the re-plan you pay for later.

**The test is whether you can state the question precisely now — not whether you can answer it now.**

| | |
| --- | --- |
| **Task it** | The question is already sharp — even if it is blocked and nothing can be done about it yet. |
| **Fog it** | You cannot phrase it that sharply. It goes in **Not yet specified**. |

**Do not pre-slice the fog into task-shaped pieces.** It is coarser than a task on purpose: one patch may
graduate into three tasks, or into none once the frontier reaches it. Slicing it early is guessing with
extra steps, and it produces a graph that looks complete and isn't.

**Resolving a question clears the fog ahead of it.** When an answer makes a patch specifiable, graduate it
into a task and **delete it from Not yet specified** — it now lives in exactly one place. A patch that
sits in the fog while a task covers it is the same decision written twice.

## Out of scope is a scoping act, not a step on the route

Fog only ever gathers **toward** the destination. The destination fixes the scope, so work past it is not
dim — it is **excluded**, and it belongs in its own section.

- **It never graduates.** The frontier stops at the destination. It returns only if the destination is
  redrawn, and then as a fresh cycle, not a resumption.
- **It is not a decision.** *Decisions so far* records the route actually walked; a boundary is not a step
  on it. Keep them separate or the record of how you got here fills with places you didn't go.
- **A task that turns out to sit past the destination gets closed, not resolved.** Close it (a closed task
  is unambiguously off the frontier), then leave one line here: the gist, why it is out, and a link.

**This is not the same as `.claude/lessons.md`.** Lessons record *we tried it and here is what killed it*.
Out of scope records *we decided it is beyond this effort*. Conflating them means re-litigating scope
every few weeks, because a scope call with no record reads like an open question.

## Refer to work by name, never by bare id

In everything a human reads — the trail, the session recap, an escalation — name the task. A wall of
`t-31, t-32, t-33` is illegible; names read at a glance. The id does not vanish, it rides inside the
name: **`Drain the barrel re-exports` (`t-31`)**.
