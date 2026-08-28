---
name: tracker
description: The exact commands this repo's tracker uses - tickets and their dependencies, claim and release, the board's Status moves, stacked PRs. Use whenever a task touches a ticket, the board, or a stacked PR, so nothing is guessed. This copy implements GitHub Issues with gh; a repo on another tracker rewrites the commands under the same headings.
---

# tracker - the commands, verbatim

This file is the repo's own. `/plan`, `/tickets` and `/build` never name a tracker; they say "the `tracker` skill" and follow whatever this file holds.

## The contract

Every implementation carries these headings, each with runnable commands:

1. **Tickets** - create with dependencies; add and remove a dependency; list open blockers; claim and release; send back to planning; the labels or states the flow uses.
2. **Board** - add a ticket; find its item; move it between Todo, In Progress and Done.
3. **Stacked PRs** - start a stack from the current branch; add a layer; publish as drafts; set a body; land.
4. **One command per call** - the shell discipline for a worktree.

Below is the GitHub implementation. Board ids (project number, project id, Status field id, option ids) live in `CLAUDE.md` under **This repo**; read them there, never guess one.

## Tickets

Create:

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready --blocked-by <n>,<m>
```

Dependencies:

- `--blocked-by` and `--blocking` set them (50 per issue).
- On an existing ticket: `gh issue edit <n> --add-blocked-by <m>` or `--remove-blocked-by <m>`.
- Open blockers: `gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'`.
- A ticket with any open blocker is not ready, whatever its label.

Claim and release:

- Claim: `gh issue edit <n> --add-assignee @me`.
- Release: `gh issue edit <n> --remove-assignee @me`.

Back to planning:

- `gh issue comment <n> --body "<the question>"`
- `gh issue edit <n> --add-label needs-planning --remove-label ready --remove-assignee @me`
- `/plan <n>` reverses it: `gh issue edit <n> --remove-label needs-planning --add-label ready`.

Labels, created once by `init`:

- `gh label create ready --color 0e8a16 --force`
- `gh label create priority:high --color b60205 --force`
- `gh label create needs-planning --color d93f0b --force`

Buildable: `ready`, no assignee, every blocker closed. `/tickets` orders them `priority:high` first, then oldest.

## Board

Add a ticket (idempotent):

```bash
gh project item-add <board#> --owner <org> --url <issue url>
```

Find the item id for a ticket number:

```bash
gh project item-list <board#> --owner <org> --limit 200 --format json --jq '.items[] | select(.content.repository == "<owner>/<repo>" and .content.number == <n>) | .id'
```

Move it, one field per call, the option id from `CLAUDE.md`:

```bash
gh project item-edit --id <item id> --project-id <project id> --field-id <status field id> --single-select-option-id <option id>
```

Built-in automations move an item to `Done` when its ticket closes or its PR merges. Nothing built in moves it on PR open; the build sets `In Progress` itself.

Ids for a new repo:

```bash
gh project list --owner <org> --format json --jq '.projects[] | [.number, .id, .title] | @tsv'
```

```bash
gh project field-list <board#> --owner <org> --format json --jq '.fields[] | select(.name == "Status") | [.id, (.options[] | [.id, .name] | join("="))] | join(" ")'
```

## Stacked PRs

`gh stack init <branch>` adopts an existing branch as the bottom of a new stack. With a name that does not exist yet it creates one from the default branch, which drops the commits you just made. `gh stack add` must run on the topmost branch of a stack.

A build worktree already sits on its own branch, so the first layer adopts it:

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

Publish, as drafts, without an editor:

```bash
gh stack submit --auto
```

Set the body from the template:

```bash
gh pr edit <pr#> --title "<title>" --body-file tmp/pr.md
```

Landing is the human's. `gh stack merge <pr#> --yes` merges that PR and every layer below it; the layers above rebase and retarget on their own. `gh stack view` prints the stack; `gh stack rebase` cascades a rebase after a lower layer changed.

## One command per call

In a worktree, run one plain command per Bash call: no `&&`, no `$(...)`, no `${...}`. Read what it printed and type that value into the next call.
