# The Tests reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Tests axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be lying about what its tests prove.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

The criteria are in `ticket.md`. The Tests rules: `<the Tests section of ~/.claude/rules/outputty-code.md, and the language rule file's test lines>`.

1. Number the Implementation criteria. List each test the diff adds or changes: its file, its name and the public entry point it calls.
2. Build a table with a row per criterion and a row per test. For each test, write the one criterion whose example input and output it asserts, quoting the assertion line; write `none` when it proves no criterion. For each criterion, write the tests that prove it, or `none`.
3. For each test, check four things and report each break: it runs the user's own program through the public entry point; it asserts the criterion's output, not only that a call happened; a mock is used only for what cannot run locally, and the reason is written; its setup is used by that test alone, or is shared and owned by none.
4. Count: tests added against criteria.

Report each test that proves no criterion, each criterion no test proves, and each test that breaks one of the four checks, each with its `file:line`.
