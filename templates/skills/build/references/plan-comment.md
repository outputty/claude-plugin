# The plan comment

The build posts this as a ticket comment at step 2.6, in this shape and nothing else. Add `Flag: <FLAG_NAME>` under Solution when the ticket is gated.

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

## Attempted

None.

## Next

L1 starts now.
````
