# Merge step — read this once, after the final layer

**Cold path.** Nothing here is needed while layers are building, which is why it lives outside
`build.md`: carrying it through the whole build costs ~1,200 tokens on every call of a session that
makes hundreds.

## Review pass (main session, before merge)

The human reviews the finished PR whenever they like. If they leave comments, turn each into a task
(`tasks.js add <id> <title> --from <reviewed task>`) and **run another layer** — the same
build-agent→QA path drains them. Repeat until the PR is clean, then run the merge step. If no review is
wanted, skip straight to merge — the default is fully hands-off.

## Merge step (last — main session, after the final layer)

1. Distill the trail into the product docs — each decision to its file: North Star/Language →
   `product.yaml`; targets → `roadmap.yaml` — **a shipped target closes clean**: status `✅`, a
   one-line `status_detail`, the `summary`'s output made real (observed, from master QA's run), and
   the full story written to its `doc: roadmap/<name>.md` writeup (capability paragraph ·
   Before/After on the canonical example · The arc · Where the record lives) — the row itself
   carries no story; the index + topic files → `architecture.yaml`/`architecture/*.md` (a new
   feature/knob/limitation gets its index record and topic-file coverage); and **flip the
   `tasks.yaml` entry this branch drained** (when one exists). **Prune** anything now stale,
   keep link references tight. **Verify before you write** — any ✅-shipped behaviour you document is run
   in the codebase first, real output, no guessing (the template's hard rule).
2. **Record the cycle's pivots in `.claude/lessons.yaml`.** One record per approach this branch
   abandoned or reversed (`title`, `kind`, `files: []`, `body`), each naming
   `.claude/trails/<branch>.trail.yaml` as where the reasoning sits. A bug that got fixed, a refactor,
   or a retry that succeeded earns no record — the git log already holds those.
3. **Bring every other documentation surface in line**: the README and `docs/`, using the
   `documentation` skill for the README. **Delete documentation that has no reader**: prose restating
   the code, aspirational sections, and above all docs describing a decision the build reversed. Those
   do not read as stale. They read as authoritative and contradict the code. Say what you cut and why,
   one line each.
4. **Retrospect — after the branch's last functional changes, before the PR finalizes.** Persist only
   what would speed the next cycle or avert a repeat mistake — distil, route, prune. Run it too when a
   cycle ends *without* merging (escalation, abandonment): failed cycles carry the richest lessons.
   - **Reflect on what the session actually holds:** the trail, any escalation verdicts that reached
     you, the user's corrections from the gated phases, and docs you fetched in-session. (A build agent's
     internals — clean retries, its QA child's rounds — never return to the session; don't pretend to
     mine them.) Keep a lesson only if knowing it at the next cycle's start would have saved time or averted
     a mistake.
   - **Route** per the always-on memory-routing rule: decisions are already distilled into
     the product docs. Your one active write is the durable lesson — a process lesson, a gotcha or
     preference, a doc worth re-reading — into Claude Code auto-memory: a topic-file entry plus a
     one-line `MEMORY.md` pointer. **Name the file the lesson is about** so the recall hook can surface
     it on a later edit. Topic files load on demand,
     but **the index line is paid at every session start** — replace or merge index lines, never just
     append. No auto-memory (pre-v2.1.59, or disabled)? Hand the lessons to the user in your wrap-up
     instead.
   - **Mint a skill** only for a proven, reusable, multi-step procedure. Invoke the installed
     `anthropic-skills:skill-creator` to author it. It lands in the project's `.claude/skills/<name>/`
     on this branch, so it ships with the PR (most cycles mint none).
5. **Summarise the cycle for the user** in the shape the session protocol enforces. One base pipeline,
   then a numbered case per capability titled by the user's problem. Each case shows `Before:` and now,
   with **real observed output** quoted from the executed docs or the run. Close with the protocol's
   cost/caught table, attributing each bug to whoever found it. Never compose an output value.

6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and nothing
   more, and run `CHECKS` once over the final state before you post. Then write the body to the
   canonical format ([`pr-description.md`](pr-description.md)): summary bullets, one section each in
   the same order, before/after JSON only when a real record/file/API payload changes (a flow change
   with no record diff gets a before/after **graph** instead).
7. **Bump the plugin version** in `.claude-plugin/marketplace.json` whenever the branch touched
   `hooks/`, `skills/`, or `agents/`. **That version is the cache key** — `plugin update` is a *no-op*
   until it changes, so shipping behaviour without a bump means no user ever receives it, silently and
   with no error. Patch for a fix, minor for new behaviour or a new skill. (Verified the hard way: three
   PRs once landed on `main` unbumped and were undeliverable.)
8. **Green-gate the merge.** Commit and push the merge-step artifacts (the product docs, README, any minted
   skill) to the **top** branch of the stack — nothing merges uncommitted. The full test/build/lint suite
   must pass on the final state. Then mark every PR in the stack ready (`gh pr ready <n>`) and land the
   whole stack **atomically**:

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

   **Atomicity is the point, and it is what preserves the existing rule that nothing merges on an
   escalation.** A stack with one unmergeable layer merges zero layers, so a half-built feature can never
   reach the default branch. Non-interactive runs (and `--yes`) merge the whole stack without prompting;
   without `--yes` a wizard opens, which would stall a hands-off build.
