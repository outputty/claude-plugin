# Audit playbook

What to look for, per category — the lens library for `audit` (and a review reference for
`outputty-qa` / `qa`). Each audit pass (or Explore subagent) gets the relevant category
sections **plus the Finding format** at the bottom. Adapt depth to repo size; a 2k-line CLI gets a
lighter pass than a 500k-line monorepo.

*Adapted from [shadcn/improve](https://github.com/shadcn/improve) (MIT).*

**A finding is only a finding with evidence.** "Probably has N+1 queries somewhere" is not a finding;
`orders/api.ts:142 issues one query per item inside a loop` is.

---

## 1. Correctness / bugs — the highest-trust category (found by reading, not guessing)

- Error handling: swallowed exceptions, empty catch, `catch (e) { log(e) }` on critical paths, missing
  UI error states.
- Async hazards: unawaited promises, races on shared state, missing cancellation/cleanup (stale React
  effect closures, listeners never removed).
- Null/undefined: `!` non-null assertions on nullable values, optional chaining hiding a must-exist
  value, unchecked array indexing.
- Boundaries: off-by-one, empty-collection handling, timezone/locale assumptions, counter/ID overflow.
- State machines: impossible states representable in the types, enum branches with a silent `default:`.
- Concurrency: check-then-act on shared resources, missing transactions around multi-writes, retried
  operations (webhooks, queues) that aren't idempotent.
- Type escape hatches: `any` / `as` / `@ts-ignore` clusters — each is a place the compiler was overruled.
- Resource leaks: unclosed handles/connections/subscriptions, missing `finally`.

## 2. Security — defensive framing only

Identify the code pattern, the production impact, and the remediation. **No runnable exploit strings or
step-by-step misuse.** Plans stay at the level of code/config changes and tests.

- **Secret hygiene:** hardcoded keys/tokens, credentials in committed `.env` or logs. Report `file:line`
  + credential type only; the fix always includes **rotation** (a committed secret is burned even after
  deletion). **Never write the value** into a finding, the roadmap, or the trail.
- **Data into interpreters:** SQL/shell built from request data (injection), HTML sinks fed user content
  (XSS), dynamic-eval on runtime input, filesystem paths from request data (path traversal). Name the
  safer API/validation boundary.
- **Access control:** endpoints without server-side identity checks, authz enforced only client-side,
  object-by-ID without ownership/tenant checks (IDOR), missing CSRF on state-changing routes.
- **Input contracts:** boundaries trusting request bodies without schema validation, uploads without
  type/size limits, broad object-assignment from request data (mass assignment).
- **Dependency posture:** run the audit command read-only (`npm/pnpm audit`, `pip-audit`, `cargo audit`);
  report only critical/high advisories on reachable code — skip low-signal noise.
- **Prod config:** overly broad CORS with credentials, missing hardening headers where it matters,
  cookie flags (`HttpOnly`/`Secure`/`SameSite`), debug on in production.
- **By-design ≠ finding:** honoring `https_proxy`/`NO_PROXY`, reading `~/.netrc`, a local dev tool
  shelling out — intentional. A tradeoff recorded in the product docs is settled. Flag only when the
  *implementation* adds risk beyond the convention. But a **stale decision doc is itself a finding**:
  if the code drifted from what the product docs say, report the drift.

## 3. Performance — algorithmic/architectural wins, not micro-optimization

- N+1: a query/fetch per item in a loop or per list-row; missing batching.
- Wrong complexity: nested scans over one collection, repeated `find`/`filter` in a hot loop where a Map
  keyed lookup belongs.
- Caching gaps: identical expensive work repeated per request/render, no memoization at clear
  boundaries, no data-layer caching on stable data.
- Payload: over-fetching (`select *`, full objects where IDs suffice), missing pagination on unbounded
  lists, oversized JSON to clients.
- Frontend: heavyweight deps for trivial use, missing code-splitting, render waterfalls, client-fetching
  data available at render time.
- Backend: sync work that belongs in a queue, missing indexes implied by query patterns (flag for
  verification — don't claim without schema evidence), connection-per-request where pooling exists.

## 4. Test coverage — *which untested code is dangerous*, not a percentage

- Map the critical paths (money, auth, data mutation, the feature the repo exists for) and check which
  have zero/trivial coverage.
- High-churn (git log) + no tests = top refactor risk → "characterization tests first" candidate.
- Existing test quality: assertions that assert nothing, mocks testing mocks, unread snapshots, flaky
  patterns (real timers/network, order dependence).
- Missing layers: unit-only with no integration on API boundaries, or slow E2E for what a unit test
  would catch.
- **Is there a one-command way to know the code works?** If not, that's finding #1 and a prerequisite.

## 5. Tech debt & architecture

- Duplication: the same logic in 3+ places, or divergent copies that drifted.
- Layering violations: UI importing data-layer internals, circular deps, a high-fan-in `utils` junk drawer.
- Dead code: unused modules, fully-rolled-out flags still branching, commented blocks, manifest deps no
  longer imported.
- God modules: files an order of magnitude larger than the median that everything touches; double-digit
  parameter counts, deep nesting.
- Inconsistent patterns: three ways of doing fetching/error-handling/styling — name the winner (the most
  recent convergence) and plan the consolidation.
- Abstraction mismatch: a premature abstraction with one implementation, or a missing one where the same
  change always touches N files in lockstep.

## 6. Dependencies & migrations

- Major-version lag on core framework/runtime with real cost (EOL, security-fix cutoff, ecosystem
  incompatibility) — not every minor bump.
- Deprecated APIs with an announced removal timeline; abandoned deps (no release in years, archived) on
  critical paths.
- Duplicate deps solving one problem (two date libs); lockfile/version-pin drift across a monorepo.
- Per migration candidate, estimate **blast radius** (files touched) — it drives effort and whether to
  recommend it at all.

## 7. DX & tooling

- Missing/broken: typecheck script, lint config, formatter, pre-commit hooks.
- Slow feedback: dev-server/test startup in minutes, no watch mode, CI without caching.
- Onboarding friction: wrong README setup steps, undocumented required env vars, no `.env.example`.
- Missing `CLAUDE.md`/`AGENTS.md` where agents will execute — high leverage; recommend one.

## 8. Docs — lowest default priority; flag only where absence has a concrete cost

- Public API surface (published packages) with no reference docs.
- Architectural decisions nobody can reconstruct for actively-contested areas.
- **Stale docs that are actively wrong** (worse than missing) — setup steps or examples that no longer
  work.

## 9. Direction — features & where to take this next

Forward-looking: not what's broken, but what the codebase wants to become. **Grounding rule: every
suggestion cites repo evidence.** A suggestion that could apply to any project in the category ("add
dark mode", "add AI") is noise. Sources of grounded signal:

- **Unfinished intent:** TODO/FIXME clusters on one theme, flags never rolled out, stubbed modules,
  abandoned mid-feature work in git history.
- **Stated-but-undelivered:** README/roadmap promises with no code, no-op CLI flags. A `product.yaml`
  North Star the code hasn't caught up to is the strongest signal — never propose what a decision
  already rejected (note the contradiction instead).
- **Surface asymmetries:** one-directional pairs (export without import, create without bulk-create),
  entities with CRUD-minus-one, a public API internal code clearly hand-rolled around.
- **The adjacent possible:** capabilities the architecture makes disproportionately cheap — a plugin
  system one interface away, a public API one route from the service layer.

Direction findings use the standard format with two adaptations: **Impact** is product/user value (who
wants this, why now), and **Confidence** reflects how *grounded* the evidence is. Strategy belongs to the
maintainer; the advisor gives grounded options with honest trade-offs. Selected ones become a
**design/spike-first** intent, not build-everything.

---

## Finding format

Every finding, every category, comes back in this shape:

```markdown
### [CATEGORY-NN] Short imperative title
- **Evidence**: `path/file.ts:123` — one sentence on what's there. (2–5 strongest locations; note "and ~N similar" if widespread.)
- **Impact**: what goes wrong / what's paid. Concrete: "every order-list render issues 1+N queries", not "suboptimal".
- **Effort**: S (hours) / M (a day-ish) / L (multi-day) — for the fix, including tests.
- **Risk**: what the fix could break; LOW/MED/HIGH + one line why.
- **Confidence**: HIGH (read it, certain) / MED (strong signal, needs verification) / LOW (smell). LOW → an "investigate" finding, not a "fix".
- **Fix sketch**: 1–3 sentences — enough to judge effort, not the plan.
```

## Prioritization rubric

Order by **leverage = impact ÷ effort, discounted by confidence and fix-risk.** Tiebreakers:

1. Anything that unblocks other findings (verification baseline, characterization tests) floats up.
2. HIGH-confidence security floats above equivalent-leverage non-security.
3. Prefer findings with a clean verification story — the flow's builder succeeds at those.
4. "Not worth doing" is a valid verdict; record it with one line so it isn't re-audited.

## Simplification tags — the over-engineering lens (canonical)

The shared taxonomy for the over-engineering review, one line per finding — `L<n>: <tag> <what>.
<replacement>.` — used by `outputty-qa` (the BUILD gate) and `qa` (the author's pass):

- `delete:` dead code / unused flexibility / a speculative feature — replace with nothing.
- `stdlib:` a hand-rolled thing the standard library ships — name it.
- `native:` a dependency or code doing what the platform already does — name the feature.
- `yagni:` an abstraction with one implementation, config nobody sets, a layer with one caller.
- `defensive:` a `try`/`catch`, null-guard, or fallback-default with **no real recovery path** — it
  swallows a crash that should reach the top-level handler; delete it, let it crash.
- `shrink:` the same logic in fewer lines — show the shorter form.
- `complexity:` a unit past ~7 branches (cyclomatic > 7), or too many variables in scope (params + locals
  + fields) — more than a reader holds at once; **decompose** so it fits in the head (name the split), or
  fold the arguments into a parameter object. (Decompose, don't just delete — this is essential complexity
  made legible, not dead code.)

A single smoke test or assert-based self-check is the **minimum, not bloat** — never flag it; a mandated
per-function docstring is **required, not bloat** — never flag it either. Nothing to cut → the check passes.

### Structural tags — is this code in the wrong *place*?

The seven above all answer *is there too much code?* These four answer a question they cannot reach, and
a **whole-layer diff is the only view that sees them** — each one is invisible in a single file:

- `misplaced:` a function reaching into another module's data more than its own (**feature envy**) — move
  it onto the data it envies. Or the same few fields travelling together everywhere (**data clumps**) —
  that is a type wanting to be born; bundle them and pass that.
- `scattered:` one logical change forced edits across many files in this diff (**shotgun surgery**), or
  one file was edited for several unrelated reasons (**divergent change**). Gather what changes together;
  split what changes for different reasons.
- `passthrough:` a unit that mostly delegates onward (**middle man**), or a long `a.b().c().d()` walk the
  caller should not depend on (**message chain**). Cut it — call the real target direct.
- `stringly:` a primitive or bare string standing in for a domain concept that deserves its own small
  type (**primitive obsession**).

**Two rules bind these four**, and without both they generate noise instead of findings:

- **The repo overrides.** A shape `architecture.yaml` endorses is not a smell — suppress the tag
  there. Documented standard beats baseline, always.
- **They are always judgement calls.** A documented-standard breach can be a hard violation; a structural
  smell never is. Say which you are reporting, and skip anything tooling already enforces.
