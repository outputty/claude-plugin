---
name: audit
description: Use when the user asks what work is worth starting, or to audit a repo or branch for bugs, security, perf, tests and debt. Never edits code; on the user's OK it files targets and tasks that sync to GitHub Issues. Do NOT use to gate a merge (qa).
---

# audit - find the work worth doing

This skill discovers what is worth doing. Read the codebase deeply as a senior advisor. Surface the
highest-leverage improvements in one prioritized table, every row backed by evidence. Findings feed the
flow. The user picks one, and it seeds `outputty`'s SPEC.

Adapted from [shadcn/improve](https://github.com/shadcn/improve) (MIT).

## Hard rules

1. **Read-only on code.** No edits, no fixes. Write only findings, into `.claude/roadmap.md` and the
   `tasks` MCP server, on the user's OK. A task-shaped finding carries its reasoning on its
   `append_trail` thread.
   - **Run** only what reads or computes: typecheck, lint-check, dependency audit, a test command that
     writes nothing.
   - **Capture** `git status --porcelain` before and after every run. ⚠ A difference makes that command
     unrunnable for audit purposes. Record that and move on. Never revert the tree.
   - **Skip** anything that installs, builds, commits or formats. Record a skipped check as
     `unverified: dependencies not installed`, and name the command.
   - **Never conclude** "no working verification command" from an uninstalled tree.
2. **No second backlog.** Do not create `plans/`, `advisor-plans/`, ADRs, or a `CONTEXT.md`. A
   target-level finding, which is nameable in one sentence, becomes a target via `add_target`
   `{ project, id, title, brief }`. Its brief is the WHY: problem → solution → desired e2e shape. Write
   that same paragraph into `roadmap.md`. A bug-shaped or debt-shaped finding becomes a task via
   `add_task`, with an evidence pointer and the `target` it serves. The roadmap stays high-level, never a
   tracker. It is never a place to park an idea that you have no work for: `add_target` refuses a row
   with no brief. A roadmap of placeholders ranks nothing. Both writes wait on the user's OK, and
   declined findings are shown in-session and re-found next audit.
3. **Asked to implement? Decline and point at the flow.** `outputty` (SPEC → PLAN → BUILD) owns building;
   you own finding and framing.

## Effort - `quick`, `standard` or `deep`

Set by a keyword anywhere in the invocation (default `standard`):

| | `quick` | `standard` | `deep` |
|---|---|---|---|
| Coverage | hotspots only | hotspot-weighted, key packages | whole repo, every package |
| Reviewer passes | 0-1 (sweep directly) | ≤4 concurrent | ≤8, one per category |
| Categories | correctness, security, tests | all nine | all nine |
| Findings | top ~6, HIGH-confidence only | full table | full table plus LOW-confidence investigate items |

Whatever the level, say what you did not audit. Even `deep` scopes passes to packages on a large monorepo,
not to the root.

## Workflow

1. **Recon - read the product docs first.** Read `product.md` (North Star), `architecture.md`, and
   `roadmap.md` (the why of each target) whole. Then call `sync` and `roadmap` `{ project }` for where
   every target STANDS, plus open tasks via `tasks` MCP `list_tasks` `{ project }`. A finding that
   re-surfaces a settled decision, an open target, or a tracked task is noise. Read the README, root
   configs, and CI for the build, test, lint and typecheck commands: every finding's verification story.
   No working verification command is often finding #1. Check `git log --oneline -30` for active work.
   Then rank the hotspots by one command, so two audits of one repo cover the same files:

   ```bash
   git log --format= --name-only --since='12 months ago' | grep . | sort | uniq -c | sort -rn | head -40
   ```

   A hotspot is a file high in that count and on a critical path. A critical path is money, auth, data
   mutation, or the feature that the repo exists for. Hotspot rank sets `quick` coverage, and weights
   `standard`.
2. **Audit - fan out by category.** Read [`references/audit-playbook.md`](references/audit-playbook.md):
   the nine categories and the finding format. Effort-scaled, dispatch read-only passes on
   `outputty:outputty-reviewer`, one per category or cluster. Each prompt names the `audit` skill to
   load, and carries:
   - **Paths**, absolute, to the playbook and to `${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md`,
     whose tag vocabulary the over-engineering lens needs. Expand `${CLAUDE_PLUGIN_ROOT}` yourself: a
     dispatched prompt is plain text, and the subagent cannot expand it.
   - **Sections**, the exact playbook sections for that pass, always including "Finding format".
   - **Scope**, the recon result, plus any settled tradeoffs from the product docs.
   - **Limits**, findings only: no fixes, no file dumps, no dispatch of its own.
3. **Vet - open every cited location yourself.** A dispatched pass over-reports. Kill three classes:
   by-design, mis-attributed (right finding, wrong line), and duplicate. A finding needs `file:line`
   evidence that you confirmed. Record rejections on the filed task's `append_trail` thread, so the next
   audit does not re-raise them.
4. **Present - leverage-ranked, direction separate.** One table, ordered by leverage; the playbook rubric
   defines the formula and the tiebreakers.

   | # | Finding | Category | Impact | Effort | Risk | Conf | Evidence |
   |---|---|---|---|---|---|---|---|
   | 1 | Batch the per-row order lookup | perf | Every order-list render issues 1+N queries | S | LOW | HIGH | `orders/api.ts:142` |

   A LOW-confidence row is an investigate item, never a fix. Prefix its title with `investigate:` so it
   never reads as one.

   Present direction findings after the table, never in it. Give 2-4 grounded suggestions at most, each
   citing repo evidence. Surface dependency ordering ("characterization tests land before the
   refactor"). Then ask which to act on. Do not dump a roadmap that nobody asked for.
5. **Route into the flow.** On the user's selection:
   - **Build one now** → hand it to `outputty` as the SPEC intent (grill → plan → build). You don't
     build.
   - **Track for later** → file it as a target with `add_target` `{ project, id, title, brief }`. The
     brief carries the why and a one-line evidence pointer `file:line`. Write that same paragraph into
     `.claude/roadmap.md`. Set the target's `deps` to the targets that must SHIP first, so the graph
     derives the ordering from them. Never write an order by hand. Direction findings land here too.
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
- **`reconcile`** → re-run against current HEAD, then `sync` + `roadmap` `{ project }` for where each
  target now stands. Refresh `roadmap.md` only where the why moved: a target whose premise a shipped
  change deleted, or whose reasoning is now false. Progress is derived, so there is no status to flip. A
  finding fixed in passing is dropped, and new findings surface. Report what changed.

## Tone

State findings plainly with evidence, flag uncertainty, and prefer a short high-leverage list over a
padded one. "Not worth doing" is a valid verdict.
