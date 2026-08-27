---
name: Task
about: One unit of work a fix-issue agent can build cold, judged by /goal
labels: ready
---

## Problem

<what happens today, then the gap, then what the gap costs. Define each term at first use.>

## Expected solution

```lang
<the top-level call from outside; the builder picks the implementation>
```

Input:

```json
<real values, no ellipsis>
```

Output (shape):

```json
<real fields; types stand in for values the builder produces>
```

Sibling: `<path:line>` or `none, new surface`
Where: `<the one folder the work belongs in>`
Anchor: `<file:line, diagram, or probe for each structural claim>`

## Done when

1. `<command>` prints `<expected output>`
2. <the next checkable case>
3. No file outside `<folder>` changed

## Constraints

- <a fact that shapes the build, with its consequence>

## Settle first

- <an unresolved question, or "none">
