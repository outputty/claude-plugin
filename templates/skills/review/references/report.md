# The review body

The review's body is posted with its inline threads. In this order:

**Pre-flight**: `Pinned head: <sha>` on the first line, the commits walked in order, and each commit over about 400 lines that does one action.

**Work left**: how many things change, in how many files and on which axes, then per finding its change, the link that opens it in the editor, the lines around it and the test that covers it.

**Findings**: the count per axis that ran (Standards, Spec, Correctness, Provenance, Tests, Simplicity), then one line per thread: `F<n>`, its axis and its `file:line`.

**Cleared**: each item cleared by a source, with the source quoted, and each false claim with the claim and the source side by side.

**Dropped**: the count of reader findings the judge dropped.

**Not run**: each axis skipped with its reason, the tests, and anything the reviewers could not check.

The documentation check posts the same body with threads `D<n>` and the axis `docs`.
