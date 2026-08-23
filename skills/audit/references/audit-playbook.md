# Audit playbook

Nine lenses for reading a codebase, the shape a finding takes, and the rubric that orders them.

Input: a scope of code, and the categories to read it under.
Output: findings in the Finding format below, ordered by the rubric below.

Scale depth to repo size: a 2k-line CLI gets a lighter pass than a 500k-line monorepo.

*Adapted from [shadcn/improve](https://github.com/shadcn/improve) (MIT).*

**A finding is only a finding with evidence.** "Probably has N+1 queries somewhere" is not a finding;
`orders/api.ts:142 issues one query per item inside a loop` is.

## 1. Correctness and bugs

- Error handling: missing UI error states on a failed operation.
- Async hazards: unawaited promises, races on shared state, missing cancellation or cleanup (stale effect
  closures, listeners never removed).
- Null and undefined: `!` assertions on nullable values, optional chaining hiding a must-exist value,
  unchecked array indexing.
- Boundaries: off-by-one, empty-collection handling, timezone and locale assumptions, counter or ID
  overflow.
- State machines: impossible states representable in the types, enum branches with a silent `default:`.
- Concurrency: check-then-act on shared resources, missing transactions around multi-writes,
  non-idempotent retried operations (webhooks, queues).
- Type escape hatches: `any`, `as` and `@ts-ignore` clusters.
- Resource leaks: unclosed handles, connections or subscriptions, missing `finally`.

## 2. Security

**Write no runnable exploit strings or step-by-step misuse.** Keep plans at the level of code changes,
config changes and tests.

- **Secret hygiene:** hardcoded keys or tokens, credentials in a committed `.env` or in logs. Report
  `file:line` plus the credential type only; the fix always includes **rotation**. **A finding, the
  roadmap and the trail carry the location and the type**, and the value stays where it is.
- **Data into interpreters:** SQL or shell built from request data (injection), HTML sinks fed user
  content (XSS), dynamic-eval on runtime input, filesystem paths from request data (path traversal). Name
  the safer API or the validation boundary.
- **Access control:** endpoints without server-side identity checks, authz enforced only client-side,
  object-by-ID without ownership or tenant checks (IDOR), missing CSRF on state-changing routes.
- **Input contracts:** boundaries trusting request bodies without schema validation, uploads without type
  or size limits, broad object-assignment from request data (mass assignment).
- **Dependency posture:** run the audit command read-only (`npm audit`, `pnpm audit`, `pip-audit`,
  `cargo audit`); report only critical or high advisories on reachable code.
- **Prod config:** overly broad CORS with credentials, missing hardening headers where it matters, cookie
  flags (`HttpOnly`, `Secure`, `SameSite`), debug on in production.
- **By-design ≠ finding:** honoring `https_proxy` and `NO_PROXY`, reading `~/.netrc`, a local dev tool
  shelling out - intentional. A tradeoff recorded in the product docs is settled. Flag only when the
  *implementation* adds risk beyond the convention. But a **stale decision doc is itself a finding**:
  report code that drifted from what the product docs say.

## 3. Performance

Report an algorithmic or architectural win.

- N+1: a query or fetch per item in a loop or per list-row; missing batching.
- Wrong complexity: nested scans over one collection, repeated `find` or `filter` in a hot loop where a
  Map-keyed lookup belongs.
- Caching gaps: identical expensive work repeated per request or render, no memoization at clear
  boundaries, no data-layer caching on stable data.
- Payload: over-fetching (`select *`, full objects where IDs suffice), missing pagination on unbounded
  lists, oversized JSON to clients.
- Frontend: heavyweight deps for trivial use, missing code-splitting, render waterfalls, client-fetching
  data available at render time.
- Backend: sync work that belongs in a queue, and connection-per-request where pooling exists. Flag a
  missing index implied by a query pattern for verification, and claim it once schema evidence backs it.

## 4. Test coverage

Name which untested code is dangerous.

- Map the critical paths (money, auth, data mutation, the feature the repo exists for) and check which
  have zero or trivial coverage.
- High-churn (git log) plus no tests is the top refactor risk → a "characterization tests first"
  candidate.
- Existing test quality: assertions that assert nothing, mocks testing mocks, unread snapshots, flaky
  patterns (real timers, real network, order dependence).
- Missing layers: unit-only with no integration on API boundaries, or slow E2E for what a unit test would
  catch.
- **Is there a one-command way to know the code works?** If not, that is finding #1 and a prerequisite.

## 5. Tech debt and architecture

Two defects here carry code-rules tags. Report an inconsistent pattern, meaning three ways of fetching, as
`oddball:`. Name the convention that wins, which is the most recent convergence, and plan the
consolidation. Report a premature abstraction as `yagni:`. Read the missing-abstraction case, where one
change always touches N files in lockstep, as `scattered:` below.

- Duplication: the same logic in 3+ places, or divergent copies that drifted.
- Layering violations: UI importing data-layer internals, circular deps, a high-fan-in `utils` junk drawer.
- Dead code: unused modules, fully-rolled-out flags still branching, commented blocks, manifest deps no
  longer imported.
- God modules: files an order of magnitude larger than the median that everything touches; double-digit
  parameter counts, deep nesting.

## 6. Dependencies and migrations

- Major-version lag on core framework or runtime with real cost (EOL, security-fix cutoff, ecosystem
  incompatibility) - not every minor bump.
- Deprecated APIs with an announced removal timeline; abandoned deps (no release in years, archived) on
  critical paths.
- Duplicate deps solving one problem (two date libs); lockfile or version-pin drift across a monorepo.
- Per migration candidate, estimate **blast radius** (files touched) - it gates effort and whether to
  recommend it at all.

## 7. DX and tooling

- Missing or broken: typecheck script, lint config, formatter, pre-commit hooks.
- Slow feedback: dev-server or test startup in minutes, no watch mode, CI without caching.
- Onboarding friction: wrong README setup steps, undocumented required env vars, no `.env.example`.
- Missing `CLAUDE.md` or `AGENTS.md` where agents will execute - high leverage, so recommend one.

## 8. Docs

Docs rank lowest by default. Flag a gap only where its absence has a concrete cost.

- Public API surface (published packages) with no reference docs.
- Architectural decisions nobody can reconstruct for actively-contested areas.
- **Stale docs that are actively wrong** - setup steps or examples that no longer work.

## 9. Direction

Name what the codebase wants to become, rather than what is broken. **Grounding rule: every suggestion
cites repo evidence.** A suggestion that could apply to any project in the category is noise. Sources of
grounded signal:

- **Unfinished intent:** TODO and FIXME clusters on one theme, flags never rolled out, stubbed modules,
  abandoned mid-feature work in git history.
- **Stated-but-undelivered:** README or roadmap promises with no code, no-op CLI flags. A `product.md`
  North Star the code has not caught up to is the strongest signal. Where a decision already rejected the
  obvious proposal, note the contradiction instead.
- **Surface asymmetries:** one-directional pairs (export without import, create without bulk-create),
  entities with CRUD-minus-one, a public API internal code clearly hand-rolled around.
- **The adjacent possible:** capabilities the architecture makes disproportionately cheap - a plugin
  system one interface away, a public API one route from the service layer.

Direction findings use the standard format with two adaptations: **Impact** is product or user value (who
wants this, why now), and **Confidence** reflects how *grounded* the evidence is. Strategy belongs to the
maintainer, so give grounded options with honest trade-offs. A selected one becomes a **design-first or
spike-first** intent, scoped to what the evidence supports.

## Finding format

Return every finding, every category, in this shape:

```markdown
### [CATEGORY-NN] Short imperative title
- **Evidence**: `path/file.ts:123` - one sentence on what's there. (2–5 strongest locations; note "and ~N similar" if widespread.)
- **Impact**: what goes wrong / what's paid. Concrete: "every order-list render issues 1+N queries", not "suboptimal".
- **Effort**: S (hours) / M (a day-ish) / L (multi-day) - for the fix, including tests.
- **Risk**: what the fix could break; LOW/MED/HIGH + one line why.
- **Confidence**: HIGH (read it, certain) / MED (strong signal, needs verification) / LOW (smell). LOW → an "investigate" finding, not a "fix". Prefix that title with `investigate:`.
- **Fix sketch**: 1–3 sentences - enough to judge effort, not the plan.
```

One filled instance:

```markdown
### [PERF-01] Batch the per-row order lookup
- **Evidence**: `orders/api.ts:142` - the list handler calls `getCustomer()` once per row. Same shape at `orders/export.ts:88`.
- **Impact**: every order-list render issues 1+N queries. A 200-row page costs 201 round trips.
- **Effort**: S - one query change plus its test.
- **Risk**: LOW - the batched call returns the same rows in the same order.
- **Confidence**: HIGH - read both call sites.
- **Fix sketch**: Collect the customer IDs, fetch them in one `WHERE id IN (…)` query, and hydrate rows from a Map.
```

## Prioritization rubric

Order by **leverage = impact ÷ effort, discounted by confidence and fix-risk.** Tiebreakers:

1. Float up anything that unblocks other findings (verification baseline, characterization tests).
2. Float HIGH-confidence security above equivalent-leverage non-security.
3. Prefer a finding with a clean verification story.
4. Treat "not worth doing" as a valid verdict, and record it in one line so it is not re-audited.

## Simplification tags - the over-engineering lens

`${CLAUDE_PLUGIN_ROOT}/skills/code-rules/SKILL.md` carries the reuse ladder, its tag vocabulary and its
one-line finding format. Read that file whole before you tag, and carry the pointer rather than the
content. Nothing to cut → the check passes.

## Placement tags - is this code in the wrong *place*?

The simplification tags answer *is there too much code?* These four answer a question they cannot. Each is
invisible in a single file, and caught only by a **whole-layer diff**.

- `misplaced:` a function reaching into another module's data more than its own (**feature envy**) - move
  it onto the data it envies. Or the same few fields travelling together everywhere (**data clumps**) -
  bundle them and pass that.
- `scattered:` one logical change forced edits across many files (**shotgun surgery**), or one file edited
  for several unrelated reasons (**divergent change**). Gather what changes together; split what changes
  for different reasons.
- `passthrough:` a unit that mostly delegates onward (**middle man**), or a long `a.b().c().d()` walk the
  caller should not depend on (**message chain**). Cut it - call the real target direct.
- `stringly:` a primitive or bare string standing in for a domain concept that deserves its own small type
  (**primitive obsession**).

**Two rules bind these four:**

- **The repo overrides.** A shape `architecture.md` endorses is not a smell - suppress the tag there.
  Documented standard beats baseline, always.
- **They are always judgement calls.** A documented-standard breach can be a hard violation; a structural
  smell stays a judgement call. Say which you are reporting, and skip anything tooling already enforces.
