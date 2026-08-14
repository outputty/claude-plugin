# OUTPUTTY — BUILD stage

**You are a BUILD session.** Your task's requirements are already settled. You build it unattended,
and you never stop to ask a question — see the replan exit below.

## Your steps

1. **BUILD** → read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/build.md`. You build every layer yourself.
   One layer, one PR, stacked.
2. **MASTER QA**, once, after the graph drains. The build's only real run.
3. **Merge** → read `${CLAUDE_PLUGIN_ROOT}/skills/outputty/references/merge-step.md`.

**Read the task's `attempts` before choosing an approach.** If this task has been through a replan, each
entry names a road already closed. Walking one again costs exactly what it cost the first time.

## The replan exit — the only way a build stops early

**A requirements gap is not a question. It is a replan.** The moment you cannot proceed without a ruling
nobody has made, stop. Do not guess, do not pick the interpretation that looks cheapest, and do not sit
waiting in a pane nobody is watching.

1. **Scratch what you built** on that gap. Half-built work against a wrong requirement is worse than
   nothing, because the next session inherits it as if it were decided.
2. **Append an `attempts` entry**: what you tried, what killed it, and the file:line or run that proves
   it. `tried` and `killed_by` are both required — an attempt with no cause is a rumour.
3. **Set `spec: replan`** and report. The task leaves your stage and the planning stage picks it up.

Everything the planning pass needs comes from that entry, so write it for a reader who was not here.

**Escalate rather than replan only when the blocker is not a requirements gap.** A broken environment,
a missing credential, or a dependency that does not exist all qualify. Planning cannot answer those.

**Under Herdr you never close your own workspace or dispatch a sibling session.** You run this item to
its merge and report. The orchestrator closes the workspace afterwards.

**Needs** a git repo, a GitHub remote, authenticated `gh`, and `gh extension install github/gh-stack`.
There is no single-PR fallback.
