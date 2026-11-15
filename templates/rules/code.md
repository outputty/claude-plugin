# Code

What code looks like, in any language. The rule file of a language adds to these, and the repo's `CLAUDE.md` wins where it disagrees with a line here.

## Exploring

- Explore code through the `LSP` tool first: definitions, references, callers, implementations, symbols. Where the tool is missing or no language server answers for the file, fall back to searching and reading.

## Structure

- Reuse in this order: the repo's code, the standard library, an installed dependency, then the least new code.
- The caller owns misuse. Validate inputs once, at the public API; inside, add no defensive check, fallback or catch without a recovery path; an assertion that fails loudly on a broken expectation is not one. A lookup that cannot succeed raises with context. Keep security, accessibility and error handling that propagates.
- A function orchestrates (its steps in order, no algorithm) or is a step (one job); a loop over a step's result moves into the step.
- Guard clauses first, no `else` after a `return` or a raised error, nesting at most two deep, one concept per file, imports at the top.
- Build each part as if it were a package that will one day be published on its own: one clear purpose, its concerns kept apart from its neighbours', and callers that depend only on its interface, so another package with the same interface can replace it.
- A helper is a self-contained function: it works from its arguments alone.
- Behaviour that takes several functions is a class, or in a language without classes its nearest form, such as a struct with its methods.

## Classes

Every class reads the same way, so a reader who knows one knows them all.

- A class is a declaration or an operation. A declaration says what something is: a constructor and its knobs, and nothing that runs. An operation does one action.
- The members come in one order: the constructor, taking one object always named `config`; the knobs, one noun per setting, each returning a new instance; the lifecycle, in call order; then the private steps, as many as the class needs.
- An operation's lifecycle uses the same words in every class: `preflight` checks and changes nothing, `start` takes what the work needs, `orchestrate<Action>` does the work, `end` finishes it, and `abort` undoes it after a failure. A class leaves out a word it has no use for.
- One action per class. A class that owns several actions is split, one class per action.
- A method that users of the package call keeps the product's own word; the lifecycle words rule the classes the package's own code calls.

## Fits in your head

After Mark Seemann's [thresholds](https://blog.ploeh.dk/2020/04/13/curb-code-rot-with-thresholds/): seven stands for what a reader can hold at once.

- A function has at most seven paths: one, plus one for each `if`, loop, `case` and caught error (`catch`, `except`). Operators and optional chains do not count. This follows [his count](https://blog.ploeh.dk/2019/12/09/put-cyclomatic-complexity-to-good-use/) of branching and looping keywords, not a linter's.
- A function fits on [one screen of twenty-four lines](https://blog.ploeh.dk/2019/11/04/the-80-24-rule/); the formatter owns the width.
- A function keeps at most seven things in play: its parameters, its locals and the fields it reads.
- A step is a [command or a query](https://blog.ploeh.dk/2014/08/11/cqs-versus-server-generated-ids/): a command changes state and returns nothing; a query returns data and changes nothing. An orchestrator calls both and may hand back what its queries returned.
- Past a threshold, split: pull a named step out, or split the class by action. A function crosses one only with a one-line comment above it saying why it belongs whole.

## Names

Continuity comes first: take a name from the **Language** section of the repo's `CLAUDE.md` wherever a term there fits, and keep one word for one concept across code, docstrings, tickets and docs. Beyond that, these rules, from [these naming guidelines](https://dev.to/hyfydistro/intro-to-naming-guidelines-writing-meaningful-variable-names-13j5):

1. A name says why the thing exists, what it does and how it is used, in the trade's term where one fits, else the domain's own word.
2. A name is whole words, sayable and searchable, one per concept and a whole word apart from its neighbours: no abbreviation, numbered series, look-alike characters, noise word, prefix or one-letter plural. A single letter names only the item of a short loop, and the enclosing class, function or module gives the context.
3. A class is named by a noun wide enough for every state it holds, and a raw value by a constant. A function is named by a verb phrase: an orchestrator by `orchestrate` and its action, such as `orchestrateRefund`, with `get`, `is` and `has` kept for calls that change nothing.

## Docstrings and comments

An exported unit gets a docstring in [Google style](https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_google.html): a summary line, then `Args:`, `Returns:`, `Raises:` and `Examples:` as needed. A language with its own doc-comment tags carries the same parts in them. Its words follow **Names**: the repo's **Language** terms first, and one word for one concept.

1. Open with why the unit exists and what it is meant to do, in the simplest words. A docstring that grows long means the unit does too much: split the unit.
2. List its core features only when it is more involved; a simple helper that item 1 explains stops there.
3. Give an example, and say when it applies. When the unit is used in several distinct ways, list one example for each.
4. Leave out what the code already shows.
5. Be brief, but never at the cost of clarity.
6. Keep to this unit: do not explain how a caller or a parent works. Where that matters, name the class or function likely to call it.

- An inline comment says why, never what, speaks only of the code beside it, and carries no ticket number, history or removed name. Rename a thing rather than explain its name.
- Explain unidiomatic code, or a fix whose obvious rewrite is wrong, by naming the wrong answer.
- Link the source of copied code and the spec a line implements. Mark known incomplete work `TODO:` naming the limit.

## Tests

- Test end to end through the public entry point against the real dependency; mock only what cannot run locally, and say why. No unit tests of internals.
