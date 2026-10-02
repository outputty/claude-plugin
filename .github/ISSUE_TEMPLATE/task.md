---
name: Ticket
about: One roadmap item a build session can take, in five headings - Problem, Assumptions, Solution, Attempted, Next
labels: ready
---

## Problem

<One short paragraph: what happens today, why it is wrong, what it costs. Define each term at first use.>

## Assumptions

<Filled by the build's first step: each premise the change rests on, checked against current `main`. At filing, list only open questions here; a ticket with any carries `needs-planning` instead of `ready`, and stops after this heading.>

- <premise> - checked: <file:line or doc section>

## Solution

<The full end-to-end program, both states, real values throughout - no ellipsis, no paraphrase. The seam planning picked is named and signed here.>

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

## Attempted

<"None", or each earlier attempt: the PR, the code as written, and the one-line reason it failed or was reverted.>

## Next

### Implementation criteria

<One directive or checkable case per line. Outcomes only: a layer plan, a file-scope limit or an unpicked library stays out.>

- <the pattern, file or symbol this must follow, with its `path:line`>
- `<command>` prints `<expected output>`.
- Gating: `none`, or `<FLAG_NAME>` at `<the orchestrator or class-construction site>`.
- Sibling: `<path:line>` or `none, new surface`.
- Where: `<the folder the work belongs in>`.
- Planning PR: #<pr>, the draft docs PR that the build stacks on.
