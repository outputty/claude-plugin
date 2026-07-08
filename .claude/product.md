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

**Shape.** A Claude Code plugin mirroring ponytail's layout (single-plugin marketplace, `source:
"./"`, one `marketplace.json` in `.claude-plugin/` carrying the plugin entry). Lives at
`F:/outputty/claude-plugin`.

**The three layers it stacks on:**
- **ponytail** — HOW to build (laziest working diff). A hard cross-marketplace dependency
  (allowlisted); auto-installs with outputty.
- **OpenWolf** — token discipline + operational memory (`anatomy.md` = navigation, `cerebrum.md` =
  preferences/gotchas, `buglog.json` = bugs). A **hard requirement**, enforced by the SessionStart
  hook (it can't be a manifest dependency — it's a CLI, not a plugin).
- **outputty** — the flow (spec → plan → build) + product memory (this file).

**Flow.** One entry skill (`outputty`) drives three phases, reading a phase file on demand
(progressive disclosure). SPEC and PLAN are gated. PLAN writes a **task graph** — a per-branch
`.tasks.jsonl` of tasks with `deps` — and `tasks.js schedule` **derives** the LAYERS from it (no
hand-authored layers; a same-layer scope clash fails loud as a missing dep). **BUILD runs as a
single Claude Code dynamic workflow (the `Workflow` tool)** — never turn-by-turn subagent dispatch —
that Claude authors each run from those layers: per task a CAST step invents the executor + task-fit
reviewer roles (prompts, not registered agent types), the executor edits the shared checkout
(non-overlapping layer scopes make worktrees unnecessary), reviewers QA in parallel, passed tasks
commit serially inside the workflow and are marked done in the graph, and a drain loop builds any
discovered-from work. Executors and commits run on Sonnet 5 / medium; CAST and reviewers inherit the
session model (the QA gate stays as strong as the session). Double failure escalates. A
workflow can't pause for input — which is exactly why only BUILD is one and the gated phases stay in
the session. The workflow is **launched by the user** — a dynamic workflow triggers from the user's
prompt (`ultracode` / "use a workflow") or `/effort ultracode`, not from the skill. Whether the launch
*also* runs without an approval prompt is the user's permission mode's call: bypass / `claude -p` / SDK
never prompt, auto-mode skips it when `ultracode` is on, and default / accept-edits prompt once per
workflow (until "don't ask again"). So unattended-from-run-one needs bypass / `-p` / SDK or
auto + `ultracode`; in default mode the user OKs the first launch.

**Memory boundary (the anti-double-log line):**
- `.claude/product.md` — North Star + Architecture + What was tried. Loaded as initial context by
  the SessionStart hook. Decisions live here **only**.
- OpenWolf's `.wolf/` — navigation, gotchas, bugs. Never decisions. **outputty reads it but never
  writes it by hand** — its files are OpenWolf's hooks' job; refresh the map with `openwolf scan` and
  look up fixes with `openwolf bug search` (there is no CLI to write cerebrum/buglog/memory, so
  outputty simply doesn't).
- `.claude/trails/<branch>.md` — the per-branch **spec thought-trail**; distilled into product.md at
  merge, then cold archive. Task breakdown + progress live beside it in `<branch>.tasks.jsonl` (the
  task graph), archived with it.

**Branch model + GitHub (prescribed).** One feature branch for the whole cycle. A **draft PR opens
at branch-cut**, before any work, so scoping (trail + product.md diff) and code are reviewed
together; the **BUILD workflow's commit stage** commits each task serially after its layer passes
review (verbose problem+solution message; parallel editors never commit into the shared checkout) and
pushes to the PR; it is marked ready and merged at the end. outputty enforces its tools on **real work, not the
session**: the `require-environment` PreToolUse guard denies file edits unless OpenWolf + git are
present (read-only work is never blocked), while the SessionStart hook **warns** about anything
missing (a runnable `openwolf` CLI, a GitHub remote, authenticated `gh` — the flow needs those) and
injects only the North Star + Architecture (not the unbounded "What was tried" log).

**Brownfield.** `outputty-init` reconstructs `product.md` from existing docs, docstrings, and
(optional) commit messages: the user **multi-selects** which sources to scan, and the cheapest agent
(`scanner`, haiku) does the grunt scan, then it grills only the gaps. It writes product.md only —
navigation stays OpenWolf's job (`openwolf init` runs first).

**Guards (transferred).** A hands-off autonomous build needs deterministic safety rails
ponytail/OpenWolf/grill don't provide: four PreToolUse hooks — `require-environment`,
`block-dangerous-commands`, `scan-secrets`, and `guard-secret-files` — whose specific deny/ask
patterns live in [docs/security.md](docs/security.md). The BUILD QA gate is two-stage (test-first spec check → `ponytail-review`
quality), green-gated at start and merge, with root-cause-before-retry. Diagrams are an **opt-in**
`outputty-diagram` skill — availability, never a mandate. `outputty-documentation` holds the README/doc
ruleset (front-load, routing-hub-not-manual, diagram-only-when-earned); the flow updates the README
through it, never by hand. Everything else stays delegated.

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
`outputty-documentation` — a lean, generalized ruleset (front-load, routing-hub-not-manual,
proof-of-life, diagram-only-when-earned). The README was rewritten to a routing hub with one
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
