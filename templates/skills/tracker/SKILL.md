---
name: tracker
description: Gives the exact tracker commands - list and read tickets, create them with dependencies, claim and release, the board's Status moves, a ticket's PR, and stacked PRs on opt-in. Use whenever a task touches a ticket, the board, or a PR, so nothing is guessed. This copy implements GitHub Issues with gh; a person on another tracker rewrites the commands under the same headings.
---

# tracker - the commands, verbatim

## Contents

- The contract - the headings every implementation carries
- Writing tickets and PRs - the templates a body follows
- Tickets - list, read, create with blockers, claim, release
- Board - Status moves on the project board
- PRs - the planning PR, a build pushed onto it, ready, merge
- Stacked PRs - a `stack` ticket's layers: start, link, restack, merge

This file lives under `~/.claude/skills/tracker/` and is yours: one tracker per person, used in every repo. `/plan`, `/tickets` and `/build` never name a tracker; they say "the `tracker` skill" and follow whatever this file holds. Repo-specific ids (board, labels) live in the repo's `CLAUDE.md` under **This repo**.

Requires `gh` 2.94 or later (for `--blocked-by`), authenticated with `gh auth login`, plus `gh auth refresh -s project` for the Board commands. Stacked PRs alone also need `gh extension install github/gh-stack` with stacked PRs enabled on the repo.

## The contract

Every implementation carries these headings, each with runnable commands:

1. **Writing tickets and PRs** - the body shapes and the closing-keyword trap.
2. **Tickets** - list open tickets; read one; create with dependencies; add and remove a dependency; list open blockers; claim and release; send back to planning; the labels or states the flow uses.
3. **Board** - add a ticket; find its item; move it between Todo, In Progress and Done.
4. **PRs** - open the planning PR; push a build onto it; publish it ready for review; land; list a ticket's PRs; close one.
5. **Stacked PRs** - a ticket labelled `stack` only: start a layer on the planning PR; publish ready for review; link the stack; restack; land.

Below is the GitHub implementation. Board ids (project number, project id, Status field id, option ids) live in `CLAUDE.md` under **This repo**; read them there, never guess one.

## Writing tickets and PRs

- A ticket body follows `.github/ISSUE_TEMPLATE/task.md`, and a PR body follows `.github/PULL_REQUEST_TEMPLATE.md`.
- Write every body one paragraph per line; the renderer wraps it.
- A ticket's PR names `Closes #<n>`; in a stack, only the top PR does. GitHub also closes on a negated keyword, so no other PR body puts a closing word next to `#<n>`.

## Tickets

List open tickets, with labels, assignees and age:

```bash
gh issue list --state open --json number,title,labels,assignees,createdAt --jq 'sort_by(.createdAt) | reverse'
```

Read one, body and labels, with its comments:

```bash
gh issue view <n> --json title,body,labels,comments
```

Create:

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready --blocked-by <n>,<m>
```

Create a ticket the user opted into a stack:

```bash
gh issue create --title "<title>" --body-file tmp/issue.md --label ready,stack --blocked-by <n>,<m>
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
- `gh label create priority:low --color c2e0c6 --force`
- `gh label create needs-planning --color d93f0b --force`
- `gh label create spike --color fbca04 --force`
- `gh label create stack --color 5319e7 --force`

A ticket labelled `stack` builds as one stacked PR per layer; only the user sets it, at planning. On an existing ticket: `gh issue edit <n> --add-label stack` or `--remove-label stack`.

Buildable: `ready`, no assignee, every blocker closed.

## Board

Add a ticket (idempotent):

```bash
gh project item-add <board#> --owner <org> --url <issue url>
```

Find the item id for a ticket number:

```bash
gh project item-list <board#> --owner <org> --limit 500 --format json --jq '.items[] | select(.content.repository == "<owner>/<repo>" and .content.number == <n>) | .id'
```

`--limit` truncates without warning: when the result is empty, check `.items | length` against the limit before concluding the item is missing.

Move it, one field per call, the option id from `CLAUDE.md`:

```bash
gh project item-edit --id <item id> --project-id <project id> --field-id <status field id> --single-select-option-id <option id>
```

Built-in automations move an item to `Done` when its ticket closes or its PR merges. Nothing built in moves it on PR open.

Ids for a new repo:

```bash
gh project list --owner <org> --format json --jq '.projects[] | [.number, .id, .title] | @tsv'
```

```bash
gh project field-list <board#> --owner <org> --format json --jq '.fields[] | select(.name == "Status") | [.id, (.options[] | [.id, .name] | join("="))] | join(" ")'
```

## PRs

Every build lands on its ticket's planning PR: the draft that `/plan` opens with the plan record. The build never checks out the planning branch, because the planning worktree may still hold it; it commits on a branch of its own and pushes to the planning branch by name.

Open the planning PR, as a draft, from the planning branch:

```bash
gh pr create --draft --title "docs(plan): <ticket title>" --body-file tmp/pr.md
```

Read a ticket's planning branch from its planning PR:

```bash
gh pr view <planning-pr#> --json headRefName --jq .headRefName
```

Start the build branch from the planning branch:

```bash
git fetch origin <planning-branch>
```

```bash
git switch -c feature/<slug>-<ticket#> origin/<planning-branch>
```

Push the build onto the planning PR, after each layer:

```bash
git push origin HEAD:<planning-branch>
```

After the first push, give the PR the ticket's title and body, then mark it ready for review:

```bash
gh pr edit <planning-pr#> --title "<type>(<scope>): <title>" --body-file tmp/pr.md
```

```bash
gh pr ready <planning-pr#>
```

Land only on the user's typed "merge":

```bash
gh pr merge <pr#> --merge
```

A ticket's PRs and their state:

```bash
gh pr list --state all --search "#<n>" --json number,title,state,isDraft,mergeable
```

A PR outside a ticket:

```bash
gh pr create --title "<title>" --body-file tmp/pr.md
```

Close a PR and delete its branch:

```bash
gh pr close <pr#> --delete-branch
```

## Stacked PRs

Only a ticket labelled `stack` builds this way: one PR per layer, stacked on its planning PR. Open the planning PR and read its branch per PRs.

Start the first layer from the planning branch:

```bash
git fetch origin <planning-branch>
```

```bash
git switch -c feature/<slug>-<ticket#>-l1 origin/<planning-branch>
```

Start each later layer from the layer below it:

```bash
git switch -c feature/<slug>-<ticket#>-l<k>
```

Publish a layer as a PR ready for review, based on the branch below it:

```bash
git push -u origin <layer-branch>
```

```bash
gh pr create --base <branch-below> --title "<title>" --body-file tmp/pr.md
```

Link the stack on GitHub. The first layer creates the stack from the planning PR; every later PR appends to it:

```bash
gh stack link <planning-pr#> <l1-pr#>
```

```bash
gh stack link <stack#> <lk-pr#>
```

Mark the planning PR ready once the first layer is published:

```bash
gh pr ready <planning-pr#>
```

After a lower layer changes, run these for each branch above it, bottom to top:

```bash
git switch <layer-branch>
```

```bash
git rebase <branch-below>
```

```bash
git push --force-with-lease origin <layer-branch>
```

Land only on the user's typed "merge": `gh stack merge <top-pr#> --yes` merges that PR and every layer below it, the planning PR first.
