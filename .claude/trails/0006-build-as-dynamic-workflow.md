# Trail — 0006-build-as-dynamic-workflow

> Turning the hands-off BUILD phase into a real Claude Code **dynamic workflow**, per the user's
> directive: "create dynamic workflows using a spec and leverage the current layer", with subagent
> roles invented per task rather than a fixed archetype.

## Thought-trail

- **Grounded the term first.** `code.claude.com/docs/en/workflows` = dynamic workflows: a JS script
  that orchestrates subagents; the plan lives in code and only the final verdict returns to the
  session's context. Confirmed via a research fan-out (workflows / plugin packaging / tool options /
  effort docs) + a 3-lens adversarial verify.
- **Only BUILD fits.** A workflow **can't take mid-run human input** (docs: "run each stage as its own
  workflow"), so SPEC and PLAN stay gated in the session; only the already-hands-off BUILD becomes a
  workflow. Clean mapping, no compromise.
- **Plugins can't ship a workflow.** Verified against plugins-reference: no `workflows/` component and
  plugins can't write into `.claude/workflows/`. So BUILD stays a **skill that instructs Claude to
  author + launch** the workflow each run from the approved layers (`args`) — that authoring-from-spec
  *is* the "dynamic workflow from the spec". No `${CLAUDE_PLUGIN_ROOT}` executable is loaded verbatim;
  the reference shape lives in build.md.
- **Dynamic roles, not dynamic tasks.** The Fable "let it architect the flows" idea maps to inventing
  **roles** (prompts), not registered `agentType`s (those resolve from a launch-time registry and
  can't be minted mid-run). A **CAST** agent invents the executor + task-fit reviewers per task;
  the executor's invariants are a fixed `EXECUTOR_RULES` prefix (in-scope only; no git — the commit
  stage does it), and CAST specializes it. **`agents/task-runner.md` was then deleted:** in a
  dynamic-role design a registered agent only earns its place via a capability boundary or
  guaranteed-reliable dispatch — the executor's model/effort are pinned per-call (frontmatter moot),
  it needs Bash for test-first (so git can't be denied by a `tools:` allowlist), and `agentType`
  inside a workflow is undocumented. Its content reduced to the two-line prefix. A generic base
  template was rejected as a speculative abstraction — shared invariants are already ambient
  (ponytail, OpenWolf anatomy, the `schema` option) and role-specific ones diverge (editor vs
  reviewer) and are exactly what CAST invents. `scanner` stays: it's dispatched normally by the
  interactive `outputty-init` (documented dispatch), its `model: haiku` frontmatter IS honored there,
  and its read-only role is a fixed boundary.
- **Static tasks keep the shared checkout safe.** Layers/tasks stay PLAN's job (gated, non-overlapping
  scope). Because same-layer scopes don't overlap, editors write the **shared checkout** directly —
  **no worktree isolation** (rejected the isolation→commit seam the adversarial pass flagged). A
  pre-launch non-overlap check enforces the invariant.
- **Commits inside the workflow, serial + gated.** Agents can run git, so passed tasks commit inside
  the workflow (serial, after the layer's review) — killing the return-then-replay contract, its
  ordering/filter hazard, and the split context. Escalated tasks are never committed.
- **Model/effort pin.** User's call: **every build agent = Sonnet 5, medium effort**
  (`{ model: 'sonnet', effort: 'medium' }`). Per-call `model`/`effort` work in the runtime but aren't
  in public docs — build.md notes to confirm against the generated script if a run ignores the pin.
- **No fallback.** User killed the "dual shape" (skill fan-out as default). Workflows are required
  (v2.1.154+); if disabled, BUILD stops and says so rather than degrading silently.
- **Files touched:** `skills/outputty/build.md` (rewritten; `EXECUTOR_RULES` prefix),
  `agents/task-runner.md` (**deleted** — folded into the prefix), `hooks/session.js` (BUILD banner →
  workflow model), `.claude/product.md` (Flow + Branch-model + What-was-tried), `README.md` (BUILD
  bullet + layout). `agents/scanner.md` kept.
