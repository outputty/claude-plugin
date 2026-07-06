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
  `agentType: 'task-runner'` supplies the executor's invariant base charter, CAST specializes it.
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
- **Files touched:** `skills/outputty/build.md` (rewritten), `agents/task-runner.md`
  (haiku→sonnet/medium; base executor charter; commit ownership moved to the workflow's commit stage),
  `.claude/product.md` (Flow + Branch-model + What-was-tried), `README.md` (BUILD bullet).
