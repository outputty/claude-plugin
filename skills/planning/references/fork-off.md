# Fork-off - running candidates side by side

A planning session reads this when one question needs more than one thing built to answer it. Input: two
to four candidates, and the question they settle. Output: one answer, recorded — plus, for a prototype,
one surviving worktree.

**A fork inherits the whole conversation**: the same system prompt, tools, model and message history, on
a shared prompt cache. So a candidate costs what it builds, not what it has to be told. That is the
entire reason this exists: you have already grilled the problem, and re-explaining it to a fresh
subagent is the expensive part.

## Which one you are running

Two shapes, and they differ only in what survives.

1. **A spike per candidate** - the question is empirical and the code is disposable. Every worktree
   dies. The answer lives in the trail and in one `spike-<slug>` test.
2. **A prototype per candidate** - the question is which shape to build, and the winner is the first
   real commit. The winning worktree survives and becomes the build's.

⚠ **One question does not need a fork-off.** A single spike is one fork with no worktree: it edits this
session's tree, writes its `spike-<slug>` test, and returns. Reach for the procedure below only when
candidates run side by side.

## Run the candidates

**1. Name the question, and what would settle it.** One sentence, and the observable that decides it -
a number, an output, a run that either works or does not. Write it into the trail before you spawn
anything. A comparison whose criterion is chosen afterwards picks whatever the winner happened to do.

**2. Fork one per candidate**, each in a worktree of its own:

```text
Agent { subagent_type: "fork", isolation: "worktree", run_in_background: true,
        prompt: "Candidate <name>: <the one-line shape to build>.
                 Build the thinnest thing that answers <the question>.
                 Report: the observable, the command that produced it, and your worktree path." }
```

Each part carries a rule:

1. ⚠ **`subagent_type: "fork"`, never a plain subagent.** A plain subagent starts fresh and has to be
   told the problem, which is the cost this avoids and the drift it invites.
2. ⚠ **`isolation: "worktree"` on every candidate.** Without it they share one tree and overwrite each
   other. The worktree is cut from this session's `HEAD` (`worktree.baseRef: "head"`), so a candidate
   starts from the branch you are planning on, with your commits in place.
3. **Two to four.** Below two there is nothing to compare; past four nobody reads the results.
4. **The prompt names the shape, never the implementation.** A candidate that is told how to build it
   is testing your guess, not its own.
5. **Every candidate answers the same question**, with the same observable. Different questions are
   different spikes, run separately.

**3. Wait, then read the observables.** Each fork returns its number, its command, and its worktree
path.

## Pick on the observable, never on the diff

⚠ **Judge what ran, not the code that ran it.** You have the planning context and authored neither
candidate, so a diff read here compares two implementations you cannot fairly reconstruct. It reliably
picks the one whose style you recognise.

1. **The observable decides**, against the criterion you wrote in step 1.
2. **A tie is an answer**: the shapes are equivalent on the thing you cared about, so pick on the
   cheaper one and record that the criterion did not separate them.
3. **Every candidate failing is also an answer**, and the most valuable one. Record it and take the
   question back to SPEC.
4. **If you find yourself reviewing code to choose**, the criterion was wrong. Stop, fix the criterion,
   and re-run rather than deciding on taste.

## What survives

**A spike per candidate:** nothing but the answer. `append_trail` the decision, what was dropped, and
why. Keep the winner's probe as one `spike-<slug>` test committed to this session's branch, and let
every worktree go. Say in the recap that you discarded them.

**A prototype per candidate:** the winning worktree, and only that one.

1. **Record the decision first**, with the observable that settled it, before you touch a worktree.
2. **Adopt the winner** by entering its worktree with `EnterWorktree`. It is under
   `.claude/worktrees/`, so no approval is needed, and the worktree you leave stays on disk untouched.
3. **Commit what it holds on a real branch**, `feature/<kebab>`. A prototype is the first real commit,
   so it is kept and matured - never left as a loose worktree the sweep decides about.
4. **Remove the losers**, explicitly. `git worktree remove --force` each one. A worktree holding
   changes survives the periodic sweep, so a candidate nobody removes is a candidate that lingers for
   `cleanupPeriodDays` looking like live work.
5. **The task carries `stage: prototype`.** The next stage in its `deps` chain is `build`, which hardens
   the slice to the `contract` and drops what did not survive.

⚠ **A prototype is not a finished layer.** It is the thinnest end-to-end slice that runs. Adopting one
means the build starts from working code, never that the build is done.

## What this does not do

1. **It never merges anything.** A fork-off answers a question. The merge gate is unchanged, and a
   prototype still goes through `build` and master QA like any other work.
2. **It cannot ask you anything.** `AskUserQuestion` is stripped from every subagent, forks included,
   so a candidate that hits a ruling nobody made reports the gap and stops. That is a signal the
   question was underspecified, not a candidate to discard.
3. **It is not for review.** A fork inherits this session's reasoning, which is exactly what a reviewer
   must not have. Master QA stays an independent subagent with a fresh context.
