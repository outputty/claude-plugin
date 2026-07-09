# Trail — 0010-expert-knowledgebase

> Recompose the advanced-grill expert panel by orthogonal lens (not scope cluster), cap it at 4 as a
> scope smell, and give each `outputty-expert` a durable, footnoted `.claude/experts/<slug>.md`
> knowledgebase — plus a `<slug>/` cache of every source it fetched — that it re-validates every run.

## Thought-trail

- **Trigger.** A live advanced-grill panel proposed 4 experts (C1–C4) that were all facets of one
  RNG-determinism refactor — three frontend flavors + one algorithms, indistinguishable in practice.
  Root cause: `outputty-grill/SKILL.md` derived the slate "from the plan's scope clusters" — i.e.
  decomposition by *which parts of the code*, which on a small deep change yields adjacent facets, not
  distinct lenses.
- **Decision: compose by orthogonal lens with real surface area.** One expert per risk-axis that catches
  a class of failure the others structurally cannot; collapse any two whose findings could be swapped
  unnoticed. A fixed disciplinary roster was rejected too — it forces irrelevant experts (a determinism
  refactor has no data-scientist lens) the same way scope-clustering forces overlap. The rule is
  distinctness **and** relevance.
- **Decision: 4 is a hard ceiling that doubles as a scope smell.** The cap isn't just `AskUserQuestion`'s
  option limit — wanting more than 4 lenses means the scope is too big to grill in one pass. So the
  panel never grows past 4: it **STOPS and uses `AskUserQuestion` (with a free-form Other) to offer 2–4
  narrower-scope splits**, then grills only what the user picks. Experts favor specificity. The
  advanced-grill flowchart ([docs/flow.svg](../../docs/flow.svg)) draws this as a `>4 lenses?` decision →
  stop → ask → re-slate loop.
- **Decision: experts accumulate a knowledgebase, reused before invented.** New surface
  `.claude/experts/<slug>.md`, one file per canonical discipline slug so it persists across sessions,
  committed (shared, improving). The composer `Glob`s the folder to refine an existing expert before
  minting a new one.
- **Decision: knowledgebase format is footnoted + honest about being wrong.** Every claim in the `.md`
  carries a markdown footnote `[^id]` resolving to its source. On re-validation a disproven prior is
  **moved to a `## Disproven` section with the reason why and a footnote to what overturned it — never
  silently deleted**, because a broken assumption the plan rests on is itself a finding.
- **Decision: cache the evidence, not just the link.** Every *external* source an expert fetches (web
  page, API response, command output) is written to `.claude/experts/<slug>/` (folder named as the `.md`
  minus extension); footnotes point at the cached file so a claim survives its URL going stale or 404.
  In-repo files stay referenced by path — already durable, no copy.
- **Decision: the expert writes its own files.** It gains `Write`, scoped by instruction to
  `<slug>.md` + `<slug>/` only — the adversary stays fully read-only. The hooks allow it:
  `require-environment` passes once git + `.wolf/` exist (always true in a real grill), and
  `.claude/experts/` is not a secret path. Parallel experts write distinct slugs, so no contention.

## Outcome

- `skills/outputty-grill/SKILL.md` — panel-assembly stage recomposed (lens not cluster, 4-as-smell,
  reuse-before-invent, per-expert knowledgebase + web-latest).
- `agents/outputty-expert.md` — gained `Write`; load→re-validate→cache→write-back loop with an exact
  `<slug>.md` format (footnoted Findings, Disproven-with-why, Sources) and a `<slug>/` source cache.
- `README.md` — "How grilling works" updated for the lens rule, `.claude/experts/` reuse, and the
  expert's scoped write (knowledgebase + source cache); adversary-only read-only line corrected.
- `.claude/product.md` — new *What was tried* entry (0.4.0) + `.claude/experts/` added to the memory
  boundary.
- `.claude-plugin/marketplace.json` + `package.json` — version `0.3.0` → `0.4.0`.
- Follow-up (same 0.4.0): `skills/outputty-grill/SKILL.md` — the >4 rule became a concrete **stop +
  `AskUserQuestion`** (free-form Other) scope-narrowing; `docs/flow.svg` — advanced panel redrawn as the
  `>4 lenses?` stop → ask → re-slate sub-flow; `README.md` stage 2 + diagram alt-text updated to match.
