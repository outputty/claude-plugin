# Candidate cases

Phrasings that no case in this suite covers yet. Each item is a seed: promote it by writing a
`routes-<skill>/prompt.md` plus its graders, the same shape every existing case uses.

**This suite is the only eval mechanism in the plugin.** There is no second, hand-run protocol, and no
per-skill eval file. A promoted candidate is scored by its graders, never by a tally kept in prose.

Read [the suite README](README.md) for the run command, the gate self-test and the covered cases.

## Positives - the skill that must fire

1. **C1** - "Build t-42." Fires `build`.
2. **C2** - "The spec is settled, so go build it." Fires `build`.
3. **C3** - "Take t-19 through to a merged stack." Fires `build`.
4. **C4** - "Start the build session for this task, hands off." Fires `build`.
5. **C5** - "Poke holes in this plan before I start building." Fires `grill`.
6. **C6** - "Ask me whatever you need to, one round at a time." Fires `grill`.
7. **C7** - "Challenge my assumptions about how this feature should work." Fires `grill`.
8. **C8** - "Run an adversarial panel over this architecture idea." Fires `grill`.
9. **C9** - "Let us spec this out." Fires `planning`.
10. **C10** - "Settle the requirements so a build can run unattended." Fires `planning`.
11. **C11** - "Turn this idea into a task graph with dependencies." Fires `planning`.
12. **C12** - "Agree the target program before we cut layers." Fires `planning`.
13. **C13** - "The stack has drained, review it before I merge." Fires `qa`.
14. **C14** - "Give me a pass or fail verdict on the whole diff." Fires `qa`.
15. **C15** - "Judge these four layers as one change against product.md." Fires `qa`.
16. **C16** - "Did we build what the roadmap item promised?" Fires `qa`.

## Negatives - the sibling that must win instead

Every item below states a request that a nearby skill would poach. Each winner is a model-invocable
skill, because a skill carrying `disable-model-invocation: true` can never win a routing case.

1. **C17** - "Plan how we would add retries to the fetcher." Wins `planning`; never `build`.
2. **C18** - "What is worth working on next in this repo?" Wins `audit`; never `build`, `grill` or
   `planning`.
3. **C19** - "Rewrite the README so it stops reading as AI-generated." Wins `documentation`; never
   `build` or `qa`.
4. **C20** - "Reconstruct product memory for this brownfield repo." Wins `bootstrap`; never `grill` or
   `planning`.
5. **C21** - "Write the issue body for this task." Wins `issue-authoring`; never `build`, `grill` or `qa`.
6. **C22** - "Review my branch for issues worth fixing later." Wins `audit`; never `qa`.
7. **C23** - "Stress-test my architecture idea. There is no task yet." Wins `grill`; never `planning`.
8. **C24** - "Build task `csv-loader`." Wins `build`; never `planning`.

⚠ **C9 and C23 are the pair that costs the most.** Both read as an interview. Grill winning C9 skips the
branch, the draft PR, the task graph and `spec: settled`.

Two requests have no winner at all, and both are worth a case that asserts silence:

1. **C25** - "Find every call site of the writer, with `file:line`." No skill fires, because `scout` is
   slash-only.
2. **C26** - "Wire the outputty plugin into this repo." No skill fires, because `init` is slash-only.

## Behaviour, which this suite does not grade

A case grades which skill fired. It never grades whether the stage reached the right verdict. These three
`qa` scenarios need a prepared branch and a human reading the verdict, so they stay a manual backlog:

1. **B1** - two clean layers, contract met, the real run matching its expected output. Expect `pass` on
   both checks, and a handover naming the target.
2. **B2** - one layer that drifts from the roadmap item into adjacent work. Expect `fail` on check 2, a
   rewrite read, and the drift named against `product.md`.
3. **B3** - two independent problems closed in one stack, both green. Expect `fail` on check 2, a salvage
   read, and the split named.

Two silent failures those scenarios exist to catch:

- **An empty range passes.** Point the checkout at a repo whose default branch is `master`. The verdict
  must report the base and a commit count, and must stop on zero commits.
- **A missing docstring blocks.** Add one undocumented helper to B1. The docstring belongs in the
  handover, and the verdict stays `pass`.
