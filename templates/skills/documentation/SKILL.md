---
name: documentation
description: 'Writes, rewrites or simplifies a README or doc, de-slops one, and classifies docs by Diátaxis. Use on "write the docs" or "fix this README".'
---

# documentation

## Examples and fences

### Do

- Keep a runnable example's full imports, with `<!-- compiles -->` above its fence; a shape that names something undefined carries `<!-- illustrative -->`.
- Paste a compiling example's real output as a trailing comment on the call that produces it.
- Put a before/after in one fence holding both sides, each opened by a comment.
- Give each env var or flag its own bullet, naming its default and whether it is required.
- Keep in-repo links relative, and move depth that outgrows a section to its own doc, linked once.
- Draw a picture for three or more interacting parts, a flow across a boundary, a state machine or a decision tree, as inline Mermaid in Markdown, or a committed SVG only in `README.md` or a PR body, validated with an XML parser before commit.

### Don't

- Don't prefix a command with `$ `, and don't put its output in the fence.
- Don't draw a picture for linear steps; use a numbered list.

## Diátaxis kinds

### Do

- Classify by the compass before the first sentence: [references/cheatsheet.md](references/cheatsheet.md)
- Place content by action or cognition, and by acquisition or application: action + acquisition is a tutorial, action + application a how-to guide, cognition + application reference, cognition + acquisition explanation.
- Write a tutorial in the form of [references/tutorial.md](references/tutorial.md).
- Write a how-to guide in the form of [references/how-to-guide.md](references/how-to-guide.md).
- Write reference in the form of [references/reference.md](references/reference.md).
- Write an explanation in the form of [references/explanation.md](references/explanation.md).
- Re-run the compass the moment writing feels hard.
- Treat a README as a docs set in one file: the quickstart is its tutorial, each capability heading a how-to guide, the API reference is reference, Core Concepts is explanation.
- Draft a README against `~/.claude/readme-template.md`, dropping a section the project has nothing for.

### Don't

- Don't classify by topic or difficulty.
- Don't merge a tutorial and a how-to guide.

## De-slop

### Do

- Read the code before the prose: every exported type, its public methods, one working example per capability.
- Read the doc whole against the code it describes, flagging an example that no longer compiles, a claim the code no longer backs, and a section restating what the code states plainly.
- Flag mannered filler inline: value claims, manufactured significance, hollow superlatives, consultant register.
- Reorder into the spine only where the reorder drops nothing.
- Move a sentence in the wrong kind to its home, leaving a link in its place.
- Run every `<!-- compiles -->` example in the project's own runner before it ships, and fix the example or the claim it backs when one fails.
- Cut every claim true of a dozen other projects, mannered filler, and every sentence a code example already shows.

### Don't

- Don't write a claim with no code behind it.
- Don't delete a section that has no home in the spine; ask the user.

## Growing a docs set

### Do

- Work bottom-up: take the page in front of you, judge one small piece against the need it serves, make the one improvement, publish, repeat.
- Check accuracy, completeness and consistency first, then judge flow and fit by reading the page as its reader.

### Don't

- Don't scaffold empty sections or tear down to restart.

## Diátaxis source

### Do

- Look a term up in [references/glossary.md](references/glossary.md) and a technique in [references/patterns.md](references/patterns.md).
- Read [ch01-start-here](references/chapters/ch01-start-here.md), [ch02-tutorials](references/chapters/ch02-tutorials.md), [ch03-how-to-guides](references/chapters/ch03-how-to-guides.md), [ch04-reference](references/chapters/ch04-reference.md), [ch05-explanation](references/chapters/ch05-explanation.md), [ch06-the-compass](references/chapters/ch06-the-compass.md), [ch07-workflow](references/chapters/ch07-workflow.md), [ch08-foundations](references/chapters/ch08-foundations.md), [ch09-the-map](references/chapters/ch09-the-map.md), [ch10-quality](references/chapters/ch10-quality.md), [ch11-tutorials-vs-how-to-guides](references/chapters/ch11-tutorials-vs-how-to-guides.md), [ch12-reference-vs-explanation](references/chapters/ch12-reference-vs-explanation.md) for the kind or question each names.

## Validate

Copy this checklist and tick each item against the file or section:

- [ ] It is one kind, by the compass.
- [ ] It follows its kind's template.
- [ ] Every `<!-- compiles -->` example ran in the project's runner.
- [ ] Every claim has code behind it.
- [ ] No Don't line above applies to it.

## Glossary

- **Spine** - the section order `~/.claude/readme-template.md` gives a README.
- **Code-forward standard** - a doc that shows a runnable example before it explains.
- **De-slop** - rewrite a doc that reads AI-generated until each sentence is one the code or the reader needs.
- **Mannered filler** - a sentence that sounds like documentation and says nothing the code does not.
