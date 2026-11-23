---
name: split-tspattern-loop-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```ts
import { match, P } from "ts-pattern";

export function totals(rows: Array<{ type: string; amount: number }>): number {
  let sum = 0;
  for (const row of rows) {
    sum += match(row)
      .with({ type: "credit" }, (credit) => credit.amount)
      .with({ type: "debit" }, (debit) => -debit.amount)
      .with({ type: P.string }, () => 0)
      .exhaustive();
  }
  return sum;
}
```

This runs over a few million rows and is the slowest part of the job. How do I make it faster?
