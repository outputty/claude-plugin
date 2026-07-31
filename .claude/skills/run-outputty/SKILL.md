---
name: run-outputty
description: Run, test, evaluate, and drive the outputty Claude Code plugin — exercise its hooks, the tasks.js graph engine, and the green gate. Use when asked to run outputty, test the plugin, check the hooks, verify a hook change, evaluate the plugin, or smoke-test before shipping.
---

# run-outputty

outputty is a **Claude Code plugin**, not an app: 48 markdown files, 7 hook scripts, and one graph
engine. There is no GUI, no server, and nothing to open. Its executable surface is two things:

- **7 hook scripts** that speak the Claude Code hook protocol — JSON on stdin, JSON or prose on stdout,
  exit code as the verdict.
- **`skills/outputty/tasks.js`** — the dependency-graph engine BUILD drains into layers.

Both are pure processes, so you drive the plugin by feeding them payloads. **`driver.mjs` does that**:
28 checks across the hook contracts, the graph engine, the config↔disk wiring, and the green gate.

All paths below are relative to the repo root.

## Prerequisites

Node ≥ 22 (built and verified on v26.5.0) and the dev dependencies:

```bash
npm install
```

`pnpm-lock.yaml` is committed, but `npm install` works and is what the driver's gate suite invokes.
No system packages, no browser, no display — nothing here renders.

## Run (agent path) — the driver

```bash
node .claude/skills/run-outputty/driver.mjs
```

Expected tail on a healthy tree:

```text
GATE
  PASS  prettier: every tracked file is formatted
        62 tracked files clean
  PASS  oxlint: no errors
        clean

28/28 passed
```

Exit 0 = all passed; exit 1 = at least one failed, and each failure prints what it expected. Run one
suite when iterating:

```bash
node .claude/skills/run-outputty/driver.mjs hooks    # 16 hook-contract checks
node .claude/skills/run-outputty/driver.mjs tasks    # 6 graph-engine checks
node .claude/skills/run-outputty/driver.mjs wiring   # 4 hooks.json ↔ disk checks
node .claude/skills/run-outputty/driver.mjs gate     # prettier + oxlint
```

**Editing a hook? Run `hooks` before anything else.** It catches the failure modes that are invisible
in review: a hook that exits non-zero (which blocks the tool call it guards), one that crashes on
malformed stdin, one that emits a `permissionDecision` when it should only add context, and a
`memory-recall` that resolves its directory from `cwd` instead of the git root.

## Drive a single hook by hand

Every hook is `JSON in → JSON out`, so you can poke one directly. This is the fastest loop when
tuning a pattern:

```bash
echo '{"prompt_text":"no, that is not what I asked for"}' | node hooks/correction-signal.js
echo '{"prompt_text":"do not add a dependency for this"}' | node hooks/correction-signal.js
```

The first prints a `hookSpecificOutput` block; the second prints nothing (exit 0). That pair is the
whole precision contract — a correction fires, an ordinary instruction does not.

## Run the graph engine

```bash
node skills/outputty/tasks.js schedule --json
```

Outside a branch with a task file it errors by design. Point it at any graph with `OUTPUTTY_TASKS`:

```bash
printf '%s\n' \
  '{"id":"t1","title":"base","status":"open","deps":[],"scope":["a.ts"]}' \
  '{"id":"t2","title":"on t1","status":"open","deps":["t1"],"scope":["b.ts"]}' > /tmp/g.jsonl
OUTPUTTY_TASKS=/tmp/g.jsonl node skills/outputty/tasks.js schedule --json
```

## Test

```bash
npm test        # tasks.js self-check
npm run lint    # oxlint
npm run format:check
```

## Gotchas

- **Repo edits do not affect the running plugin.** Claude Code loads outputty from a pinned version
  cache (`~/.claude/plugins/cache/outputty/outputty/<version>/`), not this checkout. Editing a hook
  here changes nothing in your session until `claude plugin update outputty@outputty`. The driver runs
  the files *on disk*, which is exactly why it is the fast loop — no reinstall, no restart.
- **A hook that exits non-zero blocks the tool call it guards.** Every hook must exit 0 on malformed
  or empty stdin; the driver asserts this for all 7 because a crash here is silent in review and
  catastrophic in a hands-off build.
- **`memory-recall` keys the memory directory off the *canonical git root*, not `cwd`.** On macOS this
  bites in tests: `mktemp -d` returns `/var/folders/…` while `git rev-parse --show-toplevel` returns
  `/private/var/folders/…`, so a probe written under the first path is never found. `tempRepo()` in the
  driver returns git's own answer for this reason.
- **`prettier --check .` always warns** about `.claude/settings.local.json` — it is untracked and
  gitignored. The driver's gate checks `git ls-files` instead, so a clean tree really is 0 warnings.
- **`protocol.md` is injected into every main-session turn** (~2.6k est. tokens). The driver prints the
  live figure in the first hooks check; treat a jump as a cost regression, not a detail.
- **zsh does not word-split unquoted variables.** `gh stack init $BRANCHES` passes one giant argument
  and fails with `invalid branch name`. Use an array: `gh stack init "${BR[@]}"`.

## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `FAIL memory-recall.js surfaces a memory…` | The probe path was not canonicalised — see the macOS `/var` → `/private/var` gotcha above. |
| `FAIL prettier: … unformatted` | Run `npm run format`. The gate only inspects tracked files, so an untracked scratch file is never the cause. |
| `FAIL … on disk but never registered` | A hook file was added without an entry in `hooks/hooks.json`. It will never fire; register it. |
| `unknown suite "x"` (exit 2) | Suites are `hooks`, `tasks`, `wiring`, `gate`. |
| `tasks.js: not in a git repo` | `tasks.js` derives its file from the branch name. Set `OUTPUTTY_TASKS=/path/g.jsonl`. |
