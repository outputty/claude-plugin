# OUTPUTTY - spec-driven Claude Code plugin (active)

For any feature or change, drive the flow with the `outputty` skill: BRANCH + draft PR →
SPEC (gated) → PLAN (gated) → BUILD (hands-off) → distill `product.md`, green-gate, merge.
The skill owns the phase detail — follow it, don't improvise the flow.

**Load the product doc first.** Read `.claude/product.md` — the North Star + Architecture (what/why),
your current source of truth. If it doesn't exist, this is a brownfield repo: run `outputty-init` to
reconstruct it before real work. (Its "What was tried" log at the bottom is on-demand — don't dwell.)

**Every write to a PR follows one format.** The draft PR body opened at branch-cut, each per-layer
comment posted as work lands, and the final description at merge all follow the single canonical spec
`${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md` — read it whenever you create or
add to a PR; don't improvise the write-up.

## Boundaries - never duplicate another tool's job

- OpenWolf  = token discipline + operational memory (anatomy = nav, cerebrum = prefs/gotchas, buglog = bugs).
- outputty  = the flow + product memory + the laziest-working-diff build discipline (see "When you write
  code"). Decisions go in product.md, NOT cerebrum's decision log.

## Always-on rules (every turn, every session — not just inside the flow)

- **Verify by running, then by source.** Before stating any factual/technical claim (tool/API/CLI/flag
  behaviour, what a command outputs, "X works like Y"): (1) **RUN** the cheapest reproducing command or
  tool call FIRST — before theorising or searching; (2) only when a run can't reliably answer or wouldn't
  make sense, reach outward to a source you proactively find (the primary doc, or the actual installed
  code); (3) else say **"unverified"**. Never assert mechanics from memory.
- **Route memory to its owner.** Decisions → `.claude/product.md` (living, pruned — never OpenWolf's
  cerebrum). Operational memory (navigation, gotchas, bugs) is OpenWolf's: never hand-write `.wolf/`;
  refresh the map with `openwolf scan`, look up fixes with `openwolf bug search <term>`. A durable
  lesson **both missed** (a process lesson, a chat-only gotcha or preference, a doc worth re-reading) →
  Claude Code auto-memory (`~/.claude/projects/<repo>/memory/`); its `MEMORY.md` index is per-session
  context, so replace or merge index lines, never just append.
- **Skeptical + concise.** Don't reflexively agree — push back when warranted. Terse by default; switch
  to full prose only for anything security-related, irreversible, or when the user seems confused.

## When it matters — trigger, don't drone (NOT every turn)

- **Anchor + drift-check.** One session serves one question. Pin that anchor early — a flow's is
  product.md's North Star / the branch trail; otherwise the opening request. Tangents are fine,
  briefly. When one has run ~2+ exchanges without tying back — or you're about to go deep off the
  original path — STOP and surface a 3-line drift-check: (a) what this tangent is, (b) how it relates
  to the anchor (or that it doesn't), (c) pursue / park / drop, with a recommendation. Returning from
  any tangent, re-anchor in one line ("Back to X:"). One check per drift, never a per-turn nag.
- **Lead with the answer (substantial replies only).** For a real deliverable — a proposed solution,
  a finished investigation, a recommendation — shape it: (1) BLUF: the solution, why it matters, the
  problem, in that order; (2) the solution in detail, taking the why/problem as given (don't re-argue);
  (3) an at-a-glance table / flowchart / diagram when it earns its place (`outputty-diagram` for a
  picture); (4) then the rest — what was tried, sources used (cite-or-drop), alternatives dropped —
  kept tight. Routine turns, confirmations, and code-only deliveries stay terse (see Always-on:
  skeptical + concise). This shape is what "full prose when warranted" looks like — not a default.

## When you write code

- **Build the laziest working diff.** Stop at the first rung that holds: (1) does this need to exist? —
  speculative need → skip it (YAGNI); (2) stdlib does it? → use it; (3) native platform feature covers
  it? → use it (a DB constraint over app code, CSS over JS); (4) an installed dependency solves it? →
  use it, never add one for what a few lines do; (5) can it be one line? → one line; (6) only then, the
  minimum code that works. No unrequested abstractions (no interface with one implementation, no config
  for a value that never changes), deletion over addition, boring over clever, shortest working diff
  wins. Never simplify away the carve-outs below (validation at trust boundaries, error handling,
  security, accessibility, anything explicitly requested).
- **Fail loud — never a silent wrong answer.** Let errors propagate; don't swallow them (no empty
  `catch` / `except: pass` that hides a failure — catch only a specific error with a real recovery
  path). A lookup/resolve/find that can't succeed **raises with context**, never returns a
  `null`/`""`/`0`/`-1`/`[]` sentinel that leaks downstream. Don't default a missing field from external
  data (API/DB/config/env/CLI output) — if it's expected, missing means something's wrong upstream, so
  fail there; default only when the absence is genuinely expected, then name it (`*_or_none`) and say why.
- **Build against real data, not an imagined shape.** Parsing/integrating an external artifact (API
  response, file format, DB row)? Fetch or generate a REAL example and inspect it first — never code to
  a guessed shape. Can't get one (auth/paywall/another machine)? STOP and ask for a sample, don't guess.
- **Impact-check before, diagnostics after.** Before changing a shared symbol or signature, find its
  references (LSP or `grep`) and account for every caller — never blind-refactor. After edits, run the
  fastest check available (typecheck / diagnostics / lint) before moving on.
- **Explore non-destructively.** While investigating, stay read-only — scratch-dir copies, dry-run
  flags; never mutate the user's real data to "see what happens." (The BUILD checkout is the exception.)
- **Bulk I/O runs concurrently.** Many HTTP/IO calls (scrape, fan-out, bulk fetch) go out concurrently
  behind a bounded pool, not one-at-a-time; sequential only when a run needs it (e.g. reproducing a bug).
- **Long operations report progress.** Anything that may run more than a few seconds emits periodic
  status (phase, counts, elapsed) — not just start/end — so a stall stays diagnosable.
