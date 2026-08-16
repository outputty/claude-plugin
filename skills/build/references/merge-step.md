# The merge step — read once, after the final layer and a passed review

The build skill points here at its `pass` verdict. Cold path: nothing here is needed while layers build.


**Cold path.** Nothing here is needed while layers are building.

### Review pass, before merge

The human reviews the finished PR whenever they like. If they leave comments, turn each into a task with
`tasks.js add <id> <title> --from <reviewed task>` and **run another layer**. Repeat until the PR is
clean, then run the merge step. If no review is wanted, skip straight to merge.

### The merge step itself

1. **Distill the trail into the product docs**, each decision to its file.
   - North Star and Language go to `product.yaml`.
   - Targets go to `roadmap.yaml`, and **a shipped target closes clean**. It takes status `✅`, a
     one-line `status_detail`, and the `summary`'s output made real from master QA's run.
   - The full story goes to its `doc: roadmap/<name>.md` writeup, never onto the row. That writeup
     carries the capability paragraph, the Before/After on the canonical example, the arc, and where
     the record lives.
   - The index and topic files go to `architecture.yaml` and `architecture/*.md`. A new feature, knob or
     limitation gets its index record and its topic-file coverage.
   - **Regenerate the task index** with `tasks.js index`. Each task was already closed inside its own
     layer (step 5), so this only rebuilds `.claude/tasks.yaml`; close any straggler here with
     `tasks.js close <id>`.
   - **Prune** anything now stale, and keep link references tight.
   - **Verify before you write.** Any ✅-shipped behaviour you document is run in the codebase first,
     with real output and no guessing.
2. **Record the cycle's pivots in `.claude/lessons.yaml`.** Write one record per approach this branch
   abandoned or reversed, with `title`, `kind`, `files: []` and `body`. Each names
   `.claude/trails/<branch>.trail.yaml` as where the reasoning sits. A bug that got fixed, a refactor, or
   a retry that succeeded earns no record.
3. **Bring every other documentation surface in line**: the README and `docs/`, using the
   `documentation` skill for the README. **Delete documentation that has no reader**: prose restating
   the code, aspirational sections, and above all docs describing a decision the build reversed. Say what
   you cut and why, one line each.
4. **Retrospect**, after the branch's last functional changes and before the PR finalizes. Persist only
   what would speed the next cycle or avert a repeat mistake: distil, route, prune. Run it too when a
   cycle ends _without_ merging, after an escalation or an abandonment.
   - **Reflect on what the session actually holds**: the trail, escalation verdicts, the user's
     corrections at the gates, and docs you fetched in-session. A build agent's internals never return to
     the session, so do not pretend to mine them. Keep a lesson only if knowing it at the next cycle's
     start would have saved time or averted a mistake.
   - **Route** per the always-on memory-routing rule. Decisions are already distilled into the product
     docs. Your one active write is the durable lesson into Claude Code auto-memory: a topic-file entry
     plus a one-line `MEMORY.md` pointer. That covers a process lesson, a gotcha or preference, and a doc
     worth re-reading. **Name the file the lesson is about** so a later edit can surface it. Replace or
     merge index lines, never just append. With no auto-memory available, hand the lessons to the user in
     your wrap-up instead.
   - **Mint a skill** only for a proven, reusable, multi-step procedure. Invoke the installed
     `anthropic-skills:skill-creator` to author it. It lands in the project's `.claude/skills/<name>/`
     on this branch, so it ships with the PR. Most cycles mint none.
5. **Summarise the cycle for the user** in the shape the session protocol enforces. Give one base
   pipeline, then a numbered case per capability, each titled by the user's problem. Each case shows
   `Before:` and now, with **real observed output** quoted from the executed docs or the run. Close with
   the protocol's cost and caught table, attributing each bug to whoever found it. Never compose an
   output value.
6. **Finalize the PR.** Re-read the original ask, confirm the branch does exactly that and nothing more,
   and run `CHECKS` once over the final state before you post. Then write the body to the canonical
   format in `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/pr-description.md`. It is summary bullets,
   then one section each in the same order. Add before/after JSON only when a real record, file or API
   payload changes. A flow change with no record diff gets a before/after **graph** instead.
7. **Bump the plugin version** in `.claude-plugin/marketplace.json` whenever the branch touched `hooks/`,
   `skills/` or `agents/`. **That version is the cache key**, and `plugin update` is a _no-op_ until it
   changes. Shipping behaviour without a bump means no user ever receives it, silently and with no error.
   Patch for a fix, minor for new behaviour or a new skill.
8. **Green-gate the merge.** Commit and push the merge-step artifacts to the **top** branch; nothing
   merges uncommitted. That is the product docs, the README, any minted skill, and the regenerated
   `.claude/tasks.yaml`. **⚠ Task state commits into the stack before the merge, never after.** A
   `tasks.js close` after the merge orphans the write into a second PR. The suite must pass on the final
   state. Then mark every PR ready (`gh pr ready <n>`) and land the whole stack **atomically**.

   ```bash
   gh stack merge --yes        # all-or-nothing: if any PR can't merge, none do
   ```

   A stack with one unmergeable layer merges zero layers, so a half-built feature can never reach the
   default branch. That is what preserves the rule that nothing merges on an escalation. Non-interactive
   runs merge the whole stack without prompting, and without `--yes` a wizard opens.
