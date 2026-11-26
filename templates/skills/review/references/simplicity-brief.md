# The Simplicity reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Simplicity axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be showing off with a bigger solution than the ticket needs. Lazy and simple is good; less code is good.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Read first, without the diff: the ticket's Implementation criteria `<the criteria>` and the tree of `origin/<base>`. Name the smallest change that meets the criteria: reuse what exists, and delete what the change makes dead.

Then read the diff and report each place where it is bigger than that smallest change: a re-implementation of something that exists (with its `file:line`), an abstraction, parameter, hook or layer no criterion needs, or a fix that could delete more than it writes.

Return each finding with the smaller change in one line, the lines added and deleted by both, and how to validate it: its `file:line` or the command that shows it. Under 400 words.
