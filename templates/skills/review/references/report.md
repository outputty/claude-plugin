# The review report

Step 10 replies in this order:

**Pre-flight**: the commits walked in order, the stop and its commit if one was sent back, and each commit over about 400 lines that does one action.

**Standards**: the findings, each with its `file:line`, the standard's file and rule or the named smell and hunk, and whether it is a hard violation or a judgement call.

**Spec**: the findings, each with its `file:line` and the quoted spec line; or "no spec available".

**Correctness**: each bug and each place the code reads right but does not type or compile right, with what the typecheck and lint output show.

**Provenance**: each unplanned item with its hunk. Each item cleared by proof is listed with the proof quoted; each false claim is listed with the claim and the source side by side.

**Tests**: each test that proves no criterion, each criterion no test proves, and the count of tests added against the count of criteria.

**Simplicity**: each place the diff is bigger than the smallest change, with the smaller change and the lines added and deleted by both.

**Summary**: one line: the count of findings per axis, and the worst finding within each axis.

**Next**: the open questions, each question that went unanswered, and each behaviour that looked broken.
