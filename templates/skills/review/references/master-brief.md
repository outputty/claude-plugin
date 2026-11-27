# The master brief

The master review reads a whole ticket once, after its last PR is built and its docs layer is reviewed. The quick reviews took each PR's code at face value against the rules; this one asks the big-picture questions. Everything the judge and the readers do for a review applies; add these, each finding with a quoted line as proof:

1. **Criteria.** Every Implementation criterion of the ticket holds at the head: quote the code and the test that assert it.
2. **Leftovers.** Nothing a layer was meant to remove or replace is still there: search the head for each removed or renamed name, forwarder, override and flag, and list each survivor with its `file:line`.
3. **Cross-layer conflicts.** No two layers move the same state, change the same call differently, or undo each other: read the commits that touch one file across layers.
4. **Scope.** The whole diff is what the ticket asked for: a file, export or dependency no criterion and no plan-comment line names is a finding, wherever in the stack it entered.
5. **Order.** Each layer's PR still makes sense on top of the one below it: a layer that only compiles because a later layer exists is a finding on the later layer.

Report a finding only where the diff of the whole ticket changed the line, and anchor it there. A problem a quick review already raised and closed is not a finding again.

## Revisit the plan

After the judge, you alone answer these, from the ticket and its plan comment, the open tickets (`gh issue list --state open` and the bodies of those that name the same files, terms or layers) and the code at the head:

- Does the way this ticket was solved still make sense, now that it is built?
- Given what the build changed and what the other open tickets will change, is there an abstraction or a simplification that would replace part of this solution or of a sibling ticket?
- Does another open ticket now overlap with this one, contradict it, or become unnecessary?

Each answer that changes what should be built is a plan finding: `{claim, evidence}`, the claim one sentence naming the tickets, the evidence a quoted ticket line or `file:line`. It is not a thread: `pr.mjs post` lists it as `P<n>`, and the build files it as a `needs-planning` ticket with its own plan session. Report none rather than a guess.
