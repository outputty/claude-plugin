# The Tests reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Tests axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be lying about what its tests prove.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

The ticket's Implementation criteria, whole: `<the criteria>`. The Tests rules: `<the Tests section of ~/.claude/rules/outputty-code.md, and the language rule file's test lines>`.

For each test the diff adds or changes, name the one Implementation criterion it proves. Report each test that proves no criterion, each criterion that no test proves, the count of tests added against the count of criteria, and each test that is not the user's own program run through the public entry point: a test of an internal, a mock with no reason given, or a setup that no test owns.

Return each finding with how to validate it: its `file:line`. Under 400 words.
