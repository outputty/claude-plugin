---
name: tickets
description: Lists the open tickets with their blockers and priority, prints the /goal line for the one to build next, and hands a pick to its own session - a Herdr worktree tab when inside Herdr, a claude --worktree command otherwise. Use at the start of a build session, or on "what's next", "list tickets", "which ticket".
---

# tickets - what is open, and the goal line for one

Run these (the `tracker` skill has every command):

```bash
gh issue list --state open --json number,title,labels,assignees,createdAt
```

A ticket labelled `needs-planning` is listed as such; it is `/plan <n>`'s, not a build's.

## A folded epic

A body whose only content is a `## Layers` list naming other issue numbers is a **folded epic**, buildable as-is. Before treating any named issue as done, check it, even when `state` reads `CLOSED`:

```bash
gh issue view <layer-n> --json state,stateReason,comments --jq '{state,stateReason,lastComment:.comments[-1].body}'
```

- `stateReason: NOT_PLANNED` with a "Folded into #<parent>… Closed, not built" comment means the work is still outstanding. The closed issue's body is the real spec, preserved for `/build` to re-plan under the parent.
- Only `stateReason: COMPLETED`, or an open unfolded issue, is done.
- List the parent as buildable either way, with "re-plan from #<n>" beside it, so the pick is not mistaken for finished residue.

## Blockers and the list

For each ticket, its open blockers:

```bash
gh api repos/<owner>/<repo>/issues/<n>/dependencies/blocked_by --jq '.[] | select(.state == "open") | .number'
```

Print one line per ticket, buildable ones first (no open blocker, no assignee), `priority:high` before the rest, oldest first:

```text
1. #42 CSV export                  buildable · priority:high
2. #47 Export scheduling           blocked by #42
3. #39 Retry on 429                In Progress, @ringoldsdev
4. #35 Dedup on import             needs-planning
```

Then the line to paste for the first buildable one, its Done when cases copied from the ticket body:

```text
/goal ticket #42 is built by following /build 42: <Done when case 1>; <case 2>; every layer is an open draft PR in one stack with the docs layer last; or stop after 60 turns
```

The user picks; the number they name is the one whose line you print again.

## Handing a pick to its own session

A pick never runs here. This session stays on `main`; a plan or a build gets its own worktree, in its own tab when inside Herdr. Check `test "${HERDR_ENV:-}" = 1` first.

Both cases are fire-and-forget: send the prompt with no `--wait`, then stop polling or reading that pane. The handed-off session owns its turns from here.

### A needs-planning pick

Inside Herdr:

1. `herdr worktree create --workspace "$HERDR_WORKSPACE_ID" --branch plan-ticket-<n> --base main --label "(plan) <n> <slug>" --no-focus`, then read `.result.root_pane.pane_id`.
2. `herdr agent start plan<n> --kind claude --pane <pane-id>` - planning runs on the session's default model; its judgement calls are what Opus and the Fable advisor are for.
3. `herdr agent prompt plan<n> "/plan <n>"`.

Outside Herdr: tell the user to run `claude --worktree plan-ticket-<n>` themselves, then `/plan <n>` there. Never run `/plan` inline here.

### A buildable pick, when asked to start the build

A build always gets its own checkout, so this is `herdr worktree create`, never `herdr tab create`.

Inside Herdr:

1. `herdr worktree create --workspace "$HERDR_WORKSPACE_ID" --branch ticket-<n> --base main --label "(build) <n> <slug>" --no-focus`, then read `.result.root_pane.pane_id`.
2. `herdr agent start build<n> --kind claude --pane <pane-id> -- --model sonnet` - a build runs on Sonnet; the layers are mechanical once planned, and the Fable advisor from the repo settings covers the judgement calls.
3. `herdr agent prompt build<n> "<the /goal line>"`.

Outside Herdr: tell the user to run `claude --worktree ticket-<n> --model sonnet` themselves and paste the goal line there.

⚠ `--workspace`, never `--cwd`. `--cwd <path>` on `herdr worktree create` opens a brand-new workspace, not a tab in this one; `herdr tab create` defaults to the current workspace, `herdr worktree create` does not. If it already happened: `herdr pane move <pane_id> --tab <this workspace's tab>` relocates the running agent without restarting it, because `pane move` changes the pane's tab, never its cwd or its process.
