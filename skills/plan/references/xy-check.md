# The XY check, worked

The notes the check writes, then the decision it adds to the tree, as a round lists it:

```text
Y            lend the pool's one connection to a query inside a transaction
X            a run that queries inside a transaction finishes
Needs        one run holds two connections at once: the transaction's and the query's
Constraint   max: 1, allowed by an earlier ticket
```

```text
**Q1** - **How a run gets its second connection**: refuse a pool below two, drop queries outside the transaction handle, or lend the one connection?
new Pool({ max: 1 }); // throws: a run needs at least 2 connections; set max to 2 or more
new Pool({ max: 2 }); // a run holds the transaction and one query at once
Recommend: refuse a pool below two - no lending code, and a user who needs a pool of one asks for it then.
```
