# The Standards reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Standards axis of the diff `<diff command>`, commits `<commit list>`.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Standards sources, read whole: `<paths of the files found in step 3>`.

Smell baseline, the only copy you have: `<references/smells.md, pasted in full>`.

Report, per file and hunk:

- every place the diff violates a documented standard, citing the standard's file and the rule's words;
- every baseline smell you spot, naming it and quoting the hunk.

A documented-standard breach can be hard. A baseline smell is always a judgement call, and a documented repo standard overrides it. Skip anything tooling enforces.

Return each finding with how to validate it: its `file:line` or the command that shows it. Under 400 words.
