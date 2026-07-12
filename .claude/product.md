# outputty — Product

> Single source for what outputty is and why. Living document: pruned, not append-only.
> Business intent under North Star, technical under Architecture. Decisions never live in OpenWolf.

## North Star

A **single spec-driven Claude Code plugin applied to every project**, so
it is versioned and installable instead of copy-pasted into each repo's CLAUDE.md.

It exists to end tool fragmentation. Before outputty, the same jobs were spread across four
overlapping systems (a global work harness, OpenWolf, ponytail, grill-with-docs) that double-logged
decisions and competed for the same space. outputty is the thin spine that sequences the work and
**leans on existing tools instead of reinventing them**.

Principles:
- **Minimum memory surfaces.** One product doc; everything else is OpenWolf's.
- **Hands-off implementation.** The human is in the loop for intent (spec) and shape (plan), then
  the build runs unattended.
- **Separate business from technical** at the questioning level — never conflate the two.

## Architecture

**Shape.** A Claude Code plugin with a single-plugin marketplace (`source: "./"`, one
`marketplace.json` in `.claude-plugin/` carrying the plugin entry). Lives at `F:/outputty/claude-plugin`.

**The two layers it stacks on:**
- **OpenWolf** — token discipline + operational memory (`anatomy.md` = navigation, `cerebrum.md` =
  preferences/gotchas, `buglog.json` = bugs). A **hard requirement**, enforced by the SessionStart
  hook (it can't be a manifest dependency — it's a CLI, not a plugin).
- **outputty** — the flow (spec → plan → build) + product memory (this file) + the laziest-working-diff
  build discipline, owned in-plugin (stated in `protocol.md`, carried by the `outputty-builder` charter;
  absorbed from ponytail — see What was tried — no longer a dependency).

**Flow.** One entry skill (`outputty`) drives three phases, reading a phase file on demand
(progressive disclosure). SPEC and PLAN are gated. PLAN writes a **task graph** — a per-branch
`.tasks.jsonl` of tasks with `deps` — and `tasks.js schedule` **derives** the LAYERS from it (no
hand-authored layers; a same-layer scope clash fails loud as a missing dep). **BUILD runs as a
single Claude Code dynamic workflow (the `Workflow` tool)** — never turn-by-turn subagent dispatch —
that Claude authors each run from those layers: per task the `outputty-builder` agent edits the shared
checkout **contract-first**: it turns the task's `contract` (the input/output interface PLAN hands
down) into a failing test before writing code, then builds the laziest diff that passes it. Its charter
carries the boundary rules, the laziest-diff discipline, and a self-gate it runs before handoff
(non-overlapping layer scopes make worktrees unnecessary). Then a single `outputty-qa`
agent independently runs the definition-of-done on the task's scoped diff in a fixed sequence — spec
compliance (done-condition met + `contract` satisfied by a test that fails without the change) → an
over-engineering review → any per-task `lenses` PLAN named (`a11y`/`security`/…) → one structured verdict.
One commit agent per layer commits each passed task serially inside the workflow and marks it done; a
drain loop builds any discovered-from work (originals never re-enter it). The **executor runs on Haiku**
by default, rising to **Sonnet** when the task is `complex` or it's the retry; the **QA agent is pinned
to Sonnet** (its floor) and the commit agent to Haiku (mechanical) — the subagent model param is
family-only, so no pinned sub-version. Double failure escalates. A
workflow can't pause for input — which is exactly why only BUILD is one and the gated phases stay in
the session. The workflow is **launched by the user** — a dynamic workflow triggers from the user's
prompt (`ultracode` / "use a workflow") or `/effort ultracode`, not from the skill. Whether the launch
*also* runs without an approval prompt is the user's permission mode's call: bypass / `claude -p` / SDK
never prompt, auto-mode skips it when `ultracode` is on, and default / accept-edits prompt once per
workflow (until "don't ask again"). So unattended-from-run-one needs bypass / `-p` / SDK or
auto + `ultracode`; in default mode the user OKs the first launch.

**Memory boundary (the anti-double-log line):**
- `.claude/product.md` — North Star + Architecture + What was tried. The SessionStart protocol tells
  the agent to read it at session start (or `outputty-init` reconstructs it if absent). Decisions live
  here **only**.
- OpenWolf's `.wolf/` — navigation, gotchas, bugs. Never decisions. **outputty reads it but never
  writes it by hand** — its files are OpenWolf's hooks' job; refresh the map with `openwolf scan` and
  look up fixes with `openwolf bug search` (there is no CLI to write cerebrum/buglog/memory, so
  outputty simply doesn't).
- `.claude/trails/<branch>.md` — the per-branch **spec thought-trail**; distilled into product.md at
  merge, then cold archive. Task breakdown + progress live beside it in `<branch>.tasks.jsonl` (the
  task graph), archived with it.
- `.claude/experts/<slug>.md` (+ `<slug>/` source cache) — per-lens expert **knowledgebase** for
  advanced grilling: footnoted, date-stamped findings an `outputty-expert` re-validates on load
  (disproven priors kept with *why*, never deleted) and refreshes each run, with every fetched source
  cached alongside so a footnote outlives its URL. Committed (shared, improves across sessions); read at
  panel-composition to reuse experts before inventing.
- `~/.claude/projects/<repo>/memory/` — Claude Code **native auto-memory** (v2.1.59+, agent-writable):
  topic files load on demand via a `MEMORY.md` index that is **itself injected at every session start** —
  keep it bounded, replace-don't-append. The home for a durable lesson the owners above missed: a
  process lesson, a chat-only gotcha or preference, a doc worth re-reading. The merge step's
  **retrospective** (build.md, run before the PR finalizes — and on escalated cycles too, where the
  lessons are richest) routes lessons here and mints a new skill *only* for a proven reusable procedure,
  consulting stored memory + Pocock's standard first (`skills/outputty/references/skill-minting.md`);
  the minted skill lands in `.claude/skills/` and rides the PR. No new memory surface; mirrors Hermes's
  tiering (bounded always-on index vs high-bar skill vs on-demand recall).

**Branch model + GitHub (prescribed).** One feature branch for the whole cycle. A **draft PR opens
at branch-cut**, before any work, so scoping (trail + product.md diff) and code are reviewed
together; the **BUILD workflow's commit stage** commits each task serially after its layer passes
review (verbose problem+solution message; parallel editors never commit into the shared checkout) and
pushes to the PR; it is marked ready and merged at the end. outputty enforces its tools on **real work, not the
session**: the `require-environment` PreToolUse guard denies file edits unless OpenWolf + git are
present (read-only work is never blocked), while the SessionStart hook **warns** about anything
missing (a runnable `openwolf` CLI, a GitHub remote, authenticated `gh` — the flow needs those) and
injects `hooks/protocol.md` (the flow + the always-on behavioural rules — verify-by-running, memory
routing, skepticism), which tells the agent to **read `product.md` itself** (or run `outputty-init` if
it's absent) rather than embedding it. It skips injection entirely for subagents (detected via the hook
input's `agent_type`), so only the main session pays for it.

**Brownfield.** `outputty-init` reconstructs `product.md` from existing docs, docstrings, and
(optional) commit messages: the user **multi-selects** which sources to scan, and the cheapest agent
(`scanner`, haiku) does the grunt scan, then it grills only the gaps. It writes product.md only —
navigation stays OpenWolf's job (`openwolf init` runs first).

**Guards (transferred).** A hands-off autonomous build needs deterministic safety rails
OpenWolf and the grill don't provide: four PreToolUse hooks — `require-environment`,
`block-dangerous-commands`, `scan-secrets`, and `guard-secret-files` — whose specific deny/ask
patterns live in [docs/security.md](docs/security.md). The BUILD QA gate is a single `outputty-qa` agent
per task (spec check → over-engineering review → any lenses) plus a final **master-QA** pass over the whole
diff vs `product.md`, green-gated at start and merge, with root-cause-before-retry. Diagrams are an **opt-in**
`outputty-diagram` skill — availability, never a mandate. `outputty-documentation` holds the README/doc
ruleset (front-load, routing-hub-not-manual, diagram-only-when-earned); the flow updates the README
through it, never by hand. `outputty-review` holds the author's pre-handoff definition-of-done + the
enforced PR-description format (template in `.github/pull_request_template.md`); it runs an over-engineering
review inline and defers docs to `outputty-documentation` rather than restating them. Everything else
stays delegated.

### Language

- **Layer** — the set of tasks whose deps are all done (`tasks.js ready`); **derived** from the task
  graph, not hand-authored. Layers run in sequence, tasks within one in parallel. (Not: wave.)
- **Task** — one unit of work with `deps` + `scope`, a line in the task graph; a retry is a second
  attempt, not a new task. (Not: ripple.)
- **Trail** — the per-branch spec thought-trail file. The task graph (`<branch>.tasks.jsonl`) lives
  beside it.
- **Product memory** vs **operational memory** — product = what/why (outputty, product.md);
  operational = how-to-work-efficiently (OpenWolf, `.wolf/`).

## What was tried

**Self-learning loop — merge-step retrospective (0.6.0, direct patch — no trail).** *Beginning state:*
the flow captured *product* decisions but not *process* learning — corrections, retries, docs fetched
evaporated at merge. *Problem:* carry lessons forward without growing injected context (the governing
principle). *Researched:* Hermes (bounded always-on memory with hard caps + a high-bar skill tier — "5+
tool calls, error recovery, a user correction, a non-obvious workflow that worked" — + a periodic
reflection nudge), Voyager (a skill enters the library only once *verified*), Reflexion (distil lessons,
never hoard trajectories), and the key discovery that **Claude Code ships native auto-memory**. *End
state:* a prose retrospective step in build.md's merge phase — the routing and tiering live in the
memory-boundary section above (single source). The journey carried two reversals worth keeping: a
dedicated `outputty-retro` skill was built first, then dropped (a skill's description is paid every
turn; a phase-file step costs zero standing context); the step first ran post-merge, then moved before
PR-finalize after a max-effort review found the post-merge slot contradicted the branch model (a minted
skill had no home), structurally excluded failed cycles from learning, and mis-stated auto-memory's
loading (the `MEMORY.md` index is per-session context, not free — the review also added the escalated-
cycle retro, the auto-memory fallback, and the always-on routing rule's fourth surface).

**Context-budget pruning pass (0.5.1, direct patch — no trail).** *Beginning state:* audited the plugin
against Matt Pocock's writing-great-skills principles (predictability, minimal standing context, single
source of truth, one-trigger-per-branch descriptions). Structure held up (phase-file disclosure, gated
completion criteria, leading words), but the standing-context ledger leaked: three bloated every-turn
skill descriptions (`outputty-review` ~150 words of quoted-phrase piles; `outputty-documentation`
restating its body's section order; `outputty-init` duplicating the trigger protocol.md already
injects), protocol.md opening with a 9-line flow digest duplicating SKILL.md/build.md BUILD internals
(already drifted — predating contract-first), the flagship SKILL.md restating the laziest-diff ladder
protocol.md injects in the same session, and build.md stating the ultracode/permission-mode launch
breakdown twice. *Problem:* every duplicate is paid context plus a drift surface. *End state:* the three
descriptions compressed to their trigger branches (~135 words off every turn), the protocol digest cut
to a 3-line pointer, the SKILL.md rule now points instead of restating, build.md states the launch
breakdown once. Deliberately kept: the diagram skill's inline component catalogue (every draw needs it),
build.md's protective anti-regression parentheticals, and the flagship `outputty` description's trigger
surface. The standing rule this encodes: **the flow's single-source map is SKILL.md + phase files;
injected surfaces (protocol, descriptions) point at it, never restate it.**

**Contract-first TDD in PLAN + BUILD (0.5.1 — no version bump).** *Beginning state:* the build was
test-*verified*, not test-*driven* — the executor led with the laziest-diff ladder and carried
"test-first" as one buried boundary bullet, and PLAN handed the executor a done-condition + scope but
no input/output interface, so the executor invented the shape as it went; QA only confirmed that *a*
fail→pass test existed. *Problem:* make the build genuinely TDD and let PLAN present the interface the
executor implements against. *End state:* tasks gained an optional **`contract`** field (input/output
shape + one worked input→output example), authored at PLAN and shown at the gate; the `outputty-builder`
charter promotes test-first to a first-class **"Start from the contract"** step (turn the example into a
failing test *before* the code) and disambiguates the laziest-diff "no interface with one implementation"
rule as banning *speculative* abstractions, not the handed-down contract; `outputty-qa` now checks the
change satisfies the contract via a test that exercises its example and fails without the change. Files:
`skills/outputty/{tasks,plan,build}.md`, `agents/outputty-builder.md`, `agents/outputty-qa.md`. Direct
patch (no trail).

**Absorb ponytail + build-time self-gate (0.5.0).** *Beginning state:* ponytail was a hard
cross-marketplace dependency, but only one thing used it at runtime — `outputty-qa` invoked the
`ponytail-review` skill — and the "prevent over-engineering at build time" half never reached the BUILD
executor (a bare invented prompt with no discipline; `session.js` gates `protocol.md` out of subagents).
*Problem:* own everything outputty needs from ponytail and drop the dependency, and actually wire
build-time prevention — without relying on a skill a subagent can skip. *End state:* a registered
**`outputty-builder`** agent now carries the boundary rules + the laziest-working-diff discipline + a
**self-gate** (validate own work against the done-condition with evidence, classify gaps, self-correct,
hand off only when green — the pattern from BuilderIO's `agent-watchdog`); the over-engineering review is
**inlined** into `outputty-qa` and `outputty-review` (no skill call to skip); the discipline is also
embedded in `protocol.md` for the main session. The declared dependency + cross-marketplace grant are
removed; ponytail and `agent-watchdog` are credited as inspiration in the README, not depended on. See
[trails/0013-absorb-ponytail-self-gate.md](trails/0013-absorb-ponytail-self-gate.md).

**Defensive-coding rules + README rewrite (0.4.1).** *Beginning state:* protocol.md had no
error-handling discipline, and the README opened by calling outputty "thin, deliberately unoriginal …
invents almost nothing" — untrue now that it ships an original expert-panel grill and a hands-off build
loop. *Problem:* codify the defensive-coding patterns worth stealing (from a survey of EspoTek's
CLAUDE.md) without bloating a lean protocol, and make the README's framing accurate. *End state:*
protocol.md gained a gated `## When you write code` section — fail-loud (no swallowed errors, no silent
sentinels, no silent defaults for external data), build-against-real-data-or-ask, impact-check-before /
diagnostics-after, non-destructive exploration, concurrent bulk I/O, progress on long ops. Skipped
EspoTek's "check `.env` for credentials" (conflicts with the `guard-secret-files` hook) and its
Python/`uv` tooling (not language-agnostic). README intro rewritten via the `outputty-documentation`
ruleset to lead with the flow and outputty's two own engines, still crediting OpenWolf / ponytail /
grill-with-docs. See [trails/0012-defensive-coding-and-readme.md](trails/0012-defensive-coding-and-readme.md).

**Expert panel by lens + accumulating knowledgebase (0.4.0).** *Beginning state:* advanced grilling
composed the expert slate "from the plan's scope clusters," so a small deep change produced 4
near-identical experts — different facets of one change, not different lenses — and every panel started
cold, experts holding no memory between runs. *Problem:* make expert selection produce distinct,
non-overlapping lenses and let expert knowledge compound across sessions. *End state:* the panel is
composed by **orthogonal risk-axis, not scope cluster** (collapse any two that catch the same class of
failure; canonical discipline slugs, not ad-hoc labels), with **4 as a hard ceiling that doubles as a
scope smell** — more than 4 lenses stops the panel and asks the user (`AskUserQuestion`, free-form) for
a narrower scope instead of growing it. Each `outputty-expert` now owns a durable
knowledgebase under `.claude/experts/`: `<slug>.md` with every claim **footnoted** to a source, priors
re-validated each run and — when disproven — **kept with the reason why, never deleted**, plus a
`<slug>/` cache of every source it fetched so a footnote outlives its URL. The composer reuses existing
experts before minting new. See [trails/0010-expert-knowledgebase.md](trails/0010-expert-knowledgebase.md).

**Response protocol — anchor/drift + lead-with-the-answer (0.4.0).** *Beginning state:* over long
sessions, tangents drifted from the session's one question without being tied back (context rot), and
substantial answers buried the conclusion under justification. *Problem:* codify both as standing
behaviour without firing on every turn. *End state:* `hooks/protocol.md` gained a `## When it matters —
trigger, don't drone` section (conditional, NOT always-on): an **anchor + drift-check** (pin the
original question; on a real drift STOP with a 3-line what/relation/pursue-park-drop summary, re-anchor
on return; one check per drift) and a **lead-with-the-answer (BLUF)** shape for substantial replies only
(solution → why → problem, then detail, then an at-a-glance table/diagram, then the rest, kept tight).
Confirmed via `/skill-creator` that these belong in the injected protocol, not a skill — they fire on
conversation state, not request phrasing. See [trails/0011-response-protocol.md](trails/0011-response-protocol.md).

**Bootstrap (this repo's design session).** *Beginning state:* four overlapping harness/memory
systems plus interest in adopting GitHub's spec-kit — fragmented, double-logging decisions, no
single spine. *Problem:* combining spec-kit + ponytail + OpenWolf + grill-with-docs without adding a
fifth competing system, and doing it with the fewest possible memory surfaces. *End state:* outputty
as a thin plugin that owns only the flow + one `product.md`, hard-requires OpenWolf for operational
memory/token discipline, depends on ponytail for build laziness, and reuses grill-with-docs as its
SPEC engine — everything else delegated, nothing reinvented. See
[trails/0001-bootstrap.md](trails/0001-bootstrap.md).

**Brownfield + GitHub (0002).** *Beginning state:* outputty assumed greenfield and left GitHub use
implicit. *Problem:* brownfield repos need their knowledgebase reconstructed from existing artifacts,
and the workflow needed explicit GitHub discipline. *End state:* added `outputty-init` (user
multi-selects docs/docstrings/commit-messages → cheapest `scanner` agent → draft product.md →
targeted grilling), a draft-PR-at-branch-cut workflow, git+remote checks in the SessionStart hook,
and verbose problem/solution commit messages. See
[trails/0002-brownfield-and-github.md](trails/0002-brownfield-and-github.md).

**Enforce on real work (0005).** *Beginning state:* the SessionStart gate "refused all work" every
session — advisory-only (a SessionStart hook can't deny), and it bricked read-only/CI sessions in
non-conforming repos. *Problem:* make real work reliably use OpenWolf/git/GitHub without blocking
read-only. *End state:* SessionStart now warns + injects; a new `require-environment` PreToolUse guard
denies file edits unless OpenWolf + git are present (real enforcement, cheap `fs` checks), and the
flow asserts the remote + `gh`. Read-only is never blocked. See
[trails/0005-enforce-on-real-work.md](trails/0005-enforce-on-real-work.md).

**Transferred patterns (0004).** *Beginning state:* a reverse-audit + a comparison against superpowers
and a real prod `.claude` config surfaced patterns worth pulling in. *Problem:* transfer the genuinely
general, high-leverage ones without bloating a deliberately lean plugin. *End state:* added the safety
hooks (the one thing no delegate covered, and a fix for the audit's autonomous-build gap), an opt-in
`outputty-diagram` skill (generalized from the prod diagrams skill), and low-surface QA-gate +
behaviour rules (test-first, two-stage review, green-gate, root-cause-before-retry, skepticism,
correction-routing). Skipped everything that duplicated ponytail/OpenWolf/grill (code-review,
debugging, architecture skills, agent roles, worktrees). Also made `outputty-init` scan depth
user-selectable ([0003](trails/0003-init-scan-depth.md)). See
[trails/0004-transferred-patterns.md](trails/0004-transferred-patterns.md).

**BUILD as a dynamic workflow (0006).** *Beginning state:* BUILD was a phase file that fanned out
`task-runner` subagents turn-by-turn with a fixed executor+QA pair, and the orchestrator committed
each task serially. *Problem:* the user wanted BUILD to run as a real Claude Code **dynamic
workflow** driven by the approved layers, with subagent **roles invented per task** rather than a
rigid archetype. *End state:* BUILD is now a dynamic workflow Claude authors each run from the layers
(`args`); a CAST step invents the executor + task-fit reviewer roles as prompts (not registered
types), the executor edits the shared checkout under a fixed two-rule prefix (in-scope only, no git —
no registered agent; `task-runner` was dropped as redundant), layer non-overlap replaces worktree
isolation, reviewers QA in parallel, and passed tasks commit serially **inside** the workflow (agents
can run git, so no return-then-replay contract). Executors + commits run Sonnet 5 / medium; CAST +
reviewers inherit the session model (strong QA). No
turn-by-turn fallback — workflows are required. See
[trails/0006-build-as-dynamic-workflow.md](trails/0006-build-as-dynamic-workflow.md).

**Documentation skill + README rewrite (0007).** *Beginning state:* the README had grown into a
manual — enforcement mechanics above install, a memory-boundary table, a full permissions-JSON dump,
and a file tree — duplicating `product.md` and burying the value. *Problem:* codify a generalized
README ruleset and rewrite the README to it. *End state:* a research fan-out (top repos + technical
writing) plus a 3-lens adversarial pass (which caught CLI/library over-fit + bloat) produced
`outputty-documentation` — a generalized ruleset (concrete-beats-comprehensive: front-load the
what-is-it, prove it runs, teach core concepts code-first, then architecture; a concrete anti-slop
section; route out only exhaustive reference; diagram-only-when-earned). The README was rewritten to a routing hub with one
`outputty-diagram` flow SVG; internals were routed to `product.md` and `docs/security.md` — an
adversarial self-review caught residual duplication (a memory table, a permissions-JSON dump, a file
tree) and it was cut, not just hidden in `<details>`. The `outputty` skill now routes README updates
through the ruleset (standing rule + build merge step). See
[trails/0007-documentation-skill.md](trails/0007-documentation-skill.md).

**Beads-lite task graph + workflow/OpenWolf fixes (0008).** *Beginning state:* PLAN hand-authored
LAYERS as prose in the trail; BUILD's phase file described a dynamic workflow but was run as
turn-by-turn subagent dispatch in practice ("a list of subagents, not a workflow"); and the flow
instructed manual edits to OpenWolf's `.wolf/` files. *Problem:* make task breakdown + progress a
queryable dependency graph (staying maximally hands-off), make BUILD a real Claude Code dynamic
workflow, and stop outputty hand-writing OpenWolf's files. *End state:* a native **beads-lite** task
graph — a per-branch `.tasks.jsonl` + a small CommonJS `tasks.js` (`ready`/`schedule`/`add`/`close`) that
derives layers from a dependency graph and folds in the old non-overlap check (adopted the beads
*model*, not the `bd` tool — two research sweeps found every adopter values only `bd ready`, and its
memory subsystem would fight OpenWolf; a hard dep on the alpha binary was rejected). BUILD is reframed
as a single **Workflow-tool** call (no subagent-dispatch fallback) that reads its layers from
`schedule` and drains discovered-from work. OpenWolf interaction is reduced to reads + `openwolf
scan`/`bug search` — outputty never writes `.wolf/` (verified there is no CLI to write
cerebrum/buglog/memory). Review stays a hands-off post-build step: PR comments become tasks that a
re-invoked BUILD drains before merge. See [trails/0008-beads-lite.md](trails/0008-beads-lite.md).

**BUILD args hardening (0.2.1).** *Beginning state:* `build.md` passed the layer plan to the Workflow
tool via `args = { layers, testCmd, plugin }`, and the reference script read `args.layers`. *Problem:*
a parallel-edit smoke test proved inline `args` can reach the workflow script as a JSON **string**, so
`args.layers` is undefined and the run crashes on the first line
(`undefined is not an object (evaluating 'args.files.map')`). *End state:* `build.md` now embeds the
`schedule --json` layers and the plugin path **directly in the authored script as literals** (a
`LAYERS` const, `bd` with the resolved plugin root) — never via `args`. The orchestrator computes both
just before launch anyway, so nothing is lost. Direct patch (no trail).

**Workflow-trigger accuracy + verify-every-claim rule (0.2.2).** *Beginning state:* `build.md` framed
BUILD as hands-off simply by "calling the Workflow tool," implying the skill self-triggers the dynamic
workflow. *Problem:* validated against the Claude Code docs — that's wrong. A dynamic workflow is a
**user opt-in** (`Workflow` is a real built-in tool, but it fires from the user's prompt keyword
`ultracode` / "use a workflow", or `/effort ultracode` — not from a skill's text), and in normal
permission modes every launch shows a one-time approval card; it's silent only under
`ultracode`/bypass/`-p`/SDK. *End state:* `build.md` now says the **user launches** BUILD (via
`ultracode`, which both triggers it and skips the approval → unattended), fixes the "only interruption"
line, and Flow reflects the user-launch reality. Also added a **non-negotiable rule** to
`outputty-grill` + the `outputty` skill: validate every factual/technical claim against a
proactively-found source (web, or the actual installed package/code) — never assert from memory. This
came from a repeated pattern of confident-but-wrong claims. Direct patch (no trail).

**Permission-mode accuracy for BUILD launch (0.2.3).** *Beginning state:* the 0.2.2 fix said `ultracode`
"both triggers the workflow and skips the approval → unattended," and that normal modes show a
"one-time approval card." *Problem:* re-validated against the workflows docs' permission-mode table —
that's wrong. `ultracode` skips the launch prompt only in **auto** mode; in **default / accept-edits**
the prompt shows on *every* run until the user picks "Yes, and don't ask again for this workflow in this
project," and only **bypass / `claude -p` / Agent SDK** never prompt. *End state:* `build.md` and Flow
now state that unattended-from-run-one depends on permission mode (bypass/`-p`/SDK, or auto + `ultracode`),
not `ultracode` alone, and note that non-allowlisted shell/web/MCP calls can also prompt mid-run
([docs](https://code.claude.com/docs/en/workflows#approve-the-plan-before-it-runs)). Found by an audit
that validated every Claude-side claim in the plugin against official docs. The same audit also added an
**Update** section to the README (manual `/plugin marketplace update` → `/plugin update` → `/reload-plugins`,
plus enabling per-marketplace auto-update — off by default for third-party marketplaces; the
`marketplace.json` `version` is the cache key, verified against
[plugins-reference](https://code.claude.com/docs/en/plugins-reference#version-management)). Direct patch (no trail).

**Grill fan-out pinned to Opus/medium (0.2.5).** *Beginning state:* the advanced-grill workflow fanned
out `outputty-expert`/`outputty-adversary` with **no per-call model**, so both inherited the session —
Sonnet on a Sonnet session, Opus-at-xhigh under `ultracode` — the same silent-inheritance trap as
0.2.3's BUILD executors (below). A smoke-test run (expert + adversary in parallel, each echoing its
task) confirmed it: their transcript `meta.json` carried only `agentType`, no model, so they ran on the
session model. *End state:* the `outputty-grill` skill's advanced mode now pins the fan-out per-call to
`{ model: 'opus', effort: 'medium' }` — grilling is the plan's stress test, so it gets a fixed strong
model at controlled effort, never the session's whim. Frontmatter `model` can't carry this (moot inside
a workflow; honored only for interactive Agent-tool dispatch). BUILD's CAST + reviewers deliberately
still inherit (their QA stays as strong as the session). *Source:*
[0009-grill-model-pin](.claude/trails/0009-grill-model-pin.md).

**Advanced grilling as a dynamic workflow + agent-registration finding (0.2.4).** *Beginning state:*
grilling was simple-only; advanced grilling was designed to run an expert/adversary panel, and it was
unclear whether a dynamic workflow could call custom agents. *What was found (empirically, restart
included):* a workflow — and the in-session Agent tool — selects an agent by its registered `agentType`,
and **the registry here holds only built-in + installed-plugin agents; project `.claude/agents/` files
are never loaded** (this runs inside the Claude Agent SDK, which supplies agents programmatically). Two
probe workflows confirmed it: custom project agents returned "not found" even after a restart, while
`general-purpose`/`claude-code-guide` ran fine. *End state:* the two panel agents ship as **plugin**
agents — [`agents/outputty-expert.md`](agents/outputty-expert.md) and
[`agents/outputty-adversary.md`](agents/outputty-adversary.md), read-only + cite-or-drop; advanced
grilling is defined in the `outputty-grill` skill (offer after grounding → Why/What/How → panel as one
dynamic workflow → session synthesizes); the README gained a **How grilling works** section documenting
the workflow and the plugin-agent-registration gotcha; and the diagram-skill flowchart now shows BUILD's
**layer loop** explicitly. Direct patch (no trail).

**Workflow agents silently ran full-Opus, not Sonnet (0.2.3).** *Beginning state:* `build.md` said
"every agent pinned to Sonnet 5 / medium" via a single `PIN` const spread onto every `agent()` call.
*Problem:* a session analysis of a real BUILD run found all four agents on `claude-opus-4-8` at xhigh
(~244k tokens) — the authored script had dropped the per-call `PIN`, and (verified against the Workflow
tool spec + [workflows §Cost](https://code.claude.com/docs/en/workflows#cost)) a workflow agent with no
`model`/`effort` **inherits the session model+effort**, which under `ultracode` is Opus-at-xhigh. The
pin fails silently in the *expensive* direction. *End state:* split into two tiers — executors + commit
are explicit `{ model:'sonnet', effort:'medium' }`, while CAST + reviewers inherit the session so the
hands-off build's only QA safety net stays strong (a dropped executor override only costs more, never
weakens review) — plus a launch step to verify the generated script's routing (**View raw script** at
the approval card, or open the saved script and relaunch). Direct patch (no trail).

**BUILD efficiency overhaul — CAST dropped (0.2.6).** *Beginning state:* a parsed audit of a real
59-agent BUILD run found ~45% of it wasted re-doing already-correct work — the commit-gate bug (commit
agents refused on the always-dirty `.wolf/` tree, `runLayer` never checked, so the drain re-ran open
originals; fixed in [build.md](skills/outputty/build.md)). Structural waste survived even without it: a
per-task CAST agent explored files the executor then re-explored (~32% of cache), every reviewer re-ran
the suite (36 test + 45 typecheck runs for 5 tasks), and each agent paid a ~41k-token boot floor.
*Problem:* cut the waste without weakening the QA gate that had worked perfectly. *End state:* **CAST
dropped** — the executor is static and PLAN names any specialized review `lenses` per task (new optional
task-graph field), so the review plan is visible at the PLAN gate instead of invented per task; the
review panel is static (spec + `ponytail-review` + named lenses) and **only the spec reviewer re-runs
the suite** (the rest read the task's scoped diff, never running tests); **one commit agent per layer**
replaces one-per-task; and the drain builds only `discovered_from` tasks, escalating if an original
resurfaces. Direct patch (no trail).

**Verify-by-running rule + `outputty-review` skill (0.2.7).** *Beginning state:* the "verify, don't
assert" rule said validate claims against a proactively-found source — but in practice claims about tool
behaviour got theorised instead of tested (e.g. whether a subagent can be pinned to Sonnet 4.6), and the
plugin had no home for an author's pre-handoff definition-of-done or a PR-description standard. *Problem:*
make empirical validation the reflex, and add a self-review + PR-writeup capability without duplicating
ponytail/OpenWolf/documentation. *End state:* the "verify" standing rule (in `outputty` + `outputty-grill`)
now leads with **run the cheapest reproducing command FIRST**, only reaching outward to a source when a
run can't answer — general, not skill-specific (this settled the 4.6 question in one agent-run: Sonnet 4.6
is real but the subagent `model` param is family-only, `sonnet|opus|haiku|fable`). And a new
**`outputty-review`** skill holds the definition-of-done gate + the enforced PR-description format
(template in `.github/pull_request_template.md`), deferring simplification to `ponytail-review` and docs
to `outputty-documentation`. Direct patch (no trail).

**BUILD cost cut, round 2 — single QA agent + Haiku executor (0.2.8).** *Beginning state:* after CAST
was dropped (0.2.6) the audit's remaining fat stood — three reviewer agents per task each re-read the
diff and re-ran the suite, the ~500-word brief was re-embedded across every agent, executors ran Sonnet
even for trivial work, and outputty's own SessionStart injection (~3k tokens) plausibly hit every
subagent. *Problem:* cut the per-task agent count and the boot cost without weakening the QA gate.
*End state:* the three reviewers collapse into **one `outputty-qa` plugin agent** (Sonnet) that runs
spec → `ponytail-review` → lenses in sequence on the scoped diff and returns one verdict — the check
sequence lives in the agent's charter, so the workflow supplies only specifics. The **executor now
defaults to Haiku**, rising to Sonnet only for `complex` tasks (a new task-graph field) or the retry;
the commit agent is Haiku and takes the task title + work summary, not the re-embedded brief; PLAN is
told to keep briefs to a few lines. And `session.js` **skips its injection for subagents** (detected via
the hook input's `agent_type`) — a no-op if plugin SessionStart never fires for subagents, a
~3k-per-subagent saving if it does (the gate was proven by running the hook with a subagent payload).
The subagent `model` param is family-only (`haiku`/`sonnet`/`opus`/`fable`) — no pinned sub-version, so
"Sonnet 4.6 executors" isn't expressible; Haiku-default with Sonnet-escalation is. Direct patch (no
trail).

**Always-on rules centralised in an injected protocol file (0.2.9).** *Beginning state:* the SessionStart
hook inlined its protocol text as a JS string, and the genuinely-universal behavioural rules
(verify-by-running, memory routing, skepticism) lived in the `outputty` + `outputty-grill` skill bodies —
so they only entered context when a skill triggered, not every turn. *Problem:* make the always-applicable
rules always present, and make the protocol editable as prose. *End state:* the protocol moved to
`hooks/protocol.md` (session.js reads it, as it already reads product.md), gaining an **Always-on rules**
section; the now-duplicate rules were trimmed from the `outputty` skill to a pointer. Because the hook
skips injection for subagents, only the main session pays for the richer md — subagents get their rules
from their own charters (e.g. `outputty-qa`). A follow-up flattened `session.js` into
functions-called-in-sequence (no nested ifs), extracted every remaining inline string to its own md
(`env-incomplete.md`, `protocol.md`), and stopped embedding `product.md` — the protocol now tells the
agent to Read it (or run `outputty-init` if absent), so the hook injects one file and the main
session's floor drops. Verified by running the hook across all three paths (main, subagent, incomplete
env). Direct patch (no trail).

**Master QA + flow-diagram restructure (0.2.10).** *Beginning state:* the flow diagram (and README)
showed a "Master QA · whole diff vs product.md" step that build.md never implemented, and the BUILD
region coiled the whole layer loop plus master QA into one squished container. *Problem:* make the
graph truthful and readable. *End state:* build.md gained a real **master QA** step — after the graph
drains, one Sonnet agent checks the whole build diff against `product.md` (North Star + Architecture)
and escalates on drift the scoped per-task QA can't see. The `outputty-diagram` skill gained a
**Sections & loops** rule (a loop inside a bigger process spans distinct sections, with the loop-back
as an inter-section arrow; never squish distinct stages into one box), and `flow.svg` was redrawn to
it: distinct Build-loop → Build → Post-build (last layer?) → Master QA → Merge stages, the loop-back
arrow rejoining the build-loop→build arrow. A follow-up formalised the **section-band standard** (every
section = a left label + full-width rule, like SPEC/PLAN) and a **Components** catalogue of copy-paste
SVG snippets in the diagram skill, then rebuilt `flow.svg` to it — the ad-hoc indented sub-labels became
proper bands (`BUILD · LAYER LOOP`, `BUILD · RUN LAYER`, …) and the whole SVG is organised into
`<g id="section-…">` groups. Verified by rendering the SVG. Direct patch (no trail).
