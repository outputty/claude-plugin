# The spike branch

A build reads this only when its ticket is tagged `spike`. Input: one spike ticket. Output: a drafted
ticket, a committed probe, and a PR nobody merges.

**A spike answers an empirical question.** It does not ship the answer. Run these steps in place of
BUILD, MASTER QA and Merge.

1. **Answer the question, in the repo.** Write the probe as a test named `spike-<slug>` in the repo's
   own suite, variants as cases in one file, and commit it on your branch. A spike that argues rather
   than runs has answered nothing.
2. **Draft the ticket the answer makes possible**: `add_task` `{ project, id, title, brief, contract,
   scope, discovered_from: <this spike's id> }`. The `issue-authoring` skill owns its shape, and the
   bar it clears is *dispatchable*: a cold, unattended child can build it from the ticket alone.
3. **Record the answer** with `append_trail` `{ project, id, kind: "decision" }` - the question, what
   the probe showed, and the ticket it became. Write it for a reader who was not here.
4. **Close the spike**, and report the drafted id.

⚠ **A spike ends at its open PR.** Push the branch and open the PR so the probe is reviewable, then stop:
the gate the answer exists to inform comes next.

**A spike that answers nothing is still an answer.** Say what the probe showed, record why the question
turned out to be the wrong one, and close without drafting a ticket.
