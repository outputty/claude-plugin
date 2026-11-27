# The plan comment

The build posts this as a ticket comment at step 7, in this shape and nothing else. Add `Flag: <FLAG_NAME>` under Solution when the ticket is gated.

````markdown
## Problem

<the problem, as this build will solve it, in one line>

## Assumptions

- <premise> - checked: <file:line or doc section>

## Solution

```lang
<the call the user writes> // <the output once every layer lands>
```

1. L1 - <what lands> - <cases it serves>
2. L2 - <what lands> - <cases it serves>
3. docs - <the docs this build changes>

Checks:

- Commits: C1 <action> - <why>; C2 <action> - <why>
- Criteria: <criterion> -> <code file> and <test name>
- New: <item> - <ticket line, or sibling file:line>
- Removed: <item> - <ticket line, or its replacement>
- Smallest: <the files and functions of the smallest change>
- Rules: <documented rule> - <how the plan keeps it>
- Docs: <docs and Language terms the change touches>

## Attempted

None.

## Next

L1 starts now.
````
