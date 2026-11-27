---
name: tracker
description: Use before filing, reading or closing a ticket, moving a board item, or opening, stacking or merging a PR, and before any gh issue, gh pr or gh project command. It holds the exact commands.
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
- Reverse it with `gh issue edit <n> --remove-label needs-planning --add-label ready`, which `/plan <n>` does.
- Create the labels once, in init: `gh label create ready --color 0e8a16 --force`, `gh label create priority:high --color b60205 --force`, `gh label create priority:low --color c2e0c6 --force`, `gh label create needs-planning --color d93f0b --force`, `gh label create spike --color fbca04 --force`, `gh label create stack --color 5319e7 --force`.
- Set `stack` on an existing ticket only on the user's say: `gh issue edit <n> --add-label stack`, or `--remove-label stack`.

### Don't

- Don't call a ticket buildable while an open blocker has no open PR, whatever its label.
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

- Read a ticket's base branch, `main` or a prototype branch: `gh issue view <n> --json body --jq '.body | capture("- Base: `(?<base>[^`]+)`").base'`
- Set it: write the body with `gh issue view <n> --json body --jq .body > tmp/issue.md`, change its `- Base:` line, then `gh issue edit <n> --body-file tmp/issue.md`
- Start the build branch from the base: `git fetch origin <base>`, then `git switch -c feature/<slug>-<ticket#> origin/<base>`
- Push each layer: `git push -u origin HEAD`
- After the first push, open the ticket's PR ready for review: `gh pr create --title "<type>(<scope>): <title>" --body-file tmp/pr.md`
- With a feature branch named in the prompt, open every PR against it instead of `main`: `gh pr create --base <feature branch> --title "<title>" --body-file tmp/pr.md`.
- Create a feature branch from `main`: `git push origin origin/main:refs/heads/feature/<slug>`. Open its PR into `main` for the user, and never merge it: `gh pr create --base main --head feature/<slug> --title "<title>" --body-file tmp/pr.md`.
- Start a build branch from an open blocker's PR: `gh pr view <pr#> --json headRefName --jq .headRefName`, `git fetch origin <branch>`, `git switch -c feature/<slug>-<ticket#> origin/<branch>`, then open the PR with `gh pr create --base main`, and never `gh stack link`.
- Merge a PR into its feature branch when a go-ahead is in force or the user said to merge: `gh pr merge <pr#> --merge`; never into `main`; otherwise leave it for the user.
- List a ticket's PRs: `gh pr list --state all --search "#<n>" --json number,title,state,isDraft,mergeable`
- Close a PR and delete its branch: `gh pr close <pr#> --delete-branch`
- Start a prototype branch from `main`: `git fetch origin main`, then `git switch -c prototype/<name> origin/main`
- Publish it: `git push -u origin prototype/<name>`
- List the stubs the branch added, which prints nothing when none is left: `git diff origin/main...HEAD | grep '^+.*TODO: stub'`

## Stacked PRs

### Do

- Build this way only a ticket labelled `stack`: one PR per layer.
- Start the first layer from the base: `git fetch origin <base>`, then `git switch -c feature/<slug>-<ticket#>-l1 origin/<base>`
- Start each later layer from the layer below: `git switch -c feature/<slug>-<ticket#>-l<k>`
- Publish a layer as a PR ready for review, based on the branch below, `main` for the first: `git push -u origin <layer-branch>`, then `gh pr create --base <branch-below> --title "<title>" --body-file tmp/pr.md`
- Link the stack: `gh stack link <l1-pr#> <l2-pr#>` for the second layer, `gh stack link <stack#> <lk-pr#>` for each later one.
- After a lower layer changes, for each branch above it, bottom to top: `git switch <layer-branch>`, `git rebase <branch-below>`, `git push --force-with-lease origin <layer-branch>`
- Merge a stack into its feature branch when a go-ahead is in force or the user said to merge: `gh stack merge <top-pr#> --yes`, which merges that PR and every layer below it; otherwise leave it for the user.

### Don't

- Don't stack a ticket the user did not label `stack`.

## Glossary

- **Layer** - one step of a build, chosen so the program works after it.
- **Stub** - a line marked `TODO: stub - <what the build must design>`.
- **Prototype branch** - a `prototype/<name>` branch on GitHub that a prototype session builds.
- **Base** - the ticket's line naming the branch the build starts from: `main`, or a prototype branch.
- **Stack** - one PR per layer.
- **Buildable** - labelled `ready`, with no assignee and every blocker closed or held by an open PR.
