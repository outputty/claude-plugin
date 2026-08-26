---
name: retro
description: "Runs outputty's session retrospective. It reads the finished session as one thing, extracts each communication breakdown, broken assumption and killed approach as a standalone lesson file under `.claude/lessons/`, and indexes it in `.claude/lessons.md`. Use when PLANNING ends, after the documentation layer and before a build's merge, on the replan exit, and when the user asks for a retro, a retrospective, or a lesson written up."
---

# retro - the session retrospective

Input: the session you just finished, whole. Output: zero or more lesson files under `.claude/lessons/`,
one index line each in `.claude/lessons.md`, and the commit or the PR that lands them.

**A lesson is written for a reader who was not here.** They have your repository and nothing else: not
your context, not the ticket, not the conversation. Every lesson stands alone or it is not finished.

## When you run, and how the work lands

Three moments, and the landing differs at each.

1. **PLANNING, after the PLAN gate.** The user approved the graph, and nothing is merging. Open a PR
   carrying the lesson files and the index edit, and nothing else.
2. **BUILD, after the documentation layer and before the merge.** Master QA has passed and the stack is
   about to land. Commit onto the **top** branch of the stack, before `gh pr ready`, so the lessons ride
   the merge.
3. **The replan exit.** The build stopped on a requirements gap and merges nothing. Open a PR, the same
   as PLANNING. The gap that stopped the build is the lesson.

## 1. Read the session as one thing

Re-read your own session before you judge it. You are looking for the moment where the work turned, not
for a summary of what shipped.

Four questions find every candidate:

1. **Where did the user correct you?** A correction is the highest-signal event a session holds.
2. **Where did you build something, then scratch it?** Rework is a broken assumption with a receipt.
3. **Where did you ask a question whose answer was already written down?** That is a routing failure.
4. **Where did a claim you carried turn out to be false?** Name what you read to find that out.

## 2. Decide what is a lesson

**A lesson is a pattern that would change a rule.** One-off friction is not a lesson, and a bug that a
commit closed is not a lesson.

Three kinds, and they are the index's three groups:

1. **Communication that broke down** - the user meant one thing, the session heard another, and the
   shape of the misreading repeats.
2. **An assumption that broke** - a fact the work rested on was wrong, absent, or stale.
3. **A killed approach** - a mechanism was built or proposed, then abandoned, and the reason outlives it.

**Grep the index before you write a file.** A pattern already there is not a new lesson: open that
lesson, add your run to its section 4, and raise its count. A second file for one pattern splits the
answer in two.

```bash
grep -in '<the pattern in two or three words>' .claude/lessons.md
```

**Extract every lesson the session holds.** One session commonly yields two, and a quiet one yields
none. Writing none is a real answer.

## 3. Write each lesson

One file per lesson, at `.claude/lessons/<YYYY-MM-DD>-<kebab-slug>.md`. The date is the day the session
ran, so the folder sorts by itself. The slug comes from the title.

**The title is the pattern as a sentence**, in the words a reader would use for their own situation.
`grep` runs against titles, so a title that names only the mechanism cannot be found.

Five sections, in this order, each numbered:

1. **The problem** - the context, for a reader who has never opened this repository. Name the mechanism,
   say what it is for, then show it. A flow gets a `BEFORE` block in text. Code gets the real snippet,
   with its path.
2. **What was expected** - the belief the work rested on, quoted from where it was written or said.
3. **What actually happened** - the real run, with its real output. Label an expected output *expected*.
4. **Where it showed, and whether it repeats** - one numbered fact per line, each with a `file:line`, a
   PR, a trail note or a quote. Close with `×N`, the count of times this archive holds the pattern.
5. **How to prevent it** - the rule, in bold, as an action taken at a named moment. Then the `AFTER`
   block in the same shape as the `BEFORE`.

**Add a `## References` section when the session read official documentation**, numbered, one entry per
source: the publisher, the linked page, and one line on what it settled. A source you read but could not
link is recorded with what is missing, rather than dropped.

Skip a section only where it has no content, and say what is absent rather than padding it.

## 4. Index it

`.claude/lessons.md` is the index, and it holds no lesson text. One line per lesson under its group,
newest first:

```markdown
- [<YYYY-MM-DD> · <STAGE>](lessons/<file>.md) - <the pattern in one clause>. ×N
```

The clause is what a reader matches against their own situation, so it names the pattern rather than the
fix.

## 5. Route what is not a lesson

Three things look like lessons and belong elsewhere. Write each to its home in this same sitting.

1. **A standing rule with no story** - the project's CLAUDE.md, stated assertively.
2. **A constraint in an external dependency** - a `limitation` entry in `architecture.md`'s feature
   index, carrying the probe that re-verifies it.
3. **A fact that is true in any repository**, such as a machine path or a tool version - Claude Code
   auto-memory. A lesson about *this* project goes to `.claude/lessons/`, where a teammate reads it in
   the pull request.

**Mint a skill only for a proven, reusable, multi-step procedure** that this session ran end to end
(`anthropic-skills:skill-creator`). Most sessions mint none.
