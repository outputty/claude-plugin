---
name: github
description: The exact gh commands this loop uses - sub-issues and dependencies, the project board's Status moves, stacked PRs, and the needs-decision handoff. Use whenever a task touches GitHub issues, a project board, or a stacked PR, so nothing is guessed.
---

# github - the commands, verbatim

Board ids (project number, project id, Status field id, option ids) live in CLAUDE.md under **This
repo**. Read them there; never guess one.

## Issues

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready
```

```bash
gh issue create --title "<title>" --body-file tmp/unit.md --parent <parent#> --blocked-by <n>,<m>
```

- `--parent` links a sub-issue (100 per parent, 8 levels). `--blocked-by` and `--blocking` set
  dependencies (50 per issue). On an existing issue: `gh issue edit <n> --add-sub-issue <m>`,
  `--add-blocked-by <m>`, `--remove-blocked-by <m>`.
- Sub-issues of a parent, with state:
  `gh api repos/<owner>/<repo>/issues/<parent#>/sub_issues --jq '.[] | [.number, .state, .title] | @tsv'`
  (`gh issue view <parent#> --json subIssues` returns the same list as GraphQL nodes).
- Open blockers of an issue:
  `gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'`.
- Claim: `gh issue edit <n> --add-assignee @me`. Release: `--remove-assignee @me`.
- Stuck: `gh issue comment <n> --body "<the one ruling needed>"`, then
  `gh issue edit <n> --add-label needs-decision --remove-assignee @me`. The label `needs-decision`
  exists or is created once with `gh label create needs-decision --color d93f0b`.

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

Built-in automations move an item to `Done` when its issue closes or its PR merges. Nothing built in
moves it on PR open; the agent sets `In Progress` itself.

Ids for a new repo:

```bash
gh project list --owner <org> --format json --jq '.projects[] | [.number, .id, .title] | @tsv'
```

```bash
gh project field-list <board#> --owner <org> --format json --jq '.fields[] | select(.name == "Status") | [.id, (.options[] | [.id, .name] | join("="))] | join(" ")'
```

## Stacked PRs

`gh stack add` must run on the topmost branch of a stack; `gh stack init` starts one from the current
branch.

```bash
gh stack init feature/<parent-slug>-1
```

```bash
gh stack add feature/<parent-slug>-<n>
```

```bash
gh stack submit --auto
```

`--auto` pushes and opens each PR as a draft without an editor. Then set the body from the template:

```bash
gh pr edit <pr#> --title "<title>" --body-file tmp/pr.md
```

Landing is the human's: `gh stack merge <pr#> --yes` merges that PR and every layer below it; the
layers above rebase and retarget on their own. `gh stack view` prints the stack; `gh stack rebase`
cascades a rebase after a lower layer changed.

## One command per call

In a worktree-isolated shell, run one plain command per Bash call: no `&&`, no `$(...)`, no
`${...}`. Read what it printed and type that value into the next call.
