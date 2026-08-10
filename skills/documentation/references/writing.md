# Writing craft — read when drafting or auditing README prose

The checklist in `SKILL.md` says *what* good looks like. This is *how* — the substance rules and the
concrete slop tells. Pull it in when you're actually writing or reviewing the prose, not before.

## Teach core concepts in code (the substance rule)

A core concept is **shown, then named** — not defined in the abstract and maybe illustrated later.
This is the section slop skips.

- **Lead with the code, annotate with prose.** If explaining takes three paragraphs and the code takes
  six lines, show the six lines and caption them. Don't make the reader assemble a mental model from
  adjectives.
- **Real examples, not toys.** Use names and values from the actual domain, not `foo`/`bar`/`doStuff`.
  A reader should be able to adapt it, not just recognise it.
- **Pair each with its result** — the return value, the output, the rendered thing — so the concept
  lands and the reader can confirm it.
- **2–4 examples, one concept each**, covering what a user hits first: the basic case, then the one or
  two that unlock the rest. Link out to a cookbook for the long tail.
- **Prose without a nearby example is the failure mode.** If a paragraph describes behaviour with no
  code beside it, either add the code or cut the paragraph.

## Architecture after, not instead

A bird's-eye "how it works" **belongs in the README** when the project's value is how its parts fit —
put it *after* the code, so the reader has concrete hooks to hang it on.

- Describe the **topology and the non-obvious decisions** (why this boundary, what talks to what), not
  every option. Name the components and how data/control moves between them.
- **Architecture is not an API dump.** Reference tables, full option lists, and long build guides route
  out to linked files — that's what "not a manual" protects. Explain the *shape* here, keep the
  *exhaustive detail* in the docs.
- A **diagram only when earned** — defer to `diagram`. Most sections are better as a short
  paragraph plus the code above them.

## Don't sound like AI (the slop tells)

Slop is confident prose with no specifics. Name the tell, cut it:

- **Throat-clearing openers** — *"In today's fast-paced world…", "At its core…", "It's worth noting
  that…", "When it comes to…"*. Delete; start with the subject.
- **Binary-contrast filler** — *"It's not just X — it's Y", "More than a Z", "X isn't about A, it's
  about B"*. States nothing; cut to the claim.
- **Hollow superlatives** — *seamless, powerful, robust, blazing-fast, effortless, comprehensive,
  cutting-edge, elegant, lightning-fast, out of the box*. Replace with the specific behaviour or a
  number, or drop.
- **Meta-commentary about the doc** — *"This section covers…", "As mentioned above…", "Let's dive
  in"*. The heading already said it.
- **Vague declaratives that fit any project** — *"designed to streamline your workflow", "makes X
  easy"*. If it would be true of ten other tools, make it specific or cut it.
- **Intensifier and adverb pile-ups** — *simply, just, easily, incredibly, really, very*. Usually the
  sentence is stronger without them; if a step is genuinely one command, show the command.
- **Metronomic rhythm** — every sentence the same length, every bullet the same shape. Vary it; read it
  aloud.

The fix for all of them: **replace the claim with a specific noun, number, or line of code.** Keep the
repo's own voice — the slop signal is the rhetorical pattern, not any one punctuation mark.

(On length: the checklist's *"length follows substance — cut filler, never the teaching code"* is the
whole rule; a code-forward README is legitimately longer than a routing stub. The savings come from
deleting example-less prose and reference detail that belongs in linked docs, not from thinning examples.)

## Simplified Technical English (ASD-STE100) — the checkable limits

Technical prose obeys numeric limits, because "write clearly" cannot be reviewed and these can:
**≤20 words** per sentence in instructions and **≤25** in description · **≤6 sentences** per paragraph ·
**one instruction per sentence** · **active voice** (passive only when the actor is unknown) · **simple
tenses only** — infinitive, imperative, simple present/past/future, past participle as an adjective ·
**no `-ing` forms** except as a technical noun or its modifier · **noun clusters ≤3 words**.

And the rule that carries the most weight in agent-facing docs: **one word, one meaning, one part of
speech.** Pick the term pinned in the project's Language section and use only that term for that thing —
a synonym introduced for variety reads to an agent as a second concept.

## MDN technical-writing rules — structure and progression

From MDN's technical-writing guidance (developer.mozilla.org/en-US/blog/technical-writing/). STE above
gives the numeric limits; these govern how a doc's prose is built:

- **One idea per sentence, one main idea per paragraph.** Split a sentence chained with semicolons or
  dashes into one sentence per idea.
- **Active voice with a named actor.** "The engine creates the table", never "the table is created".
  Replace an ambiguous "it/this/these" with the noun it names.
- **Introduce before you rely.** A section's first paragraph says what the thing IS and why the reader
  cares, before any mechanism. Define a term before you use it.
- **Logical progression: what → why → how → example → gotchas.** Each sentence connects to the
  previous one; no abrupt jumps.
- **A lead-in sentence, then a list.** Prefer a short list over a dense paragraph enumerating three
  things. Bullets for unordered items; numbers only for ordered steps.
- **Link text is meaningful out of context** — what the reader gets, never "here", "above", or
  "below".
- **Proofread for redundancy** — the same idea twice, the same word leaned on, a tense or tone shift.

## Group MECE — one home per item, no orphans

Sections, categories, and splits follow MECE: each item lands in **exactly one** place (mutually
exclusive), and every item **lands somewhere** (collectively exhaustive). Test a structure by asking
"can one thing belong to two of these?" and "what has no home?" — an overlap means two sections drift
apart describing the same thing; a gap means a reader invents the missing answer.

## State the positive — prohibitions are a last resort

Anthropic's prompting guidance is direct: *"Tell Claude what to do instead of what not to do."* A
negation drags the forbidden behaviour into context and makes it more available, not less — so write
the target behaviour ("write one-line comments"), and let the banned one go unspoken. A prohibition
earns its place only as a hard guardrail you cannot phrase positively (never commit, never fake output)
— and even then, pair it with the positive so attention lands on what to do. This applies doubly to
agent-facing docs: charters, skills, and injected protocol text.
