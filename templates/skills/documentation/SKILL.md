---
name: documentation
description: Writes or rewrites a README or project doc to outputty's code-forward standard, de-slopping one that reads AI-generated, and classifies any documentation by Diátaxis - tutorial, how-to guide, reference, explanation - before a word is written. Use on "write the docs", "fix this README", "de-slop this doc", "structure the docs", or from the build skill's docs layer.
---

# documentation - classify, then write what a reader can copy from

`~/.claude/rules/docs.md` and `.claude/rules/docs.md` hold the spine, the fence-tag convention and the API-bullet shape. This skill is the procedure that writes to them; `~/.claude/readme-template.md` is the skeleton to draft against. The Diátaxis depth behind the classification lives under `references/`, read on demand.

## Classify first

Every piece of documentation is exactly one of four kinds. Classify before the first sentence, then follow only that kind's rules.

Two questions place any content, at document level or at sentence level:

- Does it inform **action** (doing) or **cognition** (knowing)?
- Does it serve **acquisition** of skill (study) or **application** of skill (work)?

The answers name the kind:

- action + acquisition = **tutorial** - answers "Can you teach me to…?"
- action + application = **how-to guide** - answers "How do I…?"
- cognition + application = **reference** - answers "What is…?"
- cognition + acquisition = **explanation** - answers "Why…?"

Three rules keep the classification honest:

- Study or work decides, never topic or difficulty: how-to guides cover basic chores, and experts still take tutorials.
- Re-run the two questions the moment writing feels hard. Friction means the wrong quadrant; the commonest defect is a tutorial and a how-to guide collapsed into each other.
- A proposed fifth kind (FAQ, quickstart, cookbook) is a presentation format; classify its content into the four.

## Write each kind to its form

- **Tutorial** - a lesson; the writer owns the learner's success. Build one path with no choices, concrete steps, a visible result early and often, and a narrative of the expected ("The output should look like…"). Explanation is one clause and a link out. Open with "In this tutorial we will build…", never "you will learn…". It must work for every reader, every time.
  - Meaningful, successful, logical, usefully complete: every step earns its place by advancing the learner, and every attempt that follows it exactly succeeds.
- **How-to guide** - steps for a competent reader's real-world goal, never the tool's own operations ("press Deploy to deploy" is not guidance). Action only, in conditional imperatives ("If x, do y"); branches are welcome; start and end where the reader actually stands. Title it "How to <exact task>".
- **Reference** - dry, neutral description of the machinery, consulted, not read. Describe and only describe; an urge to explain or instruct becomes a link. Mirror the code's structure and give every entry the same pattern. An example illustrates, never justifies.
- **Explanation** - discussion read away from the work. Title it as an implicit "About…" and scope it with a why-question. Context, history, alternatives and opinion belong here and only here. Bound it: it absorbs instruction and description that belong elsewhere.

A README is a doc set in one file: the quickstart is its tutorial, each capability heading is a how-to guide, the API reference is reference, Core Concepts is explanation. The spine in `rules/docs.md` orders the sections; the kind decides what each section may say.

## Write or rewrite

1. Read the code before the prose: every exported type, its public methods, one working example per capability. A claim with no code behind it is not written.
2. Draft against `~/.claude/readme-template.md`'s spine. Drop a section the project has nothing for - Comparison and Real-World Examples are earned, not mandatory; Core Concepts earns its diagram only past three interacting parts.
3. Run every `<!-- compiles -->` example for real, in the project's own runner, before it ships. An example that cannot run this way is `<!-- illustrative -->`, never `<!-- compiles -->`.
4. Paste the run's real output into the trailing comment on the line that produced it, never output recalled from memory.
5. Cut every claim true of a dozen other projects, every claudism the output style already bans, and every sentence a code example already shows.

## De-slop an existing doc

1. Read it whole against the code it describes: an example that no longer compiles, a claim the code no longer backs, a section restating what the code already states plainly.
2. Flag every hit from the output style's "Replace the claudisms" list inline: value-claim filler, manufactured significance, hollow superlatives, consultant register.
3. Reorder into the spine only where the reorder drops nothing; a section with no home in the spine is a question to the user, never a silent deletion.
4. Run the compass over each section and move a sentence in the wrong kind to its home: explanation out of the tutorial, instruction out of the reference, a link left behind only where `rules/docs.md` allows one.
5. Re-run every example the rewrite keeps, per Write or rewrite step 3, before it ships.

## Grow a docs set

- Work bottom-up: take the page in front of you, judge one small piece against the need it serves, make the one improvement, publish, repeat. Never scaffold four empty sections, and never tear down to restart; structure earns its headings from accumulated content.
- A docs set is never finished; keep it complete - appropriate and healthy for its current stage.
- Check accuracy, completeness and consistency first; they are measurable and a precondition. Then judge flow and fit by reading the page as its reader.

## References

Diátaxis, by Daniele Procida (diataxis.fr, retrieved 2026-08-11, [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)), under `references/`:

- `cheatsheet.md` - the compass table, the four forms at a glance, decision rules, the topic index, the license.
- `glossary.md` - every Diátaxis term, defined.
- `patterns.md` - the techniques as when, how and trade-offs.
- `chapters/ch01-start-here.md` through `ch12-reference-vs-explanation.md` - one file per chapter, each named for what it holds.
