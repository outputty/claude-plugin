# Publishing a layer — the PR stack

**Read this when a layer passes and you are about to commit and publish it**, not at the start of BUILD.
It is the mechanics of turning layers into stacked pull requests; the layer loop itself does not need it.

## Layers ship as a stack of PRs

A layer is already the right unit for review: `schedule` derives them in dependency order, and layer N+1
builds on layer N. That is exactly a **stack**, so BUILD publishes **one PR per layer** rather than one
PR carrying every layer's diff. A reviewer opens layer 3 and sees layer 3's diff, not forty files.

**`gh stack` is required** (`gh extension install github/gh-stack`), like `gh` itself. **There is no
single-PR fallback** — a build that cannot stack is a build that cannot publish, so assert the extension
at preflight and **escalate before the first layer** if it is missing or stacked PRs aren't enabled on
the repo. Failing at branch-cut costs the user one install; discovering it after three layers means
unpicking commits from a branch shape that was never going to publish.

**The branch-cut PR is the bottom of the stack.** Step 1 already opens a draft PR carrying the trail and
the scoping diff; layer branches stack on top of that branch, so the stack reads
`main ← feature/<x> ← feature/<x>-l1 ← feature/<x>-l2 …`.

### The stack order IS the dependency order — and why linear is right

A stack is a linear chain; a task graph is a DAG. That looks like a mismatch, but for the layers
`schedule` derives it isn't one, and the reason is worth stating because it is what makes the stack
correct rather than merely convenient.

`schedule` is a Kahn leveling: a task lands in the **earliest** layer where all its deps are done.
So if a task were not blocked by layer N, it would already have been placed at layer N or lower.
**Therefore every layer N+1 contains at least one task depending on layer N** — consecutive layers are
always genuinely dependent, and stacking layer N+1 on layer N states a real relationship.

Verified by running `schedule` on a graph built to break it:

```text
layer 1: t1                       depends on layer(s): -
layer 2: t2 t8                    depends on layer(s): 1      ← t8 deps ONLY t1, lands at 2, not later
layer 3: t3                       depends on layer(s): 2
layer 4: t7                       depends on layer(s): 1,3    ← spans layers; still includes 3
```

A task that depends only on layer 1 **is** a layer-2 task, so it already stacks directly on layer 1.
A layer whose deps span layers 1 and 3 still depends on 3, so it still belongs above it.

**Assert it rather than trust it.** Before opening the stack, map each task's `deps` to the layer holding
them and confirm layer N+1 resolves to layer N. If one doesn't, the graph and the stack shape disagree —
**escalate, don't guess a base branch**:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/outputty/tasks.js" schedule --json
# for each layer N+1: some task's deps must resolve into layer N
```

**Drained work is the one real exception.** Discovered tasks come from `ready`, not `schedule`, so a task
added during layer 1 (`tasks.js add … --from t1`) may depend only on layer 1 yet run as a layer *after*
layer 3. Stack it **on top anyway**: its branch then carries layers 1–3's code, its diff still shows only
its own change, and the false dependency costs nothing because the whole stack merges atomically. Cutting
it from layer 1 instead would make it a sibling, not a stack member — and GitHub stacks are linear, so
that would need a second stack for no review benefit.

**Name layers with a hyphen, never a slash.** `feature/<x>/l1` is rejected by git the moment
`feature/<x>` exists as a branch — a ref cannot also be a directory
(`cannot lock ref … 'refs/heads/feature/<x>' exists`), and the bottom of the stack is always that
branch. Verified by running: this is a hard git constraint, not a style preference.

Per layer, after its commits land on its own branch:

```bash
git checkout -b feature/<x>-l<N>               # off the previous layer's branch, not off main
# … commit stage runs here …
gh stack add feature/<x>-l<N>                  # first layer instead: gh stack init <branch> <branch>
gh stack submit --auto                          # push + open/update the PRs as drafts
gh pr edit <n> --title "<the write-up's heading>" --body-file <QA's final write-up>
```

**Set the title explicitly.** `--auto` names each PR after its branch, so a stack ships as
"feature/incremental source port l6" — ten PRs no reviewer can tell apart in a list. The title is the
write-up's `## <what this layer did>` heading, which already says it in plain language.

**Two flags are load-bearing, and both are hands-off traps.** `gh stack init` with **no arguments demands
interactive input** (`interactive input required; provide branch names as arguments`) — always pass the
branch names, which you already have from `schedule`. And `gh stack submit` **opens an editor** unless
you pass **`--auto`**; with `--auto` new PRs are created as **drafts** (add `--open` only if you want them
ready for review, which BUILD does not — nothing is ready until master QA).

**Rebasing is a new failure mode.** If a lower layer changes after a higher one exists — a QA round that
patches layer 1 while layer 2 is already open — the branches above it need `gh stack sync` (or
`gh stack rebase`). A **conflict there is an escalation**, exactly like a spent QA loop: stop, report the
conflicting layers, and let a human resolve it. Never force-resolve a rebase inside a hands-off build.

**This file ends at the last layer's PR.** Draining discovered work and running master QA are
**whole-build** steps, and they used to live here — which meant the instruction was delivered while you
published *layer 1* and was long gone by the time it had to fire after layer N. They now live in
`build.md`'s **"The graph has drained"** section, where you will already be standing when they are due.
