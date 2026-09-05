---
name: Ticket
about: One roadmap item a build session can take - the interface, the end state, and what it waits on
labels: ready
---

<State the problem in one short paragraph. Name what happens today, name why it is wrong, name what it costs. Assume the reader holds none of this session's context. Define each term at first use. Simple technical English, active voice.

Filing this before the design is settled? Stop here. Delete every section below except `## Settle first`, and list what remains unclear there. Add `needs-planning`, drop `ready`.>

## What should happen

Write the full end-to-end program, both states, real values throughout - no ellipsis, no paraphrase.

```lang
// before — today, real
<the exact call that runs today>
```

```json
<the real input it ran against>
```

```json
<the real output or error it actually produced>
```

```lang
// after — fixed, expected
<the same call, or its replacement — what this ticket makes true>
```

```json
<the expected output once built>
```

## What not to do

<Delete this whole section when this ticket does not follow up a reverted attempt.>

```lang
// tried in <PR#>, reverted — <the one-line reason>
<the reverted code, real, as it was written>
```

<Name what it breaks, or why it fails - one sentence.>

## Implementation criteria

Write every line as a directive or a checkable case, active voice, one instruction per line. This list carries the definition of done - a command with an expected output is a case; "works correctly" is not.

- <Name the pattern, file, or symbol this must follow - e.g. "Mirror the strategy shape at `path:line`.">
- <Name the doc this must match - e.g. "Follow `.claude/architecture.md`'s Constraints in dependencies section.">
- <Name the structural fact the build depends on, with its `file:line`, diagram, or probe.>
- `<command>` prints `<expected output>` - an end-to-end, checkable case.
- <the next end-to-end case>
- Change no file outside `<folder>`.
- Sibling: `<path:line>` or `none, new surface`.
- Where: `<the one folder the work belongs in>`.

## Referenced PRs

<Delete this whole section when no PR is open yet. Per PR: name its number, then show the same before/after code shape above - what it changed, in real input/output terms - so a reader never opens the PR to know what it did.>

## Settle first

<Delete this whole section when nothing is unresolved.>

- <Name the open question.>
