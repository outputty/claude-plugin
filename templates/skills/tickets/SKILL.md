---
name: tickets
description: 'Lists open tickets with blockers and priority, and hands a pick to its own session. Use on "what''s next" or "list tickets".'
---

# tickets

Input: nothing. Output: the open tickets as a list, and the goal line for the one to build.

## Steps

- [ ] 1. List the open tickets, their open blockers and each ticket's PRs, per the `tracker` skill.
- [ ] 2. Print the list in the shape of [references/list.md](references/list.md).
- [ ] 3. Print the goal line for the first buildable ticket, in the shape of [references/goal-lines.md](references/goal-lines.md).
- [ ] 4. Hand a pick to its own session per the `herdr` skill: the build case with the goal line, or the plan case with `/plan <n>` for a `needs-planning` pick.
  - On the user's "prototype", a buildable pick opens the prototype case with `/prototype <n>` instead, and its build comes after.

## Do

- Order buildable tickets first, then `priority:high`, unlabelled and `priority:low`, newest first within a tier.
- Follow a ticket's line with the before/after its body shows, copied and never invented.
- For a ticket labelled `stack`, write `every layer is an open PR in one stack with the docs layer last` in place of `its PR is open and ready for review with the docs layer last`.
- Send a `needs-planning` ticket to `/plan <n>`.

## Don't

- Don't name a stack in a goal line for a ticket without the `stack` label.

## Glossary

- **Buildable** - open, labelled `ready`, and blocked by no open ticket.
- **Tier** - a priority group: `priority:high`, unlabelled, `priority:low`.
- **Pick** - the ticket the user chose.
- **Goal line** - the `/goal` line that makes a build session run one ticket to its PR.
- **Layer** - one step of a build, chosen so the program works after it.
- **Stack** - one PR per layer, built only for a ticket labelled `stack`.
