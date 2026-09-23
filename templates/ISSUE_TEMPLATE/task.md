---
name: Ticket
about: One roadmap item a build session can take - the problem, the end-to-end example, and the end state
labels: ready
---

<The problem in one short paragraph: what happens today, why it is wrong, what it costs. Define each term at first use. A ticket filed before the design is settled keeps only this paragraph and `## Settle first`, and carries `needs-planning` instead of `ready`.>

## What should happen

<The full end-to-end program, both states, real values throughout - no ellipsis, no paraphrase.>

```lang
// before - today, real
<the exact call that runs today>
```

```json
<the real input it ran against>
```

```json
<the real output or error it produced>
```

```lang
// after - once this ships
<the same call, or its replacement>
```

```json
<the output once built>
```

## What not to do

<Delete when this ticket does not follow up a reverted attempt.>

```lang
// tried in <PR#>, reverted - <the one-line reason>
<the reverted code, as it was written>
```

## Implementation criteria

<One directive or checkable case per line. Outcomes only: a layer plan, a file-scope limit or an unpicked library stays out.>

- <the pattern, file or symbol this must follow, with its `path:line`>
- <a structural fact the build depends on, with its `file:line`, diagram or probe>
- `<command>` prints `<expected output>`.
- Gating: `none`, or `<FLAG_NAME>` at `<the orchestrator or class-construction site>`.
- Sibling: `<path:line>` or `none, new surface`.
- Where: `<the folder the work belongs in>`.

## Referenced PRs

<Delete when no PR is open yet. Per PR: its number, then the same before/after shape as above.>

## Settle first

<Delete when nothing is unresolved. One open question per line.>
