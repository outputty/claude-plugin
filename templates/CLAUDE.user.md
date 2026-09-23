<!-- outputty:begin - managed block. Edit only outside these markers; a rewrite replaces everything inside. -->

# Tools

- Prefer bun, rg, fd, sd and jq.

# Plan and build tabs

Read the last segment of `git rev-parse --show-toplevel`.

- If it is the repo's own name, this is the primary session. On a plan or build request, open a tab through the `herdr` skill and stop. When the user says "do it here", work in place.
- If it is `ticket-<n>` or `plan-<slug>`, you are that session. Run `/build <n>` or `/plan <…>` here.
- Create every worktree from the latest `main`. Run `git checkout main`, then `git pull`, or add the worktree from `origin/main` when the primary checkout holds other work.

# Code

- Read the code and trace the real flow before changing it.
- Reuse before writing. Stop at the first rung that holds: does it need to exist, what the repo already has, the standard library or platform, an installed dependency, then the minimum new code. A near-duplicate of existing code is a defect: unify it.
- Fix a bug at its root: grep every caller and fix the shared code once.
- Build the simplest thing for the documented usage; the caller owns misuse. Add no guard, fallback or catch without a recovery path, and let a lookup that cannot succeed raise with context. Keep validation at a trust boundary, security, accessibility, and error handling that propagates.
- Every function is an orchestrator or an executor. An orchestrator lists delegations in order and holds no algorithm. An executor owns one job and lets its errors bubble.
- Put guard clauses first, with no `else` after a `return` or `throw`. Nest at most two levels, keep one concept per file, and keep imports at the top.
- Test end to end through the public entry point, against the real dependency. Mock only what cannot run locally, and say why in the test.
- Report output as run only after it ran.
- Spike tests are never committed.
- Gate a feature only when its ticket says so, and gate at construction: the orchestrator passes a parameter, or chooses which class to construct. An executor never reads a flag. When the change cannot be isolated that way, copy the executor or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag.
- Never run a deploy, a publish, or a merge that deploys unless the user says so in this session.

# Docstrings and comments

- Give every new or changed exported unit a docstring in its language's convention: TSDoc for TypeScript, PEP 257 for Python, doc comments for Go and Rust. It states what the unit produces, what the caller owes, and one `input → output` line.
- A comment says why, never what the code already says. Rename a thing rather than explain its name.
- When a clear comment will not come, rewrite the code instead.
- Explain unidiomatic code, and a fix whose obvious rewrite gives a wrong answer, by naming that wrong answer.
- Link the source of copied code and the spec that a line implements.
- Mark known incomplete work with `TODO:` naming the limit.
- A comment carries no ticket number, history or measurement.

<!-- outputty:end -->
