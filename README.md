# outputty

A single **spec-driven Claude Code plugin** for every project. It
sequences work as **grill → plan → hands-off build**, and leans on tools you already have instead of
reinventing them:

- **ponytail** (dependency) — HOW code gets built: the laziest working diff.
- **OpenWolf** (required) — token discipline + operational memory (`anatomy`/`cerebrum`/`buglog`).
- **grill-with-docs** (bundled as `outputty-grill`) — the interview engine behind the SPEC phase.

outputty itself owns only the flow and one product doc. See [`.claude/product.md`](.claude/product.md)
for the full design (it's dogfooded — outputty scoped itself with its own conventions).

## Requirements

outputty enforces its tools on **real work**, not on the session — read-only work (reading,
searching, answering) is never blocked. A `require-environment` **PreToolUse guard denies file edits**
unless both are present:

- **OpenWolf** initialised (`openwolf init`) — and the `openwolf` CLI on PATH (the SessionStart hook
  warns if `openwolf --version` doesn't run). It's a CLI, not a plugin dependency.
- **git** initialised.

The full flow additionally needs a **GitHub remote + authenticated `gh`** (for the draft PR from
branch-cut): the SessionStart hook warns when they're missing, and the flow asserts them when a
feature starts.

## Install

```
claude plugin marketplace add F:/outputty/claude-plugin  # or your private GitHub URL
claude plugin install outputty                          # pulls ponytail automatically
```

Then, once, remove the standalone copy so there's one source of the grilling engine:

```
rm -rf ~/.claude/skills/grill-with-docs
```

## Use

**Brownfield repo (no `product.md` yet)?** Run `/outputty-init` once — it reconstructs `product.md`
from your docs, docstrings, and (optionally) commit messages, then grills the gaps.

For features: just describe the work — the `outputty` skill triggers on feature/change
requests. Or `/outputty <what you want>`. Grill anything ad hoc with `/outputty-grill`.

The flow, one feature branch:

0. **Branch + draft PR** — cuts `feature/<x>` and opens a **draft PR before any work**, so scoping
   and code are reviewed together.
1. **SPEC** *(gated)* — grills **business** then **technical** goals as distinct passes; logs a
   thought-trail; resolves decisions into `product.md`.
2. **PLAN** *(gated)* — decomposes into **layers** of **tasks**; you OK it.
3. **BUILD** *(hands-off)* — one `task-runner` subagent per task, layer by layer; QA gate; retries a
   failed task once; escalates only on a double failure. Commits are verbose (problem + solution).
4. **Merge step** — distills the trail into `product.md` (pruned), appends **What was tried**, marks
   the PR ready, merges.

## Memory boundary

| lives in | owns |
| --- | --- |
| `.claude/product.md` | North Star + Architecture + What was tried. **Decisions only here.** |
| `.claude/trails/<branch>.md` | transient per-branch scoping trail (thought-trail + plan) |
| OpenWolf `.wolf/` | navigation (`anatomy`), gotchas/prefs (`cerebrum`), bugs (`buglog`) |

Never duplicate a decision into OpenWolf's cerebrum, and never put product vision into cerebrum — it
is read before every code-gen and must stay lean.

## Safety

BUILD runs shell and git autonomously, so PreToolUse hooks guard it: `require-environment.js` (deny
edits unless OpenWolf + git are present), destructive-command denial
(`block-dangerous-commands.js` — `rm -rf /`, `reset --hard`, force-push, `DROP`/`DELETE`-without-`WHERE`;
asks on push-to-main), secret-content scanning on writes (`scan-secrets.js`), and secret-file blocking
(`guard-secret-files.js` — `.env`, `secrets/`, `*.pem`, `*.key`, `credentials.json`). For defense in
depth, add a secret-file permission deny-list to your
`settings.json` (a plugin can't ship permissions itself):

```json
{ "permissions": { "deny": [
  "Read(**/.env)", "Read(**/.env.*)", "Read(**/secrets/**)", "Read(**/*.pem)", "Read(**/*.key)", "Read(**/credentials.json)",
  "Write(**/.env)", "Write(**/secrets/**)", "Edit(**/.env)"
] } }
```

> This deny-list is intentionally stricter than the `guard-secret-files` hook — it also blocks
> `.env.example`-style templates. Drop `Read(**/.env.*)` if you need templates readable.

## Layout

```
claude-plugin/
├── .claude-plugin/marketplace.json            single manifest: plugin entry + ponytail dep + allowlist
├── hooks/
│   ├── hooks.json                              SessionStart + PreToolUse wiring
│   ├── session.js                              warn on missing OpenWolf-CLI/git/GitHub+gh; inject protocol + product.md
│   ├── require-environment.js                  deny file edits unless OpenWolf + git are present
│   ├── block-dangerous-commands.js             deny destructive shell; ask on push-to-main
│   ├── scan-secrets.js                         ask on credential patterns in writes
│   └── guard-secret-files.js                   deny .env/secrets/*.pem/*.key/credentials.json
├── skills/
│   ├── outputty/{SKILL,spec,plan,build}.md     orchestrator + on-demand phase files
│   ├── outputty-init/SKILL.md                  brownfield bootstrap (reconstruct product.md)
│   ├── outputty-grill/SKILL.md                 the interview engine
│   └── outputty-diagram/SKILL.md + examples/   opt-in SVG diagram skill
├── agents/{task-runner,scanner}.md             haiku build + scan subagents
└── .claude/{product.md, trails/}               dogfooded design
```
