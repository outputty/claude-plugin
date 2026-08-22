---
name: bootstrap
description: Reconstructs outputty's product memory for a brownfield repo with no .claude/product.md yet. Runs once, after init. Not a codebase survey (audit), not a README rewrite (documentation).
---

# bootstrap - brownfield reconstruction

One job: reconstruct all five product-memory docs, and the targets and tasks in the `tasks` MCP server.
The repo's own history is the source. Confirm the result with a targeted grilling. No planning, no
building. This skill writes the prose Markdown docs directly.

## Preconditions

Run all three checks before step 1. Each one halts on failure.

| Check | Run | Halt when |
| --- | --- | --- |
| the block is installed and merged | `grep -q 'outputty:begin' CLAUDE.md` | It exits non-zero. Tell the user to run `/outputty:init` and to merge that PR, then stop. |
| the `tasks` tools are present | Look for `mcp__tasks__*` in your own tool list | They are missing. Report in the block's shape (The `tasks` server, or nothing), then stop. |
| GitHub is reachable | `gh auth status && git remote get-url origin` | Either command fails. Name what is missing, then stop. |

⚠ **Task tools arrive with init's `.mcp.json`.** A checkout cut before that PR merged carries no
`add_target` and no `add_task`, and step 4 cannot finish without them.

### When product memory already exists

| What `.claude/` holds | Do this |
| --- | --- |
| all five docs | Stop. Planning takes over from here: `/outputty:planning <id>`. |
| some of the five | Name the missing docs, then ask the user whether to reconstruct only those. |
| none of the five | Continue to step 1. |

**Never overwrite**: a doc that is already there stays untouched, and a partial run fills only the gaps.

## 1. Branch and draft PR

Same GitHub discipline as any work. The tree is clean here, so the first commit is empty on purpose: `gh
pr create` refuses a branch that carries no commits.

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

Use **AskUserQuestion** (multi-select) to set reconstruction depth. Default the two cheap boxes checked; run
only what they confirm:

- **Docs** *(cheap, default on)* - README, `docs/`, any existing ADR or CONTEXT file.
- **Docstrings** *(cheap, default on)* - module-level and class-level intent (skip per-function noise).
- **Commit messages** *(moderate)* - messages, tags, merge commits. History without reading diffs.
- **Deep commit and diff scan** *(EXPENSIVE, default off)* - also reads commit **diffs and reverts** for
  historical pivots. Gate behind an explicit check.

## 3. Scan the checked sources

Read each checked source whole and extract its intent: business goals, technical decisions, historical
pivots, terms. Never blind-scan the tree; read only what the user checked. Read commit **diffs** only when
the deep box was checked, and commit messages alone otherwise.

Dispatch `scout` once, with every question in it. Size the sources first:

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

Aggregate what you extracted into draft product memory. The full rules and every skeleton are in
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/product-template.md`. Read it, and author each file from
its template, not freehand. Write every doc, even when the scan found little: an empty doc with its header
is a real answer.

| Doc | Holds | What bootstrap writes |
| --- | --- | --- |
| `product.md` | North Star + Language | the elevator pitch, one example per strong side, and the wedge, then the terms that the repo already uses, in their own `Language` section |
| `roadmap.md` | why each target is worth building (never status - the graph derives it) | one paragraph per target, and a link to its issue |
| `architecture.md` | target program + machinery | the target program with its `Input:` and `Output:` JSON, the machinery, the seams, and a feature-index row per feature, knob, limitation and pattern that the repo ships |
| the `tasks` MCP server | the task graph, synced to GitHub Issues | every target that you can name in one sentence, filed with `add_target { project, id, title, brief }`, which refuses a row with no brief. Then the known bugs, debt and task-shaped work that the scan surfaced, filed with `add_task { project, id, title, brief, target }`, each pointing at the target that it serves |
| `lessons.md` | chronology + abandoned approaches | the pivots that the history scan recovered, one bold-title-led entry each, with a `Files:` line and a version where the project versions its releases |
| `examples.md` | the canonical worked examples | the README's own snippets, lifted and verified by running them |

**Not shipped yet**: mark the behaviour expected, never shipped.

**Shipped work needs no target.** A target groups work that is still to come; filing one per finished
capability produces a roadmap of closed rows that ranks nothing. Record what already ships in
`architecture.md`'s feature index, and give `roadmap.md` only the targets with work ahead of them.

## 5. Grill the gaps

Run the `grill` engine **targeted**: only the gaps, ambiguities, and contradictions that the scan surfaced.
Single intent: confirm and complete the docs. Record each answer before asking the next question.

## 6. Finish

Run the done-list. Every row has to pass before you stop.

| Check | Run | Passes when |
| --- | --- | --- |
| the five docs exist | `ls .claude/product.md .claude/roadmap.md .claude/architecture.md .claude/lessons.md .claude/examples.md` | Every path lists, and none errors. |
| the targets are filed | call the `tasks` MCP tool `roadmap` with `{ project }` | It returns a row per target, and you paste the rows. |
| the tasks are filed | call the `tasks` MCP tool `list_ready` with `{ project }` | It returns the filed work, and you paste the rows. |
| the examples run | run every fenced block in `.claude/examples.md` | Each block's real output sits in the doc. |

A row that fails sends you back to step 4 for that record set. Report any row that you cannot pass.

Then mark the PR ready, and tell the user to review and merge it. **Never merge it yourself**: bootstrap
never merges its own reconstruction. Planning takes over from here: `/outputty:planning <id>`.
