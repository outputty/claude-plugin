# Trail — 0009-grill-model-pin

> Pin outputty's advanced-grill fan-out (`outputty-expert` + `outputty-adversary`) to a fixed
> `{ model: 'opus', effort: 'medium' }` instead of letting it inherit the session model.

## Thought-trail

- **Trigger.** A smoke-test of the advanced-grill dynamic workflow (expert + adversary fanned out in
  parallel via `agentType`) ran correctly, but both agents had no per-call model and inherited the
  session (Opus 4.8 here) — verified from their transcript `meta.json` (only `agentType`, no model).
  The adversary itself flagged silent model-inheritance as a live risk.
- **Decision: pin the fan-out per-call to `{ model: 'opus', effort: 'medium' }`.** Grilling is the
  plan's stress test — it should run on a fixed strong model at controlled effort, never drop to Sonnet
  on a Sonnet session nor balloon to Opus-at-xhigh under `ultracode`.
- **Where the pin lives: the `agent()` call, not frontmatter.** Verified against this repo's own 0006
  trail — in a dynamic workflow agent-frontmatter `model` is moot (honored only for interactive
  Agent-tool dispatch); a workflow agent with no per-call `model`/`effort` inherits the session
  (product.md 0.2.3 "What was tried"). So the fix is authoring guidance in `grill/SKILL.md`,
  mirroring build.md's two-tier model policy and its "frontmatter won't do it" caveat.
- **Scope: grill fan-out only.** BUILD's CAST + reviewers keep inheriting the session on purpose
  (product.md defends it — the QA gate stays as strong as the session). Not touched.

## Outcome

- `skills/grill/SKILL.md` — advanced mode gained a **Model policy — pin per-call** note.
- `.claude/product.md` — new *What was tried* entry (0.2.5).
- `.claude-plugin/marketplace.json` — version `0.2.4` → `0.2.5`.
