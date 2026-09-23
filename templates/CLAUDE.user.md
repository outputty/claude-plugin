<!-- outputty:begin - managed block. Edit only outside these markers; a rewrite replaces everything inside. -->

# Tools

- Use the repo's own package manager and runtime. Prefer bun for one-off scripts, and rg, fd, sd and jq in the shell.
- Sweep with `rg --hidden`: `.claude/` is hidden.

# Plan and build tabs

Read the last segment of `git rev-parse --show-toplevel`.

- If it is the repo's own name, this is the primary session. On a plan or build request, open a tab through the `herdr` skill and stop. When the user says "do it here", work in place.
- If it is `ticket-<n>` or `plan-<slug>`, you are that session. Run `/build <n>` or `/plan <…>` here.
- Create every worktree from the latest `main`. Run `git checkout main`, then `git pull`, or add the worktree from `origin/main` when the primary checkout holds other work.

# Code

- Reuse before writing. Stop at the first rung that holds: does it need to exist, what the repo already has, the standard library or platform, an installed dependency, then the minimum new code. A near-duplicate of existing code is a defect: unify it.
- Fix a bug at its root: grep every caller and fix the shared code once.
- Build the simplest thing for the documented usage; the caller owns misuse. A public API is a trust boundary: validate its inputs there, eagerly, and add no guard, fallback or catch without a recovery path anywhere inside. Let a lookup that cannot succeed raise with context. Keep security, accessibility, and error handling that propagates.
- Every function is an orchestrator or an executor. An orchestrator lists delegations in order and holds no algorithm. An executor owns one job and lets its errors bubble. When an orchestrator loops over what an executor returned, move that loop into the executor.
- Put guard clauses first, with no `else` after a `return` or `throw`. Nest at most two levels, keep one concept per file, and keep imports at the top.
- Enforce a structural or import-boundary rule in the linter's config before writing it as prose.
- A pure move is byte-identical and lands on its own.
- Gate a feature only when its ticket says so, and gate at construction: the orchestrator passes a parameter, or chooses which class to construct. An executor never reads a flag. When the change cannot be isolated that way, copy the executor or class, gate which copy is constructed, and later promote the copy or delete it, each time with the flag. Before a gate's default flips, run the whole suite under the new default.
- Never run a deploy, a publish, or a merge that deploys unless the user says so in this session.

# Tests and claims

- Test end to end through the public entry point, against the real dependency. Mock only what cannot run locally, and say why in the test. No unit tests of internals.
- Put tests in a repo-root `__tests__/` that mirrors `src/`.
- A test must fail with its fix reverted. For a redirect or an overwrite, also assert the old path was not used.
- Trace every deleted or renamed test to its new home, and name the removal in the commit.
- Spike tests are never committed; a spike's answer moves into a real test.
- Run a gate command alone, its output redirected to a file, with no pipe. Read the file in a separate call.
- Report output as run only after it ran. Call something absent, blocked or impossible only after reproducing it against the authoritative source.

# Writing any file

- State performance as relative: which approach is faster, and whether by a little or by orders of magnitude. A measured figure belongs only in a benchmark the user asked for, never in a doc, rule, skill or prompt.
- Give every new or changed exported unit a docstring in its language's convention: TSDoc for TypeScript, PEP 257 for Python, doc comments for Go and Rust. It states what the unit produces, what the caller owes, and one `input → output` line.
- A comment says why, never what the code already says. Rename a thing rather than explain its name, and rewrite code that no clear comment can explain.
- Explain unidiomatic code, and a fix whose obvious rewrite gives a wrong answer, by naming that wrong answer.
- Link the source of copied code and the spec that a line implements.
- Mark known incomplete work with `TODO:` naming the limit.
- A comment carries no ticket number, history, measurement, or removed symbol's name.

<!-- outputty:end -->
