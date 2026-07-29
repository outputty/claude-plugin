# SIMULATE — evolve the plan without guessing (optional, inside PLAN)

When the requirements admit **multiple genuinely distinct paths forward**, don't pick one by
argument — **simulate the fork**: run one design simulation per permutation, all toward the **same
end state**, and compare what comes back. A simulation is a *"yes, and"* exercise: the agent accepts
every requirement as given (*yes*) and extends it with its assigned approach (*and*) — it never
re-litigates the spec (that was the grill's job).

**When to run it:** the architecture delta admits **2+ genuinely distinct designs** (different
decomposition, dependency direction, storage, or algorithm — not naming variations), and neither
`product.md`'s Architecture seams nor the laziest-working-diff ladder settles the choice (if one path is
plainly lazier, take it — no simulation). Skip for small or settled work. **More than 4 candidate
permutations means the fork is upstream** — the spec is too broad; go back to SPEC rather than
simulate wider.

**Not the SPEC spike.** A **spike** ([spec.md](spec.md)) answers *how should this behave* by writing
throwaway code that is then deleted; SIMULATE answers *which design do we build* by reasoning — its
agents are **read-only and write only their report**. If the open question is behavioural rather than
architectural, it belonged upstream in SPEC.

## 1. Fix the end state — one, shared, non-negotiable

Every simulation targets the **identical end state**: the target program in `product.md`'s **"What
we're building towards"** plus the feature's done definition. Embed it **verbatim** in every
simulation brief. A simulator may not redefine or trim it — permutations vary the *path*, never the
*destination*; that is what makes the results comparable. (A permutation that *can't* reach the end
state must say so loudly — that is a result, not a failure.)

## 2. Propose the slate — THE GATE (never skip)

Draft **2–4 permutations**: each gets a name, a one-line hypothesis ("event-sourced writes make the
audit trail free"), and what it uniquely explores. Then **STOP and present the list to the user**
with `AskUserQuestion` (multiSelect, so they pick any subset; *Other* lets them add a permutation you
didn't think of). Name the cost plainly: one Opus agent per selected simulation, run in parallel. **Never run a simulation the user didn't select** — the selection is a hard gate, exactly like
the SPEC and PLAN gates.

## 3. Fan out — parallel subagents, same framing, one report each

Once the user has selected, dispatch **one `outputty-simulator` per selected permutation, in parallel**
(at most 4, so the 20-concurrent subagent cap is never in play)
— all `Agent` calls in a single message so they run concurrently — using the **namespaced**
`subagent_type: 'outputty:outputty-simulator'` (plugin agents register under the `outputty:` prefix; the
bare name errors at dispatch). **Opus at `effort: medium` is pinned in the simulator's own charter**, so
the fan-out must not *inherit* the session model — a Sonnet session would otherwise silently downgrade
every simulation. No keyword, no launch card. Every brief is identical —
requirements, the verbatim end state, `product.md`'s Architecture seams — **except the one assigned
permutation**. Each simulator writes its report to `.claude/trails/<branch>.sim-<slug>.md` (its only
write) and returns a short summary; you collect the list of summaries + report paths.

## 4. Compare — summarize every single simulation

Back in the session, read **every** report and present — **for each simulation, not just the
winner**: its approach in two lines, whether it reaches the end state, its cost sketch (est. tasks /
layers), and its sharpest risk. Then one comparison table across all of them, and a recommendation
with the *why*. The user picks (or confirms the recommendation).

## 5. Feed PLAN

The chosen simulation's task-graph sketch seeds the real task graph (PLAN still authors it properly —
deps, scopes, contracts from the seams). Insights worth keeping from the **losing** simulations go to
the trail; the choice and its why are distilled into `product.md` at merge like any decision. The
`.sim-*.md` reports are trail artifacts — archived with the branch, never committed as product truth.
