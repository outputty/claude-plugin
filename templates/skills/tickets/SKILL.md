---
name: tickets
description: Lists the open tickets with their blockers, priority, PR state and a before/after example each, prints the /goal line for the one to build, and hands a pick to its own session per the herdr skill. Use on "what's next", "list tickets", "which ticket".
---

# tickets - what is open, and the goal line for one

Every command is in the `tracker` skill. List the open tickets, their open blockers, and each ticket's PRs.

## The list

Print one line per ticket, then a blank line. Buildable tickets (per the `tracker` skill) come first, then `priority:high`, unlabelled, and `priority:low`, newest first within a tier. A `needs-planning` ticket belongs to `/plan <n>`.

```text
1. #52 Retry on 429                 buildable · priority:high

2. #47 Export scheduling            blocked by #52

3. #39 CSV export                   In Progress · 2 draft PRs, 1 merged

4. #35 Archive old runs             needs-planning
```

Follow a ticket's line with its before/after when the ticket body shows a call or an output, in its own fence. Copy it from the body and never invent one:

```ts
// before
m.query(db => db.selectFrom("orders as o")...) // mints a DAG edge to a table named "o"
// after
m.query(db => db.selectFrom("orders as o")...) // mints no edge to "o" - only to "orders"
```

## The goal line

Print the line for the first buildable ticket:

```text
/goal ticket #42 is built by following /build 42: every layer is an open draft PR in one stack with the docs layer last and each Implementation-criteria case's real output pasted; or a question to the user is open and not yet answered; or stop after 60 turns
```

The question branch lets the session end a turn on a question.

## Hand a pick to its session

A pick never runs here. Open its session per the `herdr` skill: the build case with the goal line, or the plan case with `/plan <n>` for a `needs-planning` pick.
