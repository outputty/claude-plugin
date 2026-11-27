---
name: review-preflight-honest-big
tags: [review, preflight]
plugins: ["../../../.."]
max_turns: 6
timeout_seconds: 300
allowed_tools: [Skill, Read]
---

Working from the review skill, as reviewer-1, in the review of PR 312 for ticket 310. The builder is `builder-1`. Step 1 is done. The output of `git log --stat --format='%h %s' origin/main..HEAD`, test and doc lines already left out of the counts, is:

```
a1f3c2 refactor(orders): extract refundAmount, drops the copy in cart.ts - one function, two callers   +38 -52
b2c4d6 feat(orders): print "refunded" for refund 5, criterion 1                                         +24 -3
e5f6a7 feat(orders): reject refunds over 30 days, criterion 2                                           +300 -10
f6a7b8 feat(orders): print "pending" while the bank confirms, criterion 3                               +250 -60
d7a9b0 refactor(cart): move the totals into one module so refund and checkout share them - one action    +420 -0
c0d1e2 fix(orders): round the refund to cents, criterion 4                                              +180 -20
```

The whole diff is +1212 -145 in `src/`. What do you do at step 2, and then?
