---
name: review-preflight-blob
tags: [review, preflight]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, as reviewer-1, in the review of PR 312 for ticket 310. The builder is `builder-1`. Step 1 is done. The output of `git log --stat --format='%h %s' origin/main..HEAD`, test and doc lines already left out of the counts, is:

```
a1f3c2 refactor(orders): extract refundAmount, drops the copy in cart.ts - one function, two callers   +38 -52
b2c4d6 feat(orders): print "refunded" for refund 5, criterion 1                                         +24 -3
c9e1f8 wip                                                                                              +812 -40
```

The whole diff is +874 -95 in `src/`. What do you do at step 2, and then?
