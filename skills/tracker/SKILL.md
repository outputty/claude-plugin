---
name: tracker
description: Gives the exact tracker commands - list and read tickets, create them with dependencies, claim and release, the board's Status moves, a ticket's PR, and stacked PRs on opt-in. Use whenever a task touches a ticket, the board, or a PR. Implements GitHub Issues with gh.
---

# tracker

Board ids (project number, project id, Status field id, option ids) live in the repo's `CLAUDE.md` under **This repo**; read them there, never guess one. Requires `gh` 2.94 or later, and `gh auth refresh -s project` for the Board commands. Stacked PRs also need `gh extension install github/gh-stack`, with stacked PRs enabled on the repo.

## Writing tickets and PRs

### Do

- Follow `.github/ISSUE_TEMPLATE/task.md` for a ticket body and `.github/PULL_REQUEST_TEMPLATE.md` for a PR body.
- Write every body one paragraph per line.
- Name `Closes #<n>` in a ticket's PR (in a stack, the top PR only).

### Don't

- Don't put a closing word next to `#<n>` in any other PR body.

## Tickets

### Do

- List open tickets: `gh issue list --state open --json number,title,labels,assignees,createdAt --jq 'sort_by(.createdAt) | reverse'`
- Read one with its comments: `gh issue view <n> --json title,body,labels,comments`
- Create: `gh issue create --title "<title>" --body-file tmp/issue.md --label ready --blocked-by <n>,<m>`
- Create a ticket the user opted into a stack: `gh issue create --title "<title>" --body-file tmp/issue.md --label ready,stack --blocked-by <n>,<m>`
- Set dependencies with `--blocked-by` and `--blocking` (50 per issue), or on an existing ticket `gh issue edit <n> --add-blocked-by <m>` and `--remove-blocked-by <m>`.
- List open blockers: `gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'`
- Claim: `gh issue edit <n> --add-assignee @me`. Release: `gh issue edit <n> --remove-assignee @me`.
- Send a ticket back to planning: `gh issue comment <n> --body "<the question>"`, then `gh issue edit <n> --add-label needs-planning --remove-label ready --remove-assignee @me`.
- Reverse it with `gh issue edit <n> --remove-label needs-planning --add-label ready`, which `/outputty:plan <n>` does.
- Create the labels once, in init: `gh label create ready --color 0e8a16 --force`, `gh label create priority:high --color b60205 --force`, `gh label create priority:low --color c2e0c6 --force`, `gh label create needs-planning --color d93f0b --force`, `gh label create spike --color fbca04 --force`, `gh label create stack --color 5319e7 --force`.
- Set `stack` on an existing ticket only on the user's say: `gh issue edit <n> --add-label stack`, or `--remove-label stack`.

### Don't

- Don't call a ticket with any open blocker buildable, whatever its label.
- Don't set `stack` yourself.

## Board

### Do

- Add a ticket, idempotent: `gh project item-add <board#> --owner <org> --url <issue url>`
- Find the item id: `gh project item-list <board#> --owner <org> --limit 500 --format json --jq '.items[] | select(.content.repository == "<owner>/<repo>" and .content.number == <n>) | .id'`
- Check `.items | length` against the limit when the result is empty.
- Move it, one field per call, the option id from `CLAUDE.md`: `gh project item-edit --id <item id> --project-id <project id> --field-id <status field id> --single-select-option-id <option id>`
- Read ids for a new repo: `gh project list --owner <org> --format json --jq '.projects[] | [.number, .id, .title] | @tsv'`, then `gh project field-list <board#> --owner <org> --format json --jq '.fields[] | select(.name == "Status") | [.id, (.options[] | [.id, .name] | join("="))] | join(" ")'`

### Don't

- Don't move an item to `Done`: closing the ticket or merging its PR does.
- Don't expect a PR opening to move an item.

## PRs

### Do

- Commit a build on a branch of its own and push to the planning branch by name.
- Open the planning PR as a draft from the planning branch: `gh pr create --draft --title "docs(plan): <ticket title>" --body-file tmp/pr.md`
- Read a ticket's planning branch: `gh pr view <planning-pr#> --json headRefName --jq .headRefName`
- Start the build branch: `git fetch origin <planning-branch>`, then `git switch -c feature/<slug>-<ticket#> origin/<planning-branch>`
- Push after each layer: `git push origin HEAD:<planning-branch>`
- After the first push, set the title and body, then mark it ready: `gh pr edit <planning-pr#> --title "<type>(<scope>): <title>" --body-file tmp/pr.md`, then `gh pr ready <planning-pr#>`
- Merge on the user's go-ahead: `gh pr merge <pr#> --merge`
- List a ticket's PRs: `gh pr list --state all --search "#<n>" --json number,title,state,isDraft,mergeable`
- Open a PR outside a ticket: `gh pr create --title "<title>" --body-file tmp/pr.md`
- Close a PR and delete its branch: `gh pr close <pr#> --delete-branch`
- Start a prototype branch, local only, from a ticket's planning branch or an idea's `main`: `git fetch origin <planning-branch or main>`, then `git switch -c prototype/<name> origin/<planning-branch or main>`
- Record a ticket's prototype: `gh issue comment <n> --body "<the comment>"`, the comment being this text: [references/prototype-comment.txt](references/prototype-comment.txt)
- Read it, the latest such comment: `gh issue view <n> --json comments --jq '[.comments[].body | select(startswith("Prototype: "))] | last'`
- List the stubs the branch added, which prints nothing when none is left: `git diff origin/main...HEAD | grep '^+.*TODO: stub'`
- Start the build branch from the prototype: `git fetch origin <planning-branch>`, `git switch -c feature/<slug>-<ticket#> prototype/<name>`, then `git merge origin/<planning-branch>`

### Don't

- Don't check out the planning branch in a build.

## Stacked PRs

### Do

- Build this way only a ticket labelled `stack`: one PR per layer, stacked on its planning PR.
- Start the first layer from a prototype the same way the PRs section starts a build from one, on the `-l1` name, or else from the planning branch: `git fetch origin <planning-branch>`, then `git switch -c feature/<slug>-<ticket#>-l1 origin/<planning-branch>`
- Start each later layer from the layer below: `git switch -c feature/<slug>-<ticket#>-l<k>`
- Publish a layer as a PR ready for review, based on the branch below: `git push -u origin <layer-branch>`, then `gh pr create --base <branch-below> --title "<title>" --body-file tmp/pr.md`
- Link the stack: `gh stack link <planning-pr#> <l1-pr#>` for the first layer, `gh stack link <stack#> <lk-pr#>` for each later one.
- Mark the planning PR ready once the first layer is published: `gh pr ready <planning-pr#>`
- After a lower layer changes, for each branch above it, bottom to top: `git switch <layer-branch>`, `git rebase <branch-below>`, `git push --force-with-lease origin <layer-branch>`
- Merge on the user's go-ahead: `gh stack merge <top-pr#> --yes`, which merges that PR and every layer below it, the planning PR first.

### Don't

- Don't stack a ticket the user did not label `stack`.

## Glossary

- **Layer** - one step of a build, chosen so the program works after it.
- **Stub** - a line marked `TODO: stub - <what the build must design>`.
- **Prototype branch** - a local `prototype/<name>` branch a prototype session builds.
- **Planning PR** - the draft PR `/outputty:plan` opens with the plan record, which a build lands on.
- **Stack** - one PR per layer on the planning PR.
- **Buildable** - labelled `ready`, with no assignee and every blocker closed.
