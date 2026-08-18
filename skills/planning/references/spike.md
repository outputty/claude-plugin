# How a spike runs, and the deletion rules

The planning skill points here from its Spike section. A spike is a test in the repo's own suite that
answers an empirical question; a deletion is a spike too.

**How a spike runs:**

1. **A spike is a test in the repo's own suite.** One file per question, its name carrying
   **`spike-<slug>`**. Use the same slug in the task's trail (`append_trail`) and any resulting claim. It
   lives where the repo's tests live, runs under the repo's runner, and is committed as written.
2. **Variants are test cases, not separate scripts.** Options A/B/C sit as cases in the one spike file.
   Feed them the canonical data from `docs.js examples --name "<name>"`; pin a new shape in `examples.yaml`
   first when none fits. A variant that must run inside the app goes on a throwaway branch that is never
   merged — say so when you cut it.
3. **The answer survives; the spike graduates or dies.** Write the trail entry (`append_trail`): the
   decision and what was dropped. Then record the validated answer where its reader works:

| The validated fact is about | Record it in |
| --- | --- |
| an external system, library or platform | a `kind: limitation` entry in the architecture index, or a CLAUDE.md rule |
| this repo's own code | `architecture.yaml`'s verified constraints |

A routed fact's re-verification probe is "run the spike test", so that spike **stays in the suite**. Then
**redraft the target program** with what you learned. A dead-end spike is **deleted in the same session**,
as a tracked commit, never an orphaned file. BUILD works from the `contract` and its test, never from
spike code.

**Quick spikes stay quick.** The write-up is the trail entry (`append_trail`).

A spike can fire mid-grilling: take the answer back into the interview and carry on. It also serves PLAN —
a design fork found there comes back as a spike per candidate. Don't confuse it with **`stage: prototype`**,
the first real commit, kept and matured; a spike's artifact is always discarded.

### Deleting is a spike too, and the tests are the specification

**Simplification means the same expected outcome with less machinery.** If the outcome is unchanged, the
tests that define it must still pass, unchanged.

- **Keep every test exactly as it is** through a simplification. Never rewrite a test to fit the new shape.
- **Delete a test only when the feature it covers is being deleted.** That is a **product decision**, not
  a simplification — it belongs in `roadmap.yaml` as a ❌ row before the test goes.
- **Run the deletion test first.** Imagine the thing gone. **If the complexity vanishes, it was a
  pass-through and it goes. If it reappears across N callers, it was earning its keep.**
- **Price what you are removing before you scope its removal.** "Not worth its cost" needs a number.
- **Delete one thing at a time. A verdict applies to the unit you measured, never the story it arrived
  in.** If you cannot price it separately, you have not scoped it separately.
