---
name: tracker
description: Use before filing, reading or closing a ticket, moving a board item, or opening, stacking or merging a PR, and before any gh issue, gh pr or gh project command; and on "what's next" or "list tickets", when it lists the open tickets with blockers and priority, prints the goal lines and hands a pick to its own session. It holds the exact commands.
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

- Don't call a ticket buildable while a blocker is open, whatever its label.
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
- Create a feature branch from `main`: `git push origin origin/main:refs/heads/feature/<slug>`. Open its PR into `main`; only the orchestrator merges it, and only when the user said "merge everything": `gh pr create --base main --head feature/<slug> --title "<title>" --body-file tmp/pr.md`.
- Merge a PR into its feature branch when a go-ahead is in force or the user said to merge: `gh pr merge <pr#> --merge`; never into `main`; otherwise leave it for the user.
- List a ticket's PRs: `gh pr list --state all --search "#<n>" --json number,title,state,isDraft,mergeable`
- Close a PR and delete its branch: `gh pr close <pr#> --delete-branch`
- Start a prototype branch from `main`: `git fetch origin main`, then `git switch -c prototype/<name> origin/main`
- Publish it: `git push -u origin prototype/<name>`
- List the stubs the branch added, which prints nothing when none is left: `git diff origin/main...HEAD | grep '^+.*TODO: stub'`

## Review threads

### Do

- Post a review with one inline thread per finding: write `{"commit_id": "<head>", "event": "COMMENT", "body": "<summary>", "comments": [{"path": "<file>", "line": <n>, "side": "RIGHT", "body": "<marker and finding>"}]}` to `tmp/review.json`, then `gh api repos/<owner>/<repo>/pulls/<pr#>/reviews --method POST --input tmp/review.json`
- Post a finding that has no changed line as a PR comment: `gh pr comment <pr#> --body-file tmp/finding.md`
- List a PR's threads with their comments: `gh api graphql -f query='query($o:String!,$r:String!,$n:Int!){repository(owner:$o,name:$r){pullRequest(number:$n){headRefOid reviewThreads(first:100){nodes{id isResolved isOutdated path line comments(first:20){nodes{databaseId author{login} body createdAt}}}}}}}' -f o=<owner> -f r=<repo> -F n=<pr#>`
- Reply in a thread: `gh api graphql -f query='mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{url}}}' -f t=<thread id> -f b="<reply>"`
- Resolve a thread, from a recheck only: `gh api graphql -f query='mutation($t:ID!){resolveReviewThread(input:{threadId:$t}){thread{isResolved}}}' -f t=<thread id>`
- Reopen a thread, from a recheck only: the same with `unresolveReviewThread`.

### Don't

- Don't resolve or reopen a thread from the build session: the build replies, and only a recheck of the `review` skill closes.

## Stacked PRs

### Do

- Build this way only a ticket labelled `stack`: one PR per layer.
- Start the first layer from the base: `git fetch origin <base>`, then `git switch -c feature/<slug>-<ticket#>-l1 origin/<base>`
- Start each later layer from the layer below: `git switch -c feature/<slug>-<ticket#>-l<k>`
- Publish a layer as a PR ready for review, based on the branch below, `main` for the first: `git push -u origin <layer-branch>`, then `gh pr create --base <branch-below> --title "<title>" --body-file tmp/pr.md`
- Link the stack in the same turn each layer's PR opens, never later: `gh stack link --base <base> <l1-pr#> <l2-pr#> ... <lk-pr#>`, every layer bottom to top, where `<base>` is the first layer's base branch, the feature branch or `main`. Run it again with the longer list for each new layer: GitHub adds the new PR to the existing stack. A first layer alone is not linked yet.
- After a lower layer changes, for each branch above it, bottom to top: `git switch <layer-branch>`, `git rebase <branch-below>`, `git push --force-with-lease origin <layer-branch>`
- Merge a stack into its feature branch when a go-ahead is in force or the user said to merge: `gh stack merge <top-pr#> --yes`, which merges that PR and every layer below it; otherwise leave it for the user.

### Don't

- Don't stack a ticket the user did not label `stack`.

## Picking the next ticket

On "what's next" or "list tickets": list the open tickets, print the goal lines, and hand a pick to its own session.

### Do

- List the open tickets, their open blockers and each ticket's PRs with the commands above, and print them in the shape of [references/list.md](references/list.md).
- Print the goal line for the first buildable ticket and the loop goal line, in the shape of [references/goal-lines.md](references/goal-lines.md).
- Hand a pick to its own session per the `herdr` skill: the build case with the goal line, the build loop case with the loop goal line, or the plan case with `/plan <n>` for a `needs-planning` pick. On the user's "prototype", a buildable pick opens the prototype case with `/prototype <n>` instead, and its build comes after.
- Order buildable tickets first, then `priority:high`, unlabelled and `priority:low`, newest first within a tier.
- Follow a ticket's line with the before/after its body shows, copied and never invented.
- For a ticket labelled `stack`, write `every layer is an open PR in one stack with the docs layer last` in place of `its PR is open and ready for review with the docs layer last`.
- Send a `needs-planning` ticket to `/plan <n>`.

### Don't

- Don't name a stack in a goal line for a ticket without the `stack` label.

## Glossary

- **Layer** - one step of a build, chosen so the program works after it.
- **Stub** - a line marked `TODO: stub - <what the build must design>`.
- **Prototype branch** - a `prototype/<name>` branch on GitHub that a prototype session builds.
- **Base** - the ticket's line naming the branch the build starts from: `main`, or a prototype branch.
- **Stack** - one PR per layer.
- **Buildable** - labelled `ready`, with no assignee and every blocker closed.
- **Tier** - a priority group: `priority:high`, unlabelled, `priority:low`.
- **Pick** - the ticket the user chose.
- **Goal line** - the `/goal` line that makes a build session run one ticket to its PR.
