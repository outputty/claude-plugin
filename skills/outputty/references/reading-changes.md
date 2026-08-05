# Reading changes — the exact commands, and why grep is the expensive path

Both reviewers answer the same first question — **what changed?** — and both answer it with git, not with
search. Git already knows the answer exactly; grep re-derives it approximately, one guess at a time.

**One fact decides which commands you use:**

| Reviewer | What it is looking at | Range |
| --- | --- | --- |
| `outputty-qa` (per layer) | the builder's **uncommitted working tree** — nothing is committed until QA passes | working tree vs `HEAD` |
| `outputty-master-qa` (whole build) | **committed history** — every layer was committed as it passed | `<merge-base>...HEAD` |

Using the wrong one returns an empty result that reads exactly like "nothing to review."

## QA — one layer, uncommitted

```bash
# 1. The complete file list — tracked changes AND the builder's new files, in one call.
git status --porcelain -uall -- <the layer's scope>
```

Read the two-character prefix: ` M` modified, ` D` deleted, `??` **new**. That list is the review's
boundary — nothing off it is yours, nothing on it gets skipped.

```bash
# 2. Before against after, for every tracked file at once. One call, not one per file.
git diff -- <the layer's scope>

# Size it first when the layer is large, so you know what you are about to read:
git diff --stat -- <the layer's scope>
```

```bash
# 3. Then Read each file from the step-1 list, whole.
```

A `??` file has no "before" — the whole file **is** the change, so step 2 has nothing to show and step 3
is the only view of it.

> **`git diff` cannot see new files, and this is the trap.** Verified: with `a.txt` modified and `c.txt`
> newly created, `git diff --name-status` reports only `M a.txt`. A reviewer who lists files with
> `git diff` alone silently reviews a layer minus every file the builder created. `--porcelain -uall` is
> what closes it — plain `--porcelain` collapses a new directory to `sub/` and hides `sub/d.txt` inside it.

## Master QA — the whole build, committed

```bash
BASE=$(git merge-base origin/main HEAD)

git diff --stat $BASE...HEAD          # 1. the shape of the build, one call
git diff --name-status $BASE...HEAD   # 2. the file list — A added, M modified, D deleted
git diff $BASE...HEAD                 # 3. before against after, everything
```

Then `Read` each file whole. Committed history needs no untracked handling — an added file shows up as
`A`, with its full content in the diff.

## What not to do, and what it costs

| Instead of | Do | Why |
| --- | --- | --- |
| `grep`ping for where a symbol changed | `git diff --name-status` | Git knows exactly. Grep hits the name in a comment, a string and an unrelated scope, and misses the re-export. |
| `git log -p` per file | one `git diff $BASE...HEAD` | Same information, one call instead of N, and no commit-by-commit replay of code that was later rewritten. |
| `head` / `tail` / `sed -n` to peek at a file | `Read` it | A peek costs a call and gives you a fragment you then have to place. The file costs one call and needs no placing. |
| Re-running `git diff` per file after diffing the scope | scroll what you already have | The whole-scope diff was one call and it already contains every file's hunks. |
| Reconstructing a file from a dozen greps | `Read` it | A dozen greps cost more tokens than the file, take twelve turns instead of one, and leave you assembling fragments in your head. |

**The rule underneath all of it: three git calls and N whole-file reads, where N is the number of files
that actually changed.** That is the floor, and it is reachable on every review. Anything past it is
re-deriving something git already told you.

**`Grep` and `LSP` still have one job — reaching *outside* the changed set.** *Who else calls this? What
breaks if this signature moved? Is this already solved elsewhere in the repo?* Those are real questions
that git cannot answer, and `references`/`callHierarchy` answer them exactly where grep guesses. They come
**after** the reading, never instead of it.
