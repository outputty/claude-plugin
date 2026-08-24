---
name: audit
description: Use when the user asks what work is worth starting, or to audit a repo or branch for bugs, security, perf, tests and debt. It reads and reports; on the user's OK it files targets and tasks that sync to GitHub Issues. Use `qa` to gate a merge.
---

# audit - find the work worth doing

Input: a repo, plus the effort keyword and any variant named in the invocation.
Output: findings ranked by leverage, each carrying `file:line` evidence, and the targets and tasks that
the user chose to file.

Read the codebase as a senior advisor.

## Hard rules

1. **Findings are the only write, and every write waits on the user's OK.** They land in
   `.claude/roadmap.md` and the `tasks` MCP server, which are the two surfaces you write. The roadmap
   stays high-level, and the graph does the tracking. A task-shaped finding carries its reasoning on its
   `append_trail` thread.
2. **Only read-or-compute commands.**
   - **Run** typecheck, lint-check, a dependency audit, and any test command that writes nothing.
   - **Capture** `git status --porcelain` before and after every run. ⚠ A difference makes that command
     unrunnable for audit purposes. Record that, leave the tree as it stands, and move on.
   - **Skip** anything that installs, builds, commits or formats. Record a skipped check as
     `unverified: dependencies not installed`, and name the command.
   - **Report an uninstalled tree as** `unverified: dependencies not installed`, which is a gap in the
     evidence rather than a finding about the repo.
3. **Asked to implement?** Decline and point at the flow. `outputty` owns building, and you own finding
   and framing.

## Effort - `quick`, `standard` or `deep`

Set by a keyword anywhere in the invocation, and `standard` by default.

1. **`quick`** - hotspots only, under correctness, security and tests. Sweep directly, at most one
   reviewer pass. Report the top ~6 findings, HIGH-confidence only.
2. **`standard`** - hotspot-weighted over the key packages, all nine categories. Up to 4 concurrent
   reviewer passes. Report the full list.
3. **`deep`** - the whole repo, every package, all nine categories. Up to 8 passes, one per category.
   Report the full list, plus LOW-confidence investigate items.

Whatever the level, say what you did not audit. Even `deep` scopes passes to packages on a large monorepo,
not to the root.

## Workflow

1. **Recon - what is settled, and where the churn is.**
   - **Product memory** whole, then `roadmap` and `list_tasks` `{ project }`. A finding that
     re-surfaces a settled decision, an open target, or a tracked task is noise.
   - **README, root configs and CI**, for the build, test, lint and typecheck commands. Every finding
     needs a verification story.
   - **`git log --oneline -30`**, for active work.
   - **Hotspot rank**, by one command, so two audits of one repo cover the same files:

     ```bash
     git log --format= --name-only --since='12 months ago' | grep . | sort | uniq -c | sort -rn | head -40
     ```

   A hotspot is a file high in that count and on a critical path. A critical path is money, auth, data
   mutation, or the feature that the repo exists for. Hotspot rank sets `quick` coverage, and weights
   `standard`.
2. **Audit - fan out by category.** Read [`references/audit-playbook.md`](references/audit-playbook.md)
   for the nine categories and the finding format. Dispatch read-only passes on
   `outputty:outputty-reviewer`, one per category or cluster, scaled to the effort level. Each prompt
   names the `audit` skill to load, and carries:
   - **Paths**, absolute and already expanded: the playbook, and the `code-rules` path that the playbook
     names. A dispatched prompt is plain text, so expand `${CLAUDE_PLUGIN_ROOT}` before you send it.
   - **Sections**, the exact playbook sections for that pass, always including "Finding format".
   - **Scope**, the recon result, plus any settled tradeoffs from product memory.
   - **Limits**, findings only: no fixes, no file dumps, no dispatch of its own.
3. **Vet - open every cited location yourself.** A dispatched pass over-reports. Kill three classes:
   by-design, mis-attributed (right finding, wrong line), and duplicate. A finding needs `file:line`
   evidence that you confirmed. Record rejections on the filed task's `append_trail` thread, so the next
   audit does not re-raise them.
4. **Present - leverage-ranked, direction separate.** One ordered list, ranked by leverage. The
   playbook's prioritization rubric gives the formula and the tiebreakers. Present direction findings
   after that list, as its own section. Give 2-4 grounded suggestions at most, each citing repo evidence.
   Surface dependency ordering ("characterization tests land before the refactor"). Then ask which to act
   on.
5. **Route into the flow.** Per finding, on the user's selection:
   - **Build one now** → hand it to `outputty` as the SPEC intent.
   - **Track a target-level finding**, meaning one nameable in a sentence → `add_target`
     `{ project, id: <slug>-<stamp>, title, brief }`. The brief runs problem → solution → desired
     e2e shape, and ends with a one-line `file:line` pointer. Write that same paragraph into
     `.claude/roadmap.md`. Set its `deps`, and let the graph derive the ordering. Direction findings
     land here too.
   - **Track a bug-shaped or debt-shaped finding** → `add_task`, with an evidence pointer and the
     `target` it serves.
   - **Drop the rest** → transient, and re-found next audit.

## Variants

- **bare** → the full workflow above.
- **`quick` or `deep`** (anywhere) → the effort dial. Composes: `quick security`.
- **a focus category** (`security`, `perf`, `tests`, …) → recon, then audit only that category.
- **`branch`** → audit only the current branch's diff, plus its direct importers. Resolve the base first:

  ```bash
  git fetch origin
  BASE_REF=$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD || echo origin/main)
  git diff --name-only $(git merge-base "$BASE_REF" HEAD)..HEAD
  ```

  Tag each finding `introduced` (by this branch) or `pre-existing` (in touched files).
  ⚠ A failed `git fetch` leaves the base stale. A stale base makes both tags unreliable, so report the
  failure instead of tagging. Surface what the branch builds on, without blaming it for legacy debt. On
  the default branch, or at 0 commits ahead, say so and offer a full audit.
- **`next` or `roadmap`** → the direction category only, deeper: 4-6 grounded suggestions. Selected ones
  become targets and, if chosen, a design-first or spike-first `outputty` intent.
- **`reconcile`** → re-run against current HEAD. Refresh `roadmap.md` only where the why moved: a target
  whose premise a shipped change deleted, or whose reasoning is now false. A finding fixed in passing is
  dropped, and new findings surface. Report what changed.
