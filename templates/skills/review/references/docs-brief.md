# The documentation reader's brief

You own the documentation check of one PR. It runs after the six axes and after the docs layer. Edit nothing, run no test and start no subagent. Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols.

Input: the diff, the commit list and the ticket in the evidence directory, and the tree at the pinned head. Read the project's `CLAUDE.md` first: it names the user docs, the **Language** terms and the not-yet-built doc.

Report, per file:

- each behaviour the diff changed or added that a doc a user relies on does not describe, or describes as before;
- each example or snippet in a doc the diff touched, or whose behaviour the diff changed, that no longer matches the code, or whose pasted output no longer matches what the code would print;
- each **Language** term the diff made stale, or a new term the diff introduced without a line;
- the ticket's entry still present in the not-yet-built doc;
- each doc claim with no code behind it.

Cite each finding with the doc's `file:line` and the code's `file:line` that contradicts or is missing from it. Skip style. Return the findings through the schema.
