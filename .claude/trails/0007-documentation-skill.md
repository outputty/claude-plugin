# Trail — 0007-documentation-skill

> A generalized README ruleset stored as `documentation`, used to rewrite this repo's
> README (which had become a manual), with the `outputty` flow wired to update the README through it.

## Thought-trail

- **Researched, didn't guess.** A workflow fanned out over top-starred repos (react, next.js, vscode,
  k8s, tensorflow, vue), developer-tool/CLI repos (ripgrep, bat, fd, zod, uv, esbuild, prettier,
  tokio), and technical-writing authorities (Google Tech Writing, Diátaxis, Write the Docs,
  makeareadme, standard-readme, Art of README) → synthesis → 3-lens adversarial verify.
- **The adversarial pass changed the ruleset.** The raw synthesis was **over-fit** (CLI/library
  assumptions: "anchor to a `cat` clone", "runnable in 30s", hard word/badge counts, License-required)
  and **bloated** (a principles layer restating the rules; 12 anti-patterns = the rules inverted). It
  also caught a real contradiction (quickstart placed above the requirements it needs). Folded the
  fixes in → a lean, genuinely generalized ruleset.
- **Ruleset shape:** one principle (front-load + route depth out), a default section order (not a
  rigid template), ~10 checkable rules (proof-of-life paired with expected output; paste-safe
  fenced+language-tagged commands; describe-don't-sell; requirements-before-quickstart), a
  diagram-only-when-earned rule that defers to `diagram`, and the 4 anti-patterns that bite.
- **Diagram leverage.** The ruleset names the four cases a diagram earns its place (architecture,
  cross-boundary flow, state machine, decision tree) and routes production to `diagram` with
  a required one-line text equivalent, so it degrades gracefully.
- **Why the README was a mess:** it was a manual, not a hub — enforcement mechanics above install, a
  memory-boundary table, a full permissions-JSON dump, and a file tree, all duplicating `product.md`.
  Rewrote to a routing hub: one-line what-is-it → requirements → install → the flow (one committed
  `docs/flow.svg`, a gated-front/hands-off-back decision flow) → design pointer → safety and layout
  moved into `<details>`.
- **Wired in.** `outputty` SKILL gained a standing rule ("user-facing docs go through the ruleset");
  build.md's merge step points to it. README updates never hand-edited.
- **Self-review caught my own hypocrisy.** A 3-lens adversarial pass over the rewrite found the README
  still duplicated `product.md` — the memory-boundary table, the permissions-JSON dump, and the file
  tree, merely hidden in `<details>`: the exact README-as-manual sin the rewrite targeted. Cut them —
  memory boundary → one sentence + link, safety depth → `docs/security.md`, layout tree → deleted. It
  also flagged two of the ruleset's own rules (one-command-per-block, single-voice) as over-strict, the
  same over-fit the research pass caught; generalized both.
- **Files:** `skills/documentation/SKILL.md` (new), `docs/flow.svg` (new),
  `docs/security.md` (new, routed-out safety depth), `README.md` (rewritten),
  `skills/outputty/SKILL.md` + `skills/outputty/build.md` (wired in), `.claude/product.md`
  (Architecture + What-was-tried).
