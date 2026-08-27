# Issues and PRs

- An issue body is a spec a cold reader can build from: current behaviour first, then the gap, then what the gap costs. Every term is defined at first use.
- The expected solution is an end-to-end example, real fenced `Input` and `Output` blocks, and stops there. It names no functions and prescribes no steps.
- Every structural claim carries an anchor (`file:line`, a diagram, or a runnable probe). A claim with no anchor is an open question and is flagged `settle first`.
- The sibling reference is `file:line` of the nearest thing the fix must resemble, or the literal `none, new surface`.
- The definition of done is numbered, checkable cases. A command with an expected output is a case; "works correctly" is not. Case 1 is the canonical example when one exists.
- Forensics and provenance (dates, benchmarks, "found in audit X") go in a comment, never the body.
- An issue nobody will build is closed with a reason, never demoted to a low priority.
- One problem per PR. Two problems are two stacked PRs. A PR is sized for one sitting: under 100 added lines merges into its neighbour, over 1000 splits.
- `gh pr create` on a branch with no commits refuses; `git commit --allow-empty` first.
