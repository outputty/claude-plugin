---
name: bootstrap
description: Reconstructs outputty's product memory for a brownfield repo with no .claude/product.md yet. Runs once, after init. Not a codebase survey (audit), not a README rewrite (documentation).
---

# bootstrap - brownfield reconstruction

One job: reconstruct all five product-memory docs, plus the targets and tasks in the `tasks` MCP server.
No planning, no building. This skill writes the prose Markdown docs directly.

Input: a repo whose own history is the only source - its docs, its docstrings, its commits.

Output: the five docs in `.claude/`, the targets and tasks filed, and a draft PR that the user merges. The
next stage is `/outputty:planning <id>`.

## Preconditions

Run both checks before step 1. Each one halts on failure.

1. **The managed block is installed and merged** - run `grep -q 'outputty:begin' CLAUDE.md`. A non-zero
   exit halts the run: tell the user to run `/outputty:init` and to merge that PR.
2. **GitHub is reachable** - run `gh auth status && git remote get-url origin`. A failure of either command
   halts the run: name what is missing.

Then read what `.claude/` already holds.

1. **All five docs** - stop. Nothing is left to reconstruct.
2. **Some of the five** - name the missing docs, then ask the user whether to reconstruct only those.
   ⚠ An existing doc stays untouched.
3. **None of the five** - continue to step 1.

## 1. Branch and draft PR

The first commit is empty: `gh pr create` refuses a branch that carries no commits.

```bash
git fetch origin --prune
git remote set-head origin --auto
BASE=$(git symbolic-ref --short refs/remotes/origin/HEAD) && echo "$BASE"
git checkout -b chore/bootstrap "$BASE"
git commit --allow-empty -m "chore: bootstrap outputty product memory"
git push -u origin chore/bootstrap
gh pr create --base "${BASE#origin/}" --draft \
  --title "chore: bootstrap outputty product memory" \
  --body "Reconstructs product memory from this repo's own history."
```

## 2. Pick scan depth (ask the user)

Use **AskUserQuestion** (multi-select) to set reconstruction depth. Default the two cheap boxes checked, and
run only what the user confirms.

- **Docs** *(cheap, default on)* - README, `docs/`, any existing ADR or CONTEXT file.
- **Docstrings** *(cheap, default on)* - module-level and class-level intent, skipping per-function noise.
- **Commit messages** *(moderate)* - messages, tags and merge commits, without the diffs.
- **Deep commit and diff scan** *(expensive, default off)* - commit diffs and reverts, for historical
  pivots.

## 3. Scan the checked sources

Read each checked source whole, and extract its intent: business goals, technical decisions, historical
pivots, terms. Read only what the user checked, and read commit diffs only when
the deep box was checked.

Size the sources first:

```bash
find README.md docs -name '*.md' 2>/dev/null | xargs wc -l | tail -1
git log --oneline | wc -l
```

Over 2000 doc lines or over 500 commits, dispatch the `scout` skill on `outputty:outputty-reviewer`. Send
the checked paths and all five questions in one run. Under both thresholds, read the sources yourself.

1. What does this project claim to do, and for whom?
2. Which technical decisions are stated, and where is each one stated?
3. Which approaches were tried and abandoned, and what killed each one?
4. Which terms does the repo use for its own concepts?
5. Which runnable snippets does the README or `docs/` already carry?

## 4. Draft every deliverable

Aggregate what you extracted into draft product memory. Read
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`, and author every file from its
skeleton. Write every doc, even when the scan found little: an empty doc with its header is a real answer.

Each deliverable is reconstructed from one part of the scan.

1. **`product.md`** - question 1 for the pitch and the wedge, question 4 for the terms.
2. **`architecture.md`** - question 2 for the decisions, the docstrings for each part's intent, and the
   behaviour that the repo already ships for the feature index.
3. **`examples.md`** - question 5, the snippets that the README and `docs/` already carry.
4. **The `tasks` MCP server** - `add_target` for every target that you can name in one sentence. Then
   `add_task` for the bugs, debt and task-shaped work that the scan surfaced.
5. **`roadmap.md`** - the targets that you just filed.
6. **`lessons.md`** - question 3, one entry per recovered pivot.

**Shipped work needs no target.** A target groups work that is still ahead. Record what already ships in
`architecture.md`'s feature index.

## 5. Grill the gaps

Run the `grill` engine **targeted**: only the gaps, ambiguities and contradictions that the scan surfaced.
Single intent: confirm and complete the docs.

## 6. Finish

Every check passes before you stop. A failed check sends you back to step 4 for that record set. Report any
check that you cannot pass.

1. **The five docs exist** - run `ls .claude/product.md .claude/roadmap.md .claude/architecture.md
   .claude/lessons.md .claude/examples.md`. Every path lists, and none errors.
2. **The targets are filed** - call the `tasks` MCP tool `roadmap` with `{ project }`. It returns a row per
   target, and you paste the rows.
3. **The tasks are filed** - call the `tasks` MCP tool `list_ready` with `{ project }`. It returns the filed
   work, and you paste the rows.
4. **The examples run** - run every fenced block in `.claude/examples.md`. Each block's real output sits in
   the doc.

Mark the PR ready, then tell the user to review and merge it. **The merge is theirs.**
