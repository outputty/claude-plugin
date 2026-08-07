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
   `product.md`, Status & roadmap → `roadmap.md` (flip shipped
   features to ✅) / Language / What we're building towards / Architecture, **prune** anything now stale,
   keep link references tight. **Verify before you write** — any ✅-shipped behaviour you document is run
   in the codebase first, real output, no guessing (the template's hard rule).
2. Append a **History** entry: one paragraph — beginning state, the problem, the end state you landed on
   — plus a link to `.claude/trails/<branch>.md`.
3. **Dispatch `outputty:outputty-docs`** (foreground) to own every documentation surface but
   the product docs: bring the README and `docs/` back in line with what shipped, **delete documentation that
   has no reader** (prose restating the code, aspirational sections, and above all docs describing a
   decision the build reversed — those don't read as stale, they read as authoritative and contradict the
   code), record abandoned approaches in `.claude/lessons.md`, and write the PR description in the
   enforced format. It returns **what it deleted first** — that is the point of the pass. It never touches
   `product.md`/`roadmap.md`/`architecture.md`; drift it finds comes back as a flag for you to resolve in step 1.
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
   - **Mint a skill** only for a proven, reusable, multi-step procedure — read
     [`skill-minting.md`](skill-minting.md) first. It lands in the project's
     `.claude/skills/<name>/` on this branch, so it ships with the PR (most cycles mint none).
5. **Summarise the cycle for the user** in the enforced shape —
   [`summary-format.md`](summary-format.md). One base pipeline, then a numbered case per capability
   titled by the user's problem. Each case shows `Before:` and now, with **real observed output**
   quoted from the executed docs or the run. Close with a cost/caught table attributing each bug to
   whoever found it. Never compose an output value.

6. **Finalize the PR.** Run `qa`'s definition-of-done over the branch, then post the description the
   docs agent wrote in step 3 — you don't re-compose it. If step 3 was skipped, the format
   (`pr-description.md`) is canonical: summary bullets, one section each in the same order,
   before/after JSON only when a real record/file/API payload changes (a flow change with no record diff
   gets a before/after **graph** instead).
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
