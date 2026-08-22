# Candidate cases

Phrasings that no case in this suite covers yet. Each row is a seed: promote it by writing a
`routes-<skill>/prompt.md` plus its graders, the same shape every existing case uses.

**This suite is the only eval mechanism in the plugin.** There is no second, hand-run protocol, and no
per-skill eval file. A promoted candidate is scored by its graders, never by a tally kept in prose.

Read [the suite README](README.md) for the run command, the gate self-test and the covered cases.

## Positives - the skill that must fire

| # | The user types | Must fire |
| --- | --- | --- |
| C1 | Build t-42. | `build` |
| C2 | The spec is settled, so go build it. | `build` |
| C3 | Take t-19 through to a merged stack. | `build` |
| C4 | Start the build session for this task, hands off. | `build` |
| C5 | Poke holes in this plan before I start building. | `grill` |
| C6 | Ask me whatever you need to, one round at a time. | `grill` |
| C7 | Challenge my assumptions about how this feature should work. | `grill` |
| C8 | Run an adversarial panel over this architecture idea. | `grill` |
| C9 | Let us spec this out. | `planning` |
| C10 | Settle the requirements so a build can run unattended. | `planning` |
| C11 | Turn this idea into a task graph with dependencies. | `planning` |
| C12 | Agree the target program before we cut layers. | `planning` |
| C13 | The stack has drained, review it before I merge. | `qa` |
| C14 | Give me a pass or fail verdict on the whole diff. | `qa` |
| C15 | Judge these four layers as one change against product.md. | `qa` |
| C16 | Did we build what the roadmap item promised? | `qa` |

## Negatives - the sibling that must win instead

Every row below states a request that a nearby skill would poach. The winner column names a
model-invocable skill, because a skill carrying `disable-model-invocation: true` can never win a routing
case.

| # | The user types | Must win | Must not fire |
| --- | --- | --- | --- |
| C17 | Plan how we would add retries to the fetcher. | `planning` | `build` |
| C18 | What is worth working on next in this repo? | `audit` | `build`, `grill`, `planning` |
| C19 | Rewrite the README so it stops reading as AI-generated. | `documentation` | `build`, `qa` |
| C20 | Reconstruct product memory for this brownfield repo. | `bootstrap` | `grill`, `planning` |
| C21 | Write the issue body for this task. | `issue-authoring` | `build`, `grill`, `qa` |
| C22 | Review my branch for issues worth fixing later. | `audit` | `qa` |
| C23 | Stress-test my architecture idea. There is no task yet. | `grill` | `planning` |
| C24 | Build task `csv-loader`. | `build` | `planning` |

⚠ **C9 and C23 are the pair that costs the most.** Both read as an interview. Grill winning C9 skips the
branch, the draft PR, the task graph and `spec: settled`.

Two requests have no winner at all, and both are worth a case that asserts silence:

| # | The user types | Expected outcome |
| --- | --- | --- |
| C25 | Find every call site of the writer, with `file:line`. | no skill fires, because `scout` is slash-only |
| C26 | Wire the outputty plugin into this repo. | no skill fires, because `init` is slash-only |

## Behaviour, which this suite does not grade

A case grades which skill fired. It never grades whether the stage reached the right verdict. These three
`qa` scenarios need a prepared branch and a human reading the verdict, so they stay a manual backlog:

| # | The build under review | Expected verdict |
| --- | --- | --- |
| B1 | Two clean layers, contract met, the real run matches its expected output | `pass`, both checks, a handover naming the target |
| B2 | One layer that drifts from the roadmap item into adjacent work | `fail` on check 2, rewrite read, the drift named against `product.md` |
| B3 | Two independent problems closed in one stack, both green | `fail` on check 2, salvage read, the split named |

Two silent failures those scenarios exist to catch:

- **An empty range passes.** Point the checkout at a repo whose default branch is `master`. The verdict
  must report the base and a commit count, and must stop on zero commits.
- **A missing docstring blocks.** Add one undocumented helper to B1. The docstring belongs in the
  handover, and the verdict stays `pass`.
