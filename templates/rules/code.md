# Code

What code looks like, in any language. The rule file of a language adds to these, and the repo's `CLAUDE.md` wins where it disagrees with a line here.

## Exploring

- Explore code through the `LSP` tool first: definitions, references, callers, implementations, symbols. It is a deferred tool: load it with ToolSearch `select:LSP` before the first code lookup. Use a text search only for what a language server cannot answer: strings, logs, docs and config. Where the tool is missing or no language server answers for the file, search and read.

## Structure

- Reuse the repo's code, then the standard library, then an installed dependency, then the least new code. A new capability is sugar over existing primitives, else an extension of one, else a new primitive.
- Validate inputs once, at the public API. Inside, no defensive check, fallback or catch without a recovery path; a lookup that cannot succeed raises with context. Keep security, accessibility and error handling that propagates.
- A function orchestrates its steps in order, or is one step; a loop over a step's result moves into the step. A helper works from its arguments alone; behaviour across several functions is a class.
- Guard clauses first, no `else` after a `return` or a raised error, nesting at most two deep, one concept per file, imports at the top.
- Build each part as a package with one purpose and an interface its callers depend on.

## Classes

Every class reads the same way.

- A class is a declaration or an operation. A declaration says what something is: a constructor and its knobs, and nothing that runs. An operation does one action.
- The members come in one order: the constructor, taking one object always named `config`; the knobs, one noun per setting, each returning a new instance; the lifecycle, in call order; then the private steps, as many as the class needs.
- An operation's lifecycle uses the same words in every class: `preflight` checks and changes nothing, `start` takes what the work needs, `orchestrate<Action>` does the work, `end` finishes it, and `abort` undoes it after a failure. A class leaves out a word it has no use for.
- A method that users of the package call keeps the product's own word; the lifecycle words rule the classes the package's own code calls.

## Names

Continuity comes first: take a name from the **Language** section of the repo's `CLAUDE.md` wherever a term there fits, and keep one word for one concept across code, docstrings, tickets and docs. Beyond that, these rules, from [these naming guidelines](https://dev.to/hyfydistro/intro-to-naming-guidelines-writing-meaningful-variable-names-13j5):

1. A name says why the thing exists, what it does and how it is used, in the trade's term where one fits, else the domain's own word.
2. Names are whole words, sayable and searchable, one per concept and a whole word apart from their neighbours: no abbreviation, numbered series, look-alike characters, noise word, prefix or one-letter plural. A single letter names only the item of a short loop. A function reads on its own: its names carry the meaning, and at worst one look at its parent supplies the rest.
3. A class is named by a noun wide enough for every state it holds, and a raw value by a constant. A function is named by a verb phrase: an orchestrator by `orchestrate` and its action, such as `orchestrateRefund`, with `get`, `is` and `has` kept for calls that change nothing.

## Docstrings and comments

An exported unit gets a docstring in [Google style](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html): a summary line, then `Args:`, `Returns:`, `Raises:` and `Examples:` as needed. A language with its own doc-comment tags carries the same parts in them.

1. Open with why the unit exists and what it is meant to do, in the simplest words. When a docstring grows long, split the unit.
2. List its core features only when it is more involved; a simple helper that item 1 explains stops there.
3. Give an example, and say when it applies. When the unit is used in several distinct ways, list one example for each.
4. Leave out what the code already shows.
5. Cut every word the reader would not miss, never at the cost of clarity.
6. Keep to this unit. Every term, in the text or in an example, and the why come from the unit's own code or its use outside the tests; a term found only in a test stays out. Give just enough of where the unit sits for its names to feel familiar, without explaining how a caller or a parent works; where it matters, name the class or function likely to call it.

- An inline comment says why, never what, speaks only of the code beside it, and carries no ticket number, history or removed name. Rename a thing rather than explain its name.

## Tests

- Test end to end through the public entry point against the real dependency; mock only what cannot run locally, and say why. No unit tests of internals.
- A test reads top to bottom as the user's whole program and its result; only setup no one test owns lives outside it.
