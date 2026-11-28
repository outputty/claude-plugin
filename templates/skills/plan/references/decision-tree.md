# The decision tree

Open every round with the tree, redrawn short: `✓` settled, `→` asked this round, `○` waiting on the node above it. Show every top-level decision, with its answer once settled. Expand only the branches that last round and this round touched. Hide an answered question below the top level.

```text
#42 CSV export                         round 2
├─ ✓ Q1 output format       CSV, RFC 4180
├─ → Q2 who can export      any signed-in user, or admins only
│   └─ ○ Q3 export limits        waits on Q2
└─ ○ Q4 what an export holds waits on Q2
```
