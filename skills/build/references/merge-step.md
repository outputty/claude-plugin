# The merge step — read once, after the final layer and a passed review

The build skill points here at its `pass` verdict. Cold path: nothing here is needed while layers build.

### Review pass, before merge

The human reviews the finished PR whenever they like. Turn each comment into a task with `add_task`
`{ project, id, title, discovered_from: <reviewed task> }` and **run another layer**. Repeat until the PR
is clean, then merge. No review wanted → skip straight to merge.

### The merge step itself

1. **Distill the trail into the product docs**, each decision to its file.
   - North Star and Language → `product.yaml`.
   - Targets → `roadmap.yaml`; **a shipped target closes clean**: status `✅`, a one-line
     `status_detail`, and the `summary`'s output made real from master QA's run.
   - The full story → its `doc: roadmap/<name>.md` writeup, never the row: the capability paragraph, the
     Before/After on the canonical example, the arc, and where the record lives.
   - The index and topic files → `architecture.yaml` and `architecture/*.md`. A new feature, knob, or
     limitation gets its index record and topic-file coverage.
   - **Reconcile the task graph** with `sync` `{ project }` — it pulls issue/board state back and pushes
     anything unsynced. Each task was closed inside its own layer (step 5); close any straggler with
     `close_task` `{ project, id }`.
   - **Prune** anything now stale; keep link references tight.
   - **Verify before you write.** Any ✅-shipped behaviour you document is run in the codebase first, with
     real output — no guessing.
2. **Record the cycle's pivots in `.claude/lessons.yaml`.** One record per approach this branch abandoned
   or reversed — `title`, `kind`, `files: []`, `body` — each naming the task's `tasks` MCP trail as where
   the reasoning sits. A bug fixed, a refactor, or a retry that succeeded earns no record.
3. **Bring every other documentation surface in line**: the README and `docs/`, using the `documentation`
   skill for the README. **Delete documentation that has no reader**: prose restating the code,
   aspirational sections, and above all docs describing a decision the build reversed. Say what you cut
   and why, one line each.
4. **Retrospect**, after the branch's last functional changes and before the PR finalizes. Persist only
   what would speed the next cycle or avert a repeat: distil, route, prune. Run it too when a cycle ends
   _without_ merging, after an escalation or abandonment.
   - **Reflect on what the session actually holds**: the trail, escalation verdicts, the user's gate
     corrections, and docs you fetched in-session. A dispatched agent's internals never return, so don't
     pretend to mine them. Keep a lesson only if knowing it at the next cycle's start would have saved
     time or averted a mistake.
   - **Route** per the always-on memory-routing rule. Decisions are already distilled into the product
     docs. Your one active write is the durable lesson into Claude Code auto-memory: a topic-file entry
     plus a one-line `MEMORY.md` pointer — covering a process lesson, a gotcha or preference, and a doc
     worth re-reading. **Name the file the lesson is about** so a later edit can surface it. Replace or
     merge index lines, never just append. No auto-memory → hand the lessons to the user in your wrap-up.
   - **Mint a skill** only for a proven, reusable, multi-step procedure. Invoke the installed
     `anthropic-skills:skill-creator` to author it. It lands in `.claude/skills/<name>/` on this branch,
     so it ships with the PR. Most cycles mint none.
5. **Summarise the cycle for the user** in the shape the session protocol enforces: one base pipeline,
   then a numbered case per capability, each titled by the user's problem. Each case shows `Before:` and
   now, with **real observed output** quoted from the executed docs or the run. Close with the protocol's
   cost-and-caught table, attributing each bug to whoever found it. Never compose an output value.
6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and nothing more,
   and run `CHECKS` once over the final state before posting. Then write the body to the canonical format
   in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`: summary bullets, then one
   section each in the same order. Add before/after JSON only when a real record, file, or API payload
   changes; a flow change with no record diff gets a before/after **graph** instead.
7. **Bump the plugin version** in `.claude-plugin/marketplace.json` whenever the branch touched `skills/`
   or `agents/`. **That version is the cache key** — `plugin update` is a no-op until it changes, so
   shipping behaviour without a bump means no user ever receives it, silently. Patch for a fix, minor for
   new behaviour or a new skill.
8. **Green-gate the merge.** Commit and push the merge-step artifacts — the product docs, the README, any
   minted skill — to the **top** branch; nothing merges uncommitted. **⚠ Close each task before the
   merge, never after** — the task graph is GitHub Issues now, so `close_task` closes the issue directly
   and needs no commit, but do it before landing so the stack reflects reality. The suite must pass on the
   final state. Then mark every PR ready (`gh pr ready <n>`) and land the stack **atomically**.

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

   One unmergeable layer merges zero layers, so a half-built feature can never reach the default branch —
   that is what preserves "nothing merges on an escalation". Non-interactive runs merge the whole stack
   without prompting; without `--yes` a wizard opens.
