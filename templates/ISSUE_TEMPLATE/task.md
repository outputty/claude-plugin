---
name: Ticket
about: One planned item a build session can take, in these headings - Problem, Assumptions, Solution, Attempted, Next
labels: ready
---

## Problem

<One short paragraph: what happens today, why it is wrong, and what needs to happen instead. Define each term at first use.>

<Today, shown end to end: the call, its real input and its real output, or the test that shows it, by path and test name. For a new feature, what the user cannot do today.>

```lang
<the exact call that runs today>
```

```json
<the real input it ran against>
```

```json
<the real output or error it produced>
```

## Assumptions

<Filled by the build's first step: each premise the change rests on, checked against current `main`. At filing, list only open questions here; a ticket with any carries `needs-planning` instead of `ready`, and stops after this heading.>

- <premise> - checked: <file:line or doc section>

## Solution

<The end state, not how to build it: the inputs that change and the outputs once built; for a new feature, the inputs, the expected outputs and the call the user writes. Real values throughout. No file, symbol, seam or internal step.>

```lang
<the call the user writes once this ships>
```

```json
<its input>
```

```json
<its output once built>
```

### How to validate

<Freeform, led by the example a human would write: given these inputs or conditions, this happens, or does not. A Haiku or Sonnet session runs it in minutes.

- A state that breaks the app only when several parts line up: its inputs, and a flowchart of how to reach it.
- A number such as time, memory or throughput: the exact script that measures it.>

## Attempted

<"None", or each attempt: the PR, the code as written and the one-line reason it failed or was reverted.>

## Next

### Implementation criteria

<One checkable case per line, outcomes only: no file, symbol, seam, layer plan, library pick or count of call sites, files or tests.>

- `<command>` prints `<expected output>`.
- Gating: `none`, or `<FLAG_NAME>`.
- Review effort: `high`, or `low` for a small, self-contained ticket - how deep the build's `/code-review` goes.
- Base: `main`, or `prototype/<name>` - the branch on GitHub the build starts from.
