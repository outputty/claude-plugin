# The Spec reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Spec axis of the diff `<diff command>`, commits `<commit list>`.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

The spec is `ticket.md` in the evidence directory: its Implementation criteria and its Assumptions. Lines the caller passed replace it: `<the path or the lines the caller passed>`.

1. Number every Implementation criterion and every Assumption, quoting each in one line.
2. For each criterion, find the code that makes it true: the `file:line` in the diff, and the test or example output that shows it. Write `missing` when the diff has none, and `partial` with what is absent when it covers only some of the criterion's cases.
3. For a criterion with an example (an input and its output), compare the example's expected text with the string, value or branch in the code, character by character. A mismatch is a finding.
4. List each new behaviour in the diff that no criterion or assumption asks for: a flag, a branch, an output, a config key or an error path. Quote the line.

Do not judge style or design here. A finding is a criterion that is missing, partial or wrong, or a behaviour nobody asked for, each with the quoted spec line beside the quoted code line.
