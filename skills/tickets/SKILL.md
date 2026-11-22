---
name: tickets
description: Lists the open tickets with their blockers, priority, PR state and a before/after example each, prints the /goal line for the one to build, and hands a pick to its own session per the herdr skill. Use on "what's next", "list tickets", "which ticket".
---

# tickets - what is open, and the goal line for one

List the open tickets, their open blockers and each ticket's PRs, per the `tracker` skill.

## The list

Print one line per ticket and a blank line: buildable tickets first (per the `tracker` skill), then `priority:high`, unlabelled and `priority:low`, newest first within a tier. A `needs-planning` ticket belongs to `/outputty:plan <n>`.

```text
1. #52 Retry on 429                 buildable · priority:high

2. #47 Export scheduling            blocked by #52

3. #39 CSV export                   In Progress · 2 open PRs, 1 merged

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
/goal ticket #42 is built by following /outputty:build 42: its PR is open and ready for review with the docs layer last and each Implementation-criteria case's real output pasted; or a question to the user is open and not yet answered; or stop after 60 turns
```

For a ticket labelled `stack`, write `every layer is an open PR in one stack with the docs layer last` in place of `its PR is open and ready for review with the docs layer last`.

For several tickets picked together, print one line for all of them, in the order given:

```text
/goal tickets #42, #43, #44 are built in that order by following /outputty:build 42 43 44: each ticket's PR is open and ready for review with its docs layer last and its Implementation-criteria cases' real output pasted; or a question to the user is open and not yet answered; or stop after 120 turns
```

## Hand a pick to its session

A pick opens its own session per the `herdr` skill, unless the user says "do it here": the build case with the goal line, or the plan case with `/outputty:plan <n>` for a `needs-planning` pick. On the user's "prototype", a buildable pick opens the prototype case with `/outputty:prototype <n>` instead, and its build comes after.
