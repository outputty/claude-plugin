# Trail — 0012-defensive-coding-and-readme

> Add a gated `## When you write code` section to `hooks/protocol.md` (defensive-coding + data-integrity
> rules harvested from EspoTek's CLAUDE.md), and rewrite the README intro that still called outputty
> "thin / invents almost nothing".

## Thought-trail

- **Trigger.** Reviewed [EspoTek/.claude/CLAUDE.md](https://github.com/EspoTek/.claude/blob/master/CLAUDE.md)
  for codified "don't repeat this" patterns. It's essentially a defensive-coding + data-integrity
  rulebook — the strongest gap against outputty, whose protocol.md had **no** error-handling discipline.
- **Decision: add six code-writing rules, generalised from Python to language-agnostic.** Fail-loud (no
  swallowed errors / bare-except, lookups raise instead of returning null/`""`/`0`/`-1`/`[]` sentinels,
  no silent defaults for missing external-data fields); build against real data or STOP and ask;
  impact-check references before a refactor + run diagnostics after edits; explore non-destructively;
  bulk I/O concurrent behind a bounded pool; progress on >few-second operations.
- **Decision: a new gated section, not the always-on block.** These are code-*writing* disciplines, so
  `## When you write code` keeps them out of non-coding turns and keeps the always-on rules lean
  (ponytail). Complements ponytail rather than fighting it — ponytail already refuses to simplify away
  error handling; this names the concrete anti-patterns.
- **Deliberately skipped.** EspoTek's "check the cwd `.env` for credentials" **conflicts** with our
  `guard-secret-files` hook (which denies `.env` reads) — not imported. Its `uv`/pip mandate and
  Context7 usage are project/tool-specific, not language-agnostic — skipped.
- **Decision: README intro was untrue, rewrite it.** It opened "thin, deliberately unoriginal… invents
  almost nothing… wires together tools." Outputty now ships two original engines — the panel-of-experts
  grill and the hands-off build loop — so the intro was rewritten (via the `outputty-documentation`
  ruleset: front-load, describe-don't-sell) to lead with the flow and those two engines, still crediting
  OpenWolf / ponytail / grill-with-docs as what it stands on rather than reinvents.

## Outcome

- `hooks/protocol.md` — new `## When you write code` section (six rules).
- `README.md` — intro rewritten; the "thin / unoriginal / invents almost nothing" framing removed.
- `.claude/product.md` — new *What was tried* entry (0.4.1).
- `.claude-plugin/marketplace.json` + `package.json` — version `0.4.0` → `0.4.1`.
