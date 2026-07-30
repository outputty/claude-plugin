# anatomy.md

> Auto-maintained by OpenWolf. Last scanned: 2026-07-19T19:08:48.318Z
> Files: 59 tracked | Anatomy hits: 0 | Misses: 0

## ./

- `.gitignore` — Git ignore rules (~58 tok)
- `.oxlintrc.json` (~50 tok)
- `.prettierignore` — Not code — leave hand-authored prose, diagrams, and generated files alone. (~40 tok)
- `.prettierrc` — Prettier configuration (~35 tok)
- `package.json` — Node.js package manifest (~120 tok)
- `pnpm-lock.yaml` — pnpm lock file (~2211 tok)
- `README.md` — Project documentation (~3317 tok)

## .claude-plugin/

- `marketplace.json` (~311 tok)

## .claude/

- `product.md` — outputty — Product (~19994 tok)
- `settings.json` (~489 tok)
- `settings.local.json` (~19 tok)

## .claude/hooks/

- `format-lint.js` — The path of the file the tool just wrote, from the PostToolUse hook input on stdin. (~694 tok)

## .claude/trails/

- `0001-bootstrap.md` — Trail — 0001-bootstrap (~668 tok)
- `0002-brownfield-and-github.md` — Trail — 0002-brownfield-and-github (~399 tok)
- `0003-init-scan-depth.md` — Trail — 0003-init-scan-depth (~287 tok)
- `0004-transferred-patterns.md` — Trail — 0004-transferred-patterns (~623 tok)
- `0005-enforce-on-real-work.md` — Trail — 0005-enforce-on-real-work (~350 tok)
- `0006-build-as-dynamic-workflow.md` — Trail — 0006-build-as-dynamic-workflow (~1025 tok)
- `0007-documentation-skill.md` — Trail — 0007-documentation-skill (~799 tok)
- `0008-beads-lite.md` — Trail — 0008-beads-lite (~1163 tok)
- `0009-grill-model-pin.md` — Trail — 0009-grill-model-pin (~446 tok)
- `0010-expert-knowledgebase.md` — Trail — 0010-expert-knowledgebase (~1074 tok)
- `0011-response-protocol.md` — Trail — 0011-response-protocol (~649 tok)
- `0012-defensive-coding-and-readme.md` — Trail — 0012-defensive-coding-and-readme (~641 tok)
- `0013-absorb-ponytail-self-gate.md` — Trail — 0013-absorb-ponytail-self-gate (~1039 tok)
- `0014-build-single-agent-per-layer.md` — 0014 — BUILD: one builder + one QA per layer, loop until done (~993 tok)

## agents/

- `outputty-adversary.md` (~250 tok)
- `outputty-builder.md` — Boundaries (~2060 tok)
- `outputty-expert.md` — Each run (~1174 tok)
- `outputty-qa.md` — Sequence — run every check, report each (~1625 tok)
- `outputty-simulator.md` — Rules (~655 tok)
- `scanner.md` (~393 tok)

## docs/

- `security.md` — Safety & hardening (~311 tok)

## hooks/

- `block-dangerous-commands.js` — outputty PreToolUse hook (Bash matcher): deny destructive commands, ask on risky-but-valid ones. (~919 tok)
- `env-incomplete.md` — OUTPUTTY - environment incomplete (~89 tok)
- `guard-secret-files.js` — outputty PreToolUse hook (Read|Edit|Write matcher): deny touching secret files by path. (~407 tok)
- `hooks.json` (~306 tok)
- `protocol.md` — OUTPUTTY - spec-driven Claude Code plugin (active) (~2073 tok)
- `require-environment.js` — outputty PreToolUse hook (Edit|Write matcher): DENY real work (file mutations) unless the tools are (~484 tok)
- `scan-secrets.js` — outputty PreToolUse hook (Edit|Write matcher): scan written content for credential patterns. (~434 tok)
- `session.js` — Read a sibling file (next to this hook) as UTF-8 text. (~1229 tok)

## skills/diagram/

- `SKILL.md` — outputty:diagram (~3174 tok)

## skills/diagram/references/

- `swimlane.md` — Swimlane diagrams — layout rules (~493 tok)

## skills/documentation/

- `SKILL.md` — outputty:documentation — technical READMEs that read like a person wrote them (~1073 tok)

## skills/documentation/references/

- `writing.md` — Writing craft — read when drafting or auditing README prose (~970 tok)

## skills/grill/

- `SKILL.md` — grill — stress-test a plan, one question at a time (~2627 tok)

## skills/bootstrap/

- `SKILL.md` — bootstrap — brownfield bootstrap (~911 tok)

## skills/qa/

- `SKILL.md` — qa — definition of done + PR write-up (~846 tok)

## skills/outputty/

- `build.md` — BUILD phase — hands-off, one dynamic workflow (~7591 tok)
- `plan.md` — PLAN phase — architecture into a task graph, gated (~1814 tok)
- `simulate.md` — SIMULATE — evolve the plan without guessing (optional, inside PLAN) (~1022 tok)
- `SKILL.md` — outputty — feature flow (~1318 tok)
- `spec.md` — SPEC phase — intent, gated (~1227 tok)
- `tasks.js` — outputty beads-lite — a per-branch task graph. Adopt the beads *model*, not the `bd` tool. (~1913 tok)
- `tasks.md` — Task graph (beads-lite) — the substrate PLAN writes and BUILD drains (~1102 tok)
- `tasks.test.js` — self-check for tasks.js.  Run: node skills/outputty/tasks.test.js (~518 tok)

## skills/outputty/references/

- `pr-description.md` — PR description format (enforced) (~3198 tok)
- `product-template.md` — product.md structure (canonical) (~2165 tok)
- `skill-minting.md` — Minting a skill from the retrospective — read this before creating one (~792 tok)
