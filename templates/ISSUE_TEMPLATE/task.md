---
name: Ticket
about: One roadmap item a build session can take - the problem, the end-to-end example, and the end state
labels: ready
---

<The problem in one plain paragraph: what happens today, why it is wrong, what it costs. Define each term at first use. A ticket filed before the design is settled keeps only this paragraph and `## Settle first`, and carries `needs-planning` instead of `ready`.>

## What should happen

```lang
// before - today, real
<the exact call> // <the real output or error>
// after - once this ships
<the same call> // <the output it will print>
```

## What not to do

<Only when this follows a reverted attempt: the reverted code and the one-line reason it failed. Delete otherwise.>

## Implementation criteria

<Outcomes and runnable cases only, one per line. A layer plan, a file-scope limit or an unpicked library stays out.>

- `<command>` prints `<expected output>`.
- Sibling: `<path:line>` of the nearest code this must resemble, or `none, new surface`.
- Where: `<the folder the work belongs in>`.

## Settle first

<Only when something is unresolved: one open question per line. Delete otherwise.>
