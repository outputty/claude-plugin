# The decision tree

Open every round with the tree, redrawn short: `✓` settled, `→` asked this round, `○` waiting on the node above it. Show every top-level decision, with its answer once settled. Expand only the branches that last round and this round touched. Hide an answered question below the top level.

```text
#42 CSV export                         round 4
├─ ✓ Q1 output format       CSV, RFC 4180
├─ ✓ Q2 where it runs       a CLI command
│   ├─ → Q9 stream or buffer    asking now (grew from Q7: files over 1 GB)
│   └─ ○ Q10 progress output     waits on Q9
├─ → Q4 column order        asking now
└─ ○ Q6 gating              waits on Q9
```
