# The reader contract

Every axis reader follows its own brief and this contract.

- Work from the tree and the files of the evidence directory, and start from `diff.patch`: read the rest of the repo only to follow a call, a reference or a sibling.
- Open every `file:line` before you report it. A line you cannot open is not reported.
- Report a finding only with a quote: one or two lines copied from the tree at that line, or a command and the first line it printed. No quote, no finding.
- Each finding has these fields: the axis, the `file`, a `line` the diff changed, one sentence of `claim`, the `evidence` quote, one sentence of `change` saying what to edit, a `test` `{file, from, to}` when a test covers the line, and the `rule` it breaks (the standard, the criterion, the sibling or the missing trace). A Provenance, Tests or Simplicity finding may carry a `question`.
- Write facts, not hedges: no "might", "could" or "consider". When you cannot show it, leave it out.
- Report at most eight findings, worst first, and say how many more you left out. Return an empty list when you found nothing.
- Edit nothing, run no test, and start no subagent.
