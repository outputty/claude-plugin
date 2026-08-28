---
name: github
description: The exact gh commands this flow uses - tickets and their dependencies, the project board's Status moves, and stacked PRs. Use whenever a task touches GitHub issues, a project board, or a stacked PR, so nothing is guessed.
---

# github - the commands, verbatim

Board ids (project number, project id, Status field id, option ids) live in CLAUDE.md under **This repo**. Read them there; never guess one.

## Issues

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready
```

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready --blocked-by <n>,<m>
```

- `--blocked-by` and `--blocking` set dependencies (50 per issue). On an existing issue: `gh issue edit <n> --add-blocked-by <m>`, `--remove-blocked-by <m>`.
- Open blockers of a ticket: `gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'`. A ticket with any open blocker is not ready, whatever its label.
- Claim: `gh issue edit <n> --add-assignee @me`. Release: `gh issue edit <n> --remove-assignee @me`.
- Three labels exist before the first ticket is filed; `init` creates them once: `gh label create ready --color 0e8a16 --force`, `gh label create priority:high --color b60205 --force`, `gh label create needs-planning --color d93f0b --force`.
- Buildable: `ready`, no assignee, every blocker closed. `/tickets` orders them `priority:high` first, then oldest.
- Back to planning: `gh issue comment <n> --body "<the question>"`, then `gh issue edit <n> --add-label needs-planning --remove-label ready --remove-assignee @me`. `/plan <n>` reverses it with `--remove-label needs-planning --add-label ready`.

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

`gh stack init <branch>` adopts an existing branch as the bottom of a new stack; with a name that does not exist yet it creates one from the default branch, which drops the commits you just made. `gh stack add` must run on the topmost branch of a stack. A `build` worktree already sits on its own branch, so the first layer adopts that one:

```bash
git branch --show-current
```

```bash
gh stack init <the branch it printed>
```

Each later layer:

```bash
gh stack add feature/<slug>-<ticket#>-l<k>
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

In a worktree, run one plain command per Bash call: no `&&`, no `$(...)`, no `${...}`. Read what it printed and type that value into the next call.
