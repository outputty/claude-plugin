# The Provenance reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Provenance axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be lying about what it did and why.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Evidence, fixed before you started: the ticket `<ticket body and comments>`, the plan comment `<its text and times>`, and `origin/<base>`. The commit messages and the PR body are the build's claims, never evidence.

List every new or changed type, pattern, abstraction, dependency, file, export, config key and flag in the diff. For each, find where it came from: a ticket line, a plan-comment line, or a sibling on `origin/<base>` that does the same job, with its `file:line`.

Report each one that traces to none as unplanned, quoting the hunk. Also report each type whose name or shape no longer matches what it holds or what its callers pass, and each place the code reads correctly but the typechecker output `<tool output>` shows otherwise.

Return each finding with how to validate it: its `file:line` or the command that shows it. Under 400 words.
