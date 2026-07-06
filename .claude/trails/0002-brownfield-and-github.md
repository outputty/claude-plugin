# Trail — 0002-brownfield-and-github

> Scoping trail for adding brownfield bootstrap + explicit GitHub discipline to outputty.

## Thought-trail

- **Gap: the harness assumed greenfield.** Brownfield repos already hold decisions in docs/
  docstrings/history — they must be imported. → new `outputty:init` skill.
- **init scope?** → Writes ONLY product.md (decisions/intent). Leans on OpenWolf's `anatomy.md` for
  navigation; does NOT build a file-map or seed cerebrum (OpenWolf's job). Dropped: blind tree re-scan.
- **"Go through all git commits"?** → Sharpened to decision *signal* (messages, tags, merge commits,
  docs, docstrings), not every diff. Commit-history scan is **optional, user-selected**; grinding all
  messages is fine only if the user opts in. Dropped: reading every diff by default.
- **Who scans?** → The **cheapest agent** (`scanner`, haiku), one per selected source, read-only.
- **Source selection?** → A **multi-select** question up front; the user picks, then execute.
- **GitHub, explicit:** (1) commits per subagent [already true]; (2) **draft PR at branch-cut**,
  before any work, capturing scoping too [chose over post-plan]; (3) verbose commit messages =
  problem + solution, logged by the subagent.
- **Where do git+remote checks live?** → the **SessionStart hook**, alongside OpenWolf [chose over
  flow-level]. Hard-blocks every session without git + remote. Dropped: flow-level checking.
