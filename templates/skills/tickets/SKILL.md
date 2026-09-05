---
name: tickets
description: Lists the open tickets with their blockers and priority, prints the /goal line for the one to build next, and hands a pick to its own session per the herdr skill - a new tab alongside this one when inside Herdr, a claude --worktree command otherwise. Use at the start of a build session, or on "what's next", "list tickets", "which ticket".
---

# tickets - what is open, and the goal line for one

Every command here is the `tracker` skill's; load it first. List the open tickets with labels, assignees and age.

A ticket labelled `needs-planning` is listed as such; it is `/plan <n>`'s, not a build's.

## A folded epic

A body whose only content is a `## Layers` list naming other issue numbers is a **folded epic**, buildable as-is. Before treating any named issue as done, read the layer's state per the `tracker` skill, even when it reads closed:

- Closed as not planned, with a "Folded into #<parent>… Closed, not built" comment, means the work is still outstanding. The closed issue's body is the real spec, preserved for `/build` to re-plan under the parent.
- Only closed as completed, or an open unfolded issue, is done.
- List the parent as buildable either way, with "re-plan from #<n>" beside it.

## Blockers and the list

For each ticket, list its open blockers per the `tracker` skill.

Print one line per ticket, buildable ones first (no open blocker, no assignee), `priority:high` before the rest, oldest first:

```text
1. #42 CSV export                  buildable · priority:high
2. #47 Export scheduling           blocked by #42
3. #39 Retry on 429                In Progress, @ringoldsdev
4. #35 Dedup on import             needs-planning
```

Then the line to paste for the first buildable one, its Implementation-criteria cases copied from the ticket body:

```text
/goal ticket #42 is built by following /build 42: <Implementation-criteria case 1>; <case 2>; every layer is an open draft PR in one stack with the docs layer last; or a question to the user is open, carrying an e2e example (input and output) per option, and not yet answered; or stop after 60 turns
```

The third branch lets the session end its turn on a question; without it the `/goal` judge reads every ask as quitting.

The user picks; the number they name is the one whose line you print again.

## Handing a pick to its own session

A pick never runs here; this session stays on `main`. Open the session for it per the `herdr` skill: a new tab in the current workspace, `claude --worktree` inside it on the right model, the line already sent, no `--wait`.

- A buildable pick, when asked to start the build: the build case, with the `/goal` line above.
- A `needs-planning` pick: the plan case, with `/plan <n>`.

Outside Herdr the `herdr` skill prints the `claude --worktree` command for the user to run, and the line to paste.
