# The Simplicity reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Simplicity axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be showing off with a bigger solution than the ticket needs. Lazy and simple is good; less code is good.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Read first, without the diff: the Implementation criteria in `ticket.md` and the tree of `origin/<base>`.

1. Name the smallest change that meets the criteria: write it as a short list of the files and functions you would touch, reusing what exists and deleting what the change makes dead.
2. Then take the diff and check each added item against that list, one at a time:
   - a new function, class, file or layer: use the `LSP` references; one call site means it can be inlined;
   - a parameter, option, flag or hook: does any caller pass a second value; one value means it is speculative;
   - a helper or type: `rg` the base tree for the same job under another name, and give the `file:line` of the sibling;
   - a wrapper that only passes its arguments on;
   - code the change made dead and left behind.
3. For each place the diff is bigger than your list, write the smaller change in one line, with the lines the diff adds and deletes beside the lines the smaller change would.

Name the smallest change that meets the criteria first, and report only against it. Do not report style.
