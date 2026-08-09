# feature/yaml-product-memory — product memory becomes queryable records instead of prose

Planned-at: 1981ee2

## Core objective (the destination)

Every product-memory surface outputty owns is YAML records, and every lookup goes through a dedicated
YAML tool instead of a whole-file read. The pain is concrete: `lessons.md` is 1494 lines under two
headings, so "which lessons touched `hooks/protocol.md`?" costs the whole file. Reaching the end means
the same question is one command, and the format ships in the template every repo gets.

## Decisions so far

<!-- one line per settled question: enough to judge relevance, then follow the link for the detail -->

- **What "core files" covers** — the product-memory docs plus the task graph, not the tool-owned
  configs. Grepped the Claude Code 2.1.224 binary: `marketplace.json` 57 hits, `hooks.json` 36,
  `settings.json` 337, `plugin.json` 112, and zero YAML variants of any. → Out of scope, below.
- **Why YAML and not prettier markdown** — the goal is filtering and targeted editing on large files,
  which needs records. Prose in a YAML string is prose you still read whole.
- **The YAML runtime is bun** — `Bun.YAML.parse`/`stringify` are built in (bun 1.3.14). Node 26.5.0 has
  no YAML module, and the installed plugin cache carries no `node_modules` across all 10 cached
  versions, so a library dependency is unreachable at runtime.
- **Hooks stay on `node`** — no hook parses doc or task-graph content; all ten read JSON from stdin,
  which is Claude Code's protocol. Moving them to bun reproduces the 0.44.1 failure: a hook that cannot
  launch fails non-blocking, so all ten guards would stop firing silently on a machine without bun.
  → `lessons.md` §0.44.1
- **`require-grill.js` keeps a text-shape check** — it asks "does this trail record a decision", which a
  regex over the YAML answers exactly as well as it answered over the markdown. No parser, no bun.
  → `hooks/require-grill.js:53-61`
- **Agents author the docs as YAML text; only the task graph is machine-written** —
  `Bun.YAML.stringify` escapes a multi-line body into one quoted line rather than emitting a `|` block,
  which would reintroduce JSONL's unreadability in the field that hurts most. `parse` reads `|`
  correctly, so hand-authored blocks round-trip.
- **Diagrams leave the docs** — a new `architecture/` folder holds the graphs and the YAML references
  them by path. One Mermaid block exists in `.claude/` today (architecture.md's flow-at-a-glance).
- **This changes the plugin's format, not just this repo's files** —
  `references/product-template.md` is the canonical shape `spec.md`, `bootstrap` and the merge distill
  all write from, so every repo outputty runs in gets YAML docs. 24 files name the docs; the writers and
  readers move with the format.
- **This trail is markdown** — the YAML trail format is what this branch builds, and there is no tool to
  read it yet. It converts as part of the build, as the first real test of the new format.

## Not yet specified

<!-- the fog: in-scope questions you can SEE but cannot yet phrase sharply. Graduates into tasks as the
     frontier advances. Delete a patch when it graduates — it then lives only as its task. -->

- The docs query CLI's command surface — what an agent types to ask each doc a question, and how much
  of it is one tool versus one per doc.
- Whether `claims/` stays one file per claim or collapses into a single `claims.yaml`. One-per-file
  already gives targeted loading, so the win is unclear.
- How `examples.md` carries its 8 JSON blocks as YAML without the escaping problem above.
- `docs/flow.svg` and `skills/diagram/examples/flowchart.svg` render the doc filenames as text, so they
  go stale on rename. Redraw now or at merge is unsettled.
- What the readers are told to do instead of reading whole. A YAML file nobody queries costs the same
  read the markdown did, so the instruction change is the half that makes the format pay.

## Out of scope

<!-- ruled beyond the destination. Closed, never graduates, and deliberately NOT a decision. -->

- `marketplace.json`, `hooks.json`, `settings.json`, `package.json`, `.oxlintrc.json` — out of scope
  because Claude Code, pnpm and oxlint fix these filenames and formats.
- `skills/*/SKILL.md`, `agents/*.md`, `hooks/protocol.md` — out of scope because Claude Code loads them
  as markdown.
- Moving the ten hooks to bun — out of scope because none of them parse YAML, and the cost is silent
  guard failure.
