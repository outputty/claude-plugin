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

Fetch with the `tracker` skill's list command, newest first — `createdAt` descending — so the order below always starts from a fresh sort, never `gh`'s own default. For each ticket, list its open blockers per the `tracker` skill.

Print one line per ticket, buildable ones first (no open blocker, no assignee), then by priority tier — `priority:high`, then `priority:normal` (an unlabeled ticket sorts here too), then `priority:low` last — newest first within a tier. Leave one blank line after each ticket, before/after block included, so the list reads as one entry per paragraph rather than a dense block:

```text
1. #52 Retry on 429                 buildable · priority:high

2. #49 Dedup on import               buildable

3. #47 Export scheduling            blocked by #52

4. #39 CSV export                   In Progress, @ringoldsdev

5. #42 Nightly backfill sweep        buildable · priority:low

6. #35 Archive old runs              needs-planning
```

A `priority:low` ticket that is buildable still sorts to the very bottom of the buildable group — below every `priority:high`/`priority:normal` buildable ticket, whatever its age — never mixed in by date alone.

### The e2e example

When a ticket's own opening paragraph or `## What should happen`/Implementation criteria sections show a call or an output shape (almost every `kind:feature`/`kind:bug` ticket — not a pure decision/research ticket like a `needs-planning` scoping ticket with no settled shape yet), follow that ticket's line with a very brief before/after, pulled from the ticket body, never invented, in its own fenced code block (the ticket's own language, `ts` for a code snippet or `text` for an error message):

```text
5. #636 A SQL alias is read as a table name    buildable
```

```ts
// before
m.query(db => db.selectFrom("orders as o")...) // mints a DAG edge to a table named "o"
// after
m.query(db => db.selectFrom("orders as o")...) // mints no edge to "o" — only to "orders"
```

Real identifiers from the ticket, no prose beyond the `// before`/`// after` comments. Skip it when the ticket has no such shape yet — printing an invented one is worse than printing none. The blank-line rule above still applies: one blank line after the code block, before the next ticket's line.

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
