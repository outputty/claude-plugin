# outputty — Product

> Single source for what outputty is and why. Living document: pruned, not append-only.
> Business intent under North Star, technical under Architecture. Decisions never live in OpenWolf.

## North Star

A **single spec-driven work harness applied to every project**, delivered as a Claude Code plugin so
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
"./"`, both manifests in `.claude-plugin/`). Lives at `F:/outputty/harness`.

**The three layers it stacks on:**
- **ponytail** — HOW to build (laziest working diff). A hard cross-marketplace dependency
  (allowlisted); auto-installs with outputty.
- **OpenWolf** — token discipline + operational memory (`anatomy.md` = navigation, `cerebrum.md` =
  preferences/gotchas, `buglog.json` = bugs). A **hard requirement**, enforced by the SessionStart
  hook (it can't be a manifest dependency — it's a CLI, not a plugin).
- **outputty** — the flow (spec → plan → build) + product memory (this file).

**Flow.** One entry skill (`outputty`) drives three phases, reading a phase file on demand
(progressive disclosure) and fanning out to `task-runner` subagents for the build — the proven
feature-dev pattern, not skill-to-skill chaining (which saves no context and isn't a real
primitive). SPEC and PLAN are gated; BUILD is hands-off with a double-failure escalation.

**Memory boundary (the anti-double-log line):**
- `.claude/product.md` — North Star + Architecture + What was tried. Loaded as initial context by
  the SessionStart hook. Decisions live here **only**.
- OpenWolf's `.wolf/` — navigation, gotchas, bugs. Never decisions.
- `.claude/trails/<branch>.md` — transient per-branch scoping trail; distilled into product.md at
  merge, then cold archive.

**Branch model + GitHub (prescribed).** One feature branch for the whole cycle. A **draft PR opens
at branch-cut**, before any work, so scoping (trail + product.md diff) and code are reviewed
together; the **orchestrator** commits each task serially after its layer passes QA (verbose
problem+solution message; parallel workers never commit into the shared checkout) and pushes to the
PR; it is marked ready and merged at the end. The SessionStart hook hard-blocks any session unless
OpenWolf (`.wolf/` **and** a runnable `openwolf` CLI), git, and a **GitHub** remote with authenticated
`gh` are all present — verifying capabilities, not proxies — and injects only the North Star +
Architecture (not the unbounded "What was tried" log).

**Brownfield.** `outputty-init` reconstructs `product.md` from existing docs, docstrings, and
(optional) commit messages: the user **multi-selects** which sources to scan, and the cheapest agent
(`scanner`, haiku) does the grunt scan, then it grills only the gaps. It writes product.md only —
navigation stays OpenWolf's job (`openwolf init` runs first).

**Guards (transferred).** A hands-off autonomous build needs deterministic safety rails
ponytail/OpenWolf/grill don't provide: three PreToolUse hooks — `block-dangerous-commands` (deny
`rm -rf /`, `reset --hard`, force-push, `DROP`/`DELETE`-without-`WHERE`; ask on push-to-main),
`scan-secrets` (ask on credential patterns in writes), `guard-secret-files` (deny `.env`/`*.pem`/
`*.key`/`credentials.json`). The BUILD QA gate is two-stage (test-first spec check → `ponytail-review`
quality), green-gated at start and merge, with root-cause-before-retry. Diagrams are an **opt-in**
`outputty-diagram` skill — availability, never a mandate. Everything else stays delegated.

### Language

- **Layer** — a batch of tasks with no unmet dependencies, run in parallel. (Not: wave.)
- **Task** — one unit of work = one subagent dispatch; a retry is a second task. (Not: ripple.)
- **Trail** — the per-branch scoping/thought-trail file. Layers live inside a trail.
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

**Brownfield + GitHub (0002).** *Beginning state:* the harness assumed greenfield and left GitHub use
implicit. *Problem:* brownfield repos need their knowledgebase reconstructed from existing artifacts,
and the workflow needed explicit GitHub discipline. *End state:* added `outputty-init` (user
multi-selects docs/docstrings/commit-messages → cheapest `scanner` agent → draft product.md →
targeted grilling), a draft-PR-at-branch-cut workflow, git+remote checks in the SessionStart hook,
and verbose problem/solution commit messages. See
[trails/0002-brownfield-and-github.md](trails/0002-brownfield-and-github.md).

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
