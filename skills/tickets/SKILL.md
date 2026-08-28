---
name: tickets
description: Lists the open tickets with their blockers and priority, and prints the /goal line for the one to build next. Use at the start of a build session, or on "what's next", "list tickets", "which ticket".
---

# tickets - what is open, and the goal line for one

Run these (the `github` skill has every command):

```bash
gh issue list --state open --json number,title,labels,assignees,createdAt
```

A ticket labelled `needs-planning` is listed as such; it is `/plan <n>`'s, not a build's.

For each, its open blockers:

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
