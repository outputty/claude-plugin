---
name: documentation
description: Writes or rewrites a README or project doc to outputty's code-forward standard, de-slopping one that reads AI-generated. Use on "write the docs", "fix this README", "de-slop this doc", or from the build skill's docs layer.
---

# documentation - a README a reader can copy from

`~/.claude/rules/docs.md` and `.claude/rules/docs.md` hold the spine, the fence-tag convention and the API-bullet shape. This skill is the procedure that writes to them; `~/.claude/readme-template.md` is the skeleton to draft against.

## Write or rewrite

1. Read the code before the prose: every exported type, its public methods, one working example per capability. A claim with no code behind it is not written.
2. Draft against `~/.claude/readme-template.md`'s spine. Drop a section the project has nothing for - Comparison and Real-World Examples are earned, not mandatory; Core Concepts earns its diagram only past three interacting parts.
3. Run every `<!-- compiles -->` example for real, in the project's own runner, before it ships. An example that cannot run this way is `<!-- illustrative -->`, never `<!-- compiles -->`.
4. Paste the run's real output into the trailing comment on the line that produced it, never output recalled from memory.
5. Cut every claim true of a dozen other projects, every claudism the output style already bans, and every sentence a code example already shows.

## De-slop an existing doc

1. Read it whole against the code it describes: an example that no longer compiles, a claim the code no longer backs, a section restating what the code already states plainly.
2. Flag every hit from the output style's "Replace the claudisms" list inline: value-claim filler, manufactured significance, hollow superlatives, consultant register.
3. Reorder into the spine only where the reorder drops nothing; a section with no home in the spine is a question to the user, never a silent deletion.
4. Re-run every example the rewrite keeps, per step 3 above, before it ships.
