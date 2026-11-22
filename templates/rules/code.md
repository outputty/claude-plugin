# Code

What code looks like, in any language. The rule file of a language adds to these, and the repo's `CLAUDE.md` wins where it disagrees with a line here.

## Exploring

- Explore code through the `LSP` tool first: definitions, references, callers, implementations, symbols. It is a deferred tool: load it with ToolSearch `select:LSP` before the first code lookup. Use a text search only for what a language server cannot answer: strings, logs, docs and config. Where the tool is missing or no language server answers for the file, search and read.

## Orchestrators and steps

- Write each function as an orchestrator or a step. An orchestrator only calls steps in order and returns what its queries returned; a loop over a step's result moves into the step. A step does one job: one read, one computation or one write.
- Write each step as a query, which returns data and changes nothing, or a command, which changes state and returns nothing.
- Don't write a function that both calls steps and loops over data or writes state: split it into an orchestrator and steps.
- Don't return a value from a function that changes state.

## Structure

- Reuse the repo's code, then the standard library, then an installed dependency, then write new code.
- Add a capability as sugar over existing primitives, else extend one, else add a primitive.
- Validate input once, at the public API. Raise with context where a lookup cannot succeed.
- Write a helper from its arguments alone; put behaviour across several functions in a class.
- Return early with guard clauses. Keep one concept per file, imports at the top.
- Build each part as a package: one purpose, an interface its callers depend on.
- Don't add a defensive check, fallback or catch without a recovery path. Don't remove security, accessibility or error handling that propagates.
- Don't write `else` after a `return` or a raise, or nest past two levels.

## Names

- Take a term from the **Language** section of the repo's `CLAUDE.md` wherever one fits, and keep one word per concept across code, docs and tickets.
- Name a thing by why it exists and what it does, in the trade's term, else the domain's word.
- Use whole, sayable words; a single letter names only a short loop's item.
- Name a class by a noun, a raw value by a constant, a function by a verb phrase, and an orchestrator `orchestrate<Action>`, such as `orchestrateRefund`.
- Keep `get`, `is` and `has` for calls that change nothing.
- Don't abbreviate, number, prefix or add noise words.

## Docstrings and comments

- Give each exported unit a docstring in [Google style](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html): a summary line, then `Args:`, `Returns:`, `Raises:` and `Examples:` as needed, or the language's own doc tags.
- Open with why the unit exists and what it does, in the simplest words.
- List core features only for an involved unit.
- Give one example per distinct use, and say when it applies.
- Take every term from the unit's code or its use outside the tests. Name its likely caller where it matters.
- Split a unit whose docstring grows long. Cut every word the reader would not miss.
- Write an inline comment only to say why, about the code beside it. Rename a thing rather than explain its name.
- Don't restate what the code shows, or explain how a caller works.
- Don't put a ticket number, history or removed name in a comment.

## Tests

- Test end to end through the public entry point against the real dependency; mock only what cannot run locally, and say why. No unit tests of internals.
- A test reads top to bottom as the user's whole program and its result; only setup no one test owns lives outside it.
