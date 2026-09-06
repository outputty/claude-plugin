# Patterns

## The compass

**When to use**: any doubt about what form a piece of content is or should be - or when writing feels difficult and you suspect you're in the wrong form. **How**: ask two questions. Does the content inform action or cognition? Does it serve acquisition (study) or application (work)? Action+acquisition = tutorial; action+application = how-to guide; cognition+application = reference; cognition+acquisition = explanation. Apply at sentence level or whole-document level. **Trade-offs**: banal by design; its power is forcing reconsideration when intuition has already given a confident wrong answer.

## The just-do-something loop

**When to use**: improving any existing documentation, from slightly stale to complete mess; also starting from nothing. **How**: (1) choose any piece - the page in front of you, or one at random; (2) assess something small (a paragraph, a sentence) against the need it serves; (3) decide the one action producing an immediate improvement; (4) do it and publish/commit; (5) repeat. **Trade-offs**: no visible big-bang deliverable; the payoff is continuous improvement without planning overhead, and top-level structure that forms itself.

## Minimal explanation plus link

**When to use**: inside tutorials (and how-to guides) whenever the urge to explain appears. **How**: one clause in the most basic language ("We're using HTTPS because it's more secure"), then a link to the full explanation article for when the user is ready. **Trade-offs**: feels insufficient to the anxious teacher; but explanation mid-task distracts and blocks learning, and the link preserves it where it works.

## Narrative of the expected

**When to use**: every tutorial step. **How**: tell the learner what they'll see before they see it: "The output should look something like…", "After a few moments, the server responds with…". Flag likely failure signs: "If the output doesn't show…, you have probably forgotten to…". Warn of surprises: "The command will probably return several hundred lines of logs." **Trade-offs**: verbose compared with bare instructions - and that verbosity is exactly what substitutes for the absent teacher.

## Mirror the machinery

**When to use**: structuring reference documentation. **How**: make the documentation's structure follow the code's logical structure - a method under its class under its module. Consistent, standard patterns throughout; place material where users expect it. **Trade-offs**: none for reference (it also exposes coverage gaps); applying it to the other three forms is a category error - they follow user needs, not the product.

## How-to naming

**When to use**: titling any how-to guide. **How**: "How to <verb phrase naming the exact task>" - How to integrate application performance monitoring. Reject gerund titles (Integrating…) and bare-noun titles (Application performance monitoring), which hide whether the page is how, whether, or what. **Trade-offs**: none; humans and search engines both benefit.

## The "about" test

**When to use**: naming and scoping explanation. **How**: every explanation title should accept an implicit "About…" in front of it; scope the piece with a real or imagined why-question. **Trade-offs**: explanation stays open-ended even so; sometimes you just draw reasonable lines and accept them.

## The work/study test

**When to use**: content that is clearly propositional (no steps) but might be reference or explanation - or clearly practical but might be tutorial or how-to guide. **How**: ask whether the reader needs it during the task or away from the task. During: reference / how-to guide. Away: explanation / tutorial. **Trade-offs**: needs honesty about the actual reader; the same subject can legitimately exist on both sides as two documents.

## Quick classification tells

**When to use**: fast triage of existing content. **How**: boring and unmemorable, lists, tables - reference. Readable in the bath, or the answer to "can you tell me more about…?" - explanation. Steps with a managed path and no choices - tutorial. Steps with conditions and branches - how-to guide. **Trade-offs**: heuristics only; confirm borderline cases with the compass.

## Structure from the inside

**When to use**: adopting Diátaxis in a project with existing documentation. **How**: never create empty tutorial/how-to/reference/explanation scaffolding. Improve pieces via the loop; when accumulated changes start demanding that material move under a Diátaxis heading, create that heading then. **Trade-offs**: structure arrives later than a top-down reorg would fake it - but it arrives real, because the content has actually been improved.
