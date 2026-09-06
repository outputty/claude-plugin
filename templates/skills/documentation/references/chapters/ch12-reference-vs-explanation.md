# Chapter 12: The Difference Between Reference and Explanation

## Core Idea

Reference and explanation both occupy the theory half of the map - propositional knowledge, no steps to follow. The difference between them is the same as between tutorials and how-to guides: acquisition vs application of skill; study vs work.

## Frameworks Introduced

- **The work/study test**: if in doubt whether something is reference or explanation, ask: is this something someone would turn to _while working_ - actually getting something done, executing a task? Or something they'd need _once they have stepped away from the work_ and want to think about it?
  - Reference: what a user needs to help apply knowledge and skill while working.
  - Explanation: what someone turns to to help them acquire knowledge and skill - study.
  - Understanding these two relationships of reader to craft is the key to creating effective reference and explanation.
- **Rules of thumb** (for the common, easy cases):
  - If it's boring and unmemorable, it's probably reference.
  - Lists of things (classes, methods, attributes) and tables of information generally belong in reference.
  - If you can imagine reading it in the bath, it's probably explanation.
  - Imagine asking a friend on a walk or over a drink, "Can you tell me more about <topic>?" - what follows is most likely explanation.

## Key Concepts

- **A straightforward distinction, mostly**: reference as a form is well understood from an early age; a tidal chart is clearly reference, an article on why there are tides is self-evidently explanation.
- **Intuition isn't reliable enough**: it's easy to slip between the forms - which is what the compass (ch06) corrects.

## Mental Models

- The tidal chart vs the tides article: same subject, two forms - tables of figures consulted during navigation vs a discussion read to understand the phenomenon.
- Examples are the slip-point: it's perfectly reasonable to include illustrative examples in reference (as an encyclopaedia contains illustrations) - but examples are fun to develop, and the temptation is to grow them into explanation: saying why, showing what-if, telling how it came to be.

## Anti-patterns

- **Explanation sprinkled into reference**: bad for the reference - interrupted and obscured by digressions - and bad for the explanation too, which is never allowed to develop appropriately and do its own work.
- **Reference becoming expansive**: the usual mechanism of drift; watch reference material that is starting to enjoy itself.

## Worked Example

A reference page for a `retry` configuration option drifts:

Before (drifted): "retry_backoff (float, default 2.0) - the exponential backoff multiplier. We chose exponential backoff because thundering-herd retries overwhelmed early deployments; linear backoff was tried in v0.3 and abandoned because…"

The first clause informs cognition for application - a fact consulted mid-work: reference. Everything after "We chose" is why-material for study: explanation. After the split:

- Reference page: "retry_backoff (float, default 2.0) - exponential backoff multiplier applied between attempts. See About retry behaviour."
- Explanation page "About retry behaviour": the history, the thundering-herd rationale, the abandoned linear alternative, the trade-offs.

Both forms now do their own work; the reader at work consults, the reader at study reflects.

## Key Takeaways

1. Apply the work/study test whenever the cognition half of the map gets murky: consulted during the task means reference; read away from the task means explanation.
2. Trust the quick tells - boring/lists/tables signal reference; bath-readable, "tell me about…" signals explanation - but verify with the compass when it matters.
3. Keep examples in reference illustrative, never justificatory; the moment an example explains why, it's emigrating.
4. Separating the two rescues both: reference regains its austerity, explanation gains room to develop.

## Connects To

- **Ch 4**: reference in full.
- **Ch 5**: explanation in full.
- **Ch 6**: the compass, the corrective for exactly this boundary.
- **Ch 11**: the parallel distinction on the action half of the map.
