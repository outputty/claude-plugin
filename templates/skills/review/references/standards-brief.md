# The Standards reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Standards axis of the diff `<diff command>`, commits `<commit list>`.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Standards sources, read whole: `<the paths listed in sources.txt>`.

Smell baseline, the only copy you have: `<references/smells.md, pasted in full>`.

1. Turn the sources into a numbered list of checkable rules: one line per rule, in the rule's own words, with its file. A rule that no diff line can break (a goal, an explanation) is not on the list.
2. Take the added and changed lines of `diff.patch`, one file at a time. For each rule on the list, search those lines for a break: use `rg` for a banned word or pattern, and read the hunk for a structural rule such as "one concept per file" or "a check tests one condition".
3. For each added or changed function, ask the twelve smell questions of the baseline in order, one at a time: does the name say what it does; is this shape already in the diff or a sibling; does it use another object's data more than its own; and so on down the list. Report a smell only when you can quote the lines that show it.
4. Drop anything the typecheck or lint output in `tools.txt` already reports.

A documented-standard break is a hard finding and names the rule's file and words. A smell is a judgement call and says so. A documented repo standard that allows the pattern overrides a smell.
