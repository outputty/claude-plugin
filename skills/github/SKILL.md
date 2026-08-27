---
name: github
description: The exact gh commands this loop uses - sub-issues and dependencies, the project board's Status moves, stacked PRs, and the needs-decision handoff. Use whenever a task touches GitHub issues, a project board, or a stacked PR, so nothing is guessed.
---

# github - the commands, verbatim

Board ids (project number, project id, Status field id, option ids) live in CLAUDE.md under **This repo**. Read them there; never guess one.

## Issues

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready
```

```bash
gh issue create --title "<title>" --body-file tmp/unit.md --parent <parent#> --blocked-by <n>,<m>
```

- `--parent` links a sub-issue (100 per parent, 8 levels). `--blocked-by` and `--blocking` set dependencies (50 per issue). On an existing issue: `gh issue edit <n> --add-sub-issue <m>`, `--add-blocked-by <m>`, `--remove-blocked-by <m>`.
- Sub-issues of a parent, with state: `gh api repos/<owner>/<repo>/issues/<parent#>/sub_issues --jq '.[] | [.number, .state, .title] | @tsv'` (`gh issue view <parent#> --json subIssues` returns the same list as GraphQL nodes).
- Open blockers of an issue: `gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'`.
- Claim: `gh issue edit <n> --add-assignee @me`. Release: `gh issue edit <n> --remove-assignee @me`.
- Stuck: `gh issue comment <n> --body "<the one ruling needed>"`, then `gh issue edit <n> --add-label needs-decision --remove-assignee @me`.
- Dead agent (In Progress, assigned, no open PR after 90 minutes): release it with the command above.
- Three labels exist before the first issue is filed; `init` creates them once: `gh label create ready --color 0e8a16 --force`, `gh label create needs-decision --color d93f0b --force`, `gh label create priority:high --color b60205 --force`.
- The next issue to build: `ready`, no assignee, every blocker closed, `priority:high` before the rest, oldest first. `gh issue list --label ready --label priority:high --search "no:assignee" --json number,createdAt`, then the same without the priority label.

## Before a dispatch

The build session's worktrees are cut from its `HEAD`, so a stale or dirty checkout hands every agent the wrong tree. Before each dispatch:

```bash
git fetch origin --prune
```

```bash
git merge --ff-only origin/<default branch>
```

```bash
git status --porcelain
```

A refused fast-forward or any `status` output holds the turn: report it, dispatch nothing.

## Board

Add an issue (idempotent):

```bash
gh project item-add <board#> --owner <org> --url <issue url>
```

Find the item id for an issue number:

```bash
gh project item-list <board#> --owner <org> --limit 200 --format json --jq '.items[] | select(.content.repository == "<owner>/<repo>" and .content.number == <n>) | .id'
```

Move it (one field per call; the option id comes from CLAUDE.md):

```bash
gh project item-edit --id <item id> --project-id <project id> --field-id <status field id> --single-select-option-id <option id>
```

Built-in automations move an item to `Done` when its issue closes or its PR merges. Nothing built in moves it on PR open; the agent sets `In Progress` itself.

Ids for a new repo:

```bash
gh project list --owner <org> --format json --jq '.projects[] | [.number, .id, .title] | @tsv'
```

```bash
gh project field-list <board#> --owner <org> --format json --jq '.fields[] | select(.name == "Status") | [.id, (.options[] | [.id, .name] | join("="))] | join(" ")'
```

## Stacked PRs

`gh stack init <branch>` adopts an existing branch as the bottom of a new stack; with a name that does not exist yet it creates one from the default branch, which drops the commits you just made. `gh stack add` must run on the topmost branch of a stack. A `fix-issue` worktree already sits on its own branch, so adopt that one:

```bash
git branch --show-current
```

```bash
gh stack init <the branch it printed>
```

To stack a second layer on an existing stack:

```bash
gh stack add feature/<slug>-<issue#>
```

```bash
gh stack submit --auto
```

`--auto` pushes and opens each PR as a draft without an editor. Then set the body from the template:

```bash
gh pr edit <pr#> --title "<title>" --body-file tmp/pr.md
```

Landing is the human's: `gh stack merge <pr#> --yes` merges that PR and every layer below it; the layers above rebase and retarget on their own. `gh stack view` prints the stack; `gh stack rebase` cascades a rebase after a lower layer changed.

## One command per call

In a worktree-isolated shell, run one plain command per Bash call: no `&&`, no `$(...)`, no `${...}`. Read what it printed and type that value into the next call.
