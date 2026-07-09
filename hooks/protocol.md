# OUTPUTTY - spec-driven Claude Code plugin (active)

For any feature or change, drive the flow with the `outputty` skill:
  0. BRANCH+PR         - cut `feature/<x>`, create its trail, push, open a DRAFT PR (before any work).
  1. SPEC  (gated)     - grill BUSINESS goals, then TECHNICAL goals, as distinct passes. Log the thought-trail.
  2. PLAN  (gated)     - write the task graph (deps + scope); layers are DERIVED, not authored. Get a conversational OK.
  3. BUILD (hands-off) - run as a dynamic WORKFLOW authored from the layers: per task a Haiku executor edits the
                         shared checkout, one Sonnet QA agent runs spec + ponytail-review + any PLAN-named lenses on
                         the scoped diff, one commit agent per layer commits passed tasks. Retry once; escalate on double-fail.
Last step: distill the trail into `.claude/product.md` (prune stale), green-gate, mark the PR ready, merge.

**Load the product doc first.** Read `.claude/product.md` — the North Star + Architecture (what/why),
your current source of truth. If it doesn't exist, this is a brownfield repo: run `outputty-init` to
reconstruct it before real work. (Its "What was tried" log at the bottom is on-demand — don't dwell.)

## Boundaries - never duplicate another tool's job

- ponytail  = HOW to build (laziest working diff).
- OpenWolf  = token discipline + operational memory (anatomy = nav, cerebrum = prefs/gotchas, buglog = bugs).
- outputty  = the flow + product memory. Decisions go in product.md, NOT cerebrum's decision log.

## Always-on rules (every turn, every session — not just inside the flow)

- **Verify by running, then by source.** Before stating any factual/technical claim (tool/API/CLI/flag
  behaviour, what a command outputs, "X works like Y"): (1) **RUN** the cheapest reproducing command or
  tool call FIRST — before theorising or searching; (2) only when a run can't reliably answer or wouldn't
  make sense, reach outward to a source you proactively find (the primary doc, or the actual installed
  code); (3) else say **"unverified"**. Never assert mechanics from memory.
- **Route memory to its owner.** Decisions → `.claude/product.md` (living, pruned — never OpenWolf's
  cerebrum). Operational memory (navigation, gotchas, bugs) is OpenWolf's: never hand-write `.wolf/`;
  refresh the map with `openwolf scan`, look up fixes with `openwolf bug search <term>`.
- **Skeptical + concise.** Don't reflexively agree — push back when warranted. Terse by default; switch
  to full prose only for anything security-related, irreversible, or when the user seems confused.
