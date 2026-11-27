# The Spec reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Spec axis of the diff `<diff command>`, commits `<commit list>`.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

The spec, whole: `<the path or the fetched contents, and the lines the caller passed>`.

Report:

- requirements the spec asked for that are missing or partial;
- behaviour in the diff that was not asked for;
- requirements that look implemented but where the implementation looks wrong.

Quote the spec line for each finding. Return each finding with how to validate it: its `file:line` or the command that shows it. Under 400 words.
