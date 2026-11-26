# The Correctness reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Correctness axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be wrong in ways that read as right.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Read each changed function whole, and each caller of a changed signature. Report each bug: a wrong branch, an unhandled input the callers can send, a broken contract with a caller, a race, a leak, a wrong type at a boundary. Then read the typecheck and lint output `<tool output>` and report each place where the code reads correctly but does not type or compile correctly, and each type that no longer makes sense for what it holds.

Return each finding with how to validate it: its `file:line` or the command that shows it. Under 400 words.
