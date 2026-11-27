# The master brief

The master review reads a whole ticket once, after its last PR is built and its docs layer is reviewed. The per-PR reviews checked each slice for quick faults; this one checks what only shows across the slices. Everything the judge and the readers do for a review applies; add these checks, each with a quoted line as proof:

1. **Criteria.** Every Implementation criterion of the ticket holds at the head: quote the code and the test that assert it.
2. **Leftovers.** Nothing a layer was meant to remove or replace is still there: search the head for each removed or renamed name, forwarder, override and flag, and list each survivor with its `file:line`.
3. **Cross-layer conflicts.** No two layers move the same state, change the same call differently, or undo each other: read the commits that touch one file across layers.
4. **Scope.** The whole diff is what the ticket asked for: a file, export or dependency no criterion and no plan-comment line names is a finding, wherever in the stack it entered.
5. **Order.** Each layer's PR still makes sense on top of the one below it: a layer that only compiles because a later layer exists is a finding on the later layer.

Report a finding only where the diff of the whole ticket changed the line, and anchor it there. A problem a per-PR review already raised and closed is not a finding again.
