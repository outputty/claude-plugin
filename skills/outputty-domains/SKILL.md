---
name: outputty-domains
description: Mine Claude Code session history into global per-language skills (~/.claude/skills/<language>/SKILL.md) — batched session parsing in a dynamic workflow, merged per language, gated against held-out sessions. Use when the user wants to turn past sessions into reusable domain expertise ("learn from my history", "build skills from what I've done", "bootstrap domain skills"), or to refresh those skills after a project.
---

# outputty-domains — turn session history into global domain skills

Past sessions are the only record of how this user actually solves problems. This skill distils them into
**global, per-language skills** (`~/.claude/skills/<language>/SKILL.md`) that apply across every project.
It fans out **batches of sessions** as a dynamic workflow, merges findings per language, and gates each
candidate before anything is written.

**One skill per language** — `python`, `typescript`, `sql`, `go`. Libraries and dialects nest *inside*
their language (pandas and flask live in `python`; postgres, duckdb and bigquery live in `sql`), which is
what keeps triggers from competing. Splitting happens later, on evidence — see **Growth**.

Adapted from [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt)'s discipline — bounded edits,
held-out validation, review-then-adopt — implemented natively on outputty's own workflow instead of its
Python engine.

## Its lane — never widen it

Domain skills carry **transferable technique only**: how to do X well in this domain. Everything else
belongs to an existing owner, and writing there is a bug:

| Content | Owner | This skill writes it? |
|---|---|---|
| Transferable domain technique | `~/.claude/skills/<language>/` | ✅ **its only write** |
| Product decisions, North Star, roadmap | `.claude/product.md` (outputty) | ❌ never |
| Repo navigation, gotchas, bugs | `.wolf/` (OpenWolf hooks) | ❌ never |
| Cross-session process lessons | Claude Code auto-memory | ❌ never |
| The flow's own rules | the plugin's shipped skills | ❌ **hard no** — machine-editing forks the plugin |

Also never: secrets, credentials, or customer data lifted from a transcript — reference a *pattern*,
never a value.

## Scope the run before you spend anything

A full history is large — **check first, always**:

```bash
find ~/.claude/projects -name '*.jsonl' | wc -l        # session count
du -sh ~/.claude/projects                              # total size
```

**Sessions are batched — that is the default.** One agent reads a **batch** of sessions (start at ~10)
and returns findings for the whole batch, so cost scales with `sessions ÷ batch_size`, not with sessions.
Per-session agents are the expensive special case; use them only for a small, hand-picked set.

Scope the rest with the user (`AskUserQuestion`, cost named) before launching:

- **Which projects** — all, or one repo's directory under `~/.claude/projects/`.
- **How far back** — a date cut usually beats "everything"; recent sessions reflect current practice.
- **Floor out the noise** — skip transcripts below a size threshold (a few KB); they're aborted or
  trivial sessions and produce nothing but tokens.
- **Batch size** — bigger batches are cheaper but blur evidence; a finding must still cite the session it
  came from, so shrink the batch if citations start going vague.

State the resulting number of agents (`batches`, not sessions) and stop for confirmation. **Never launch
an unscoped run.**

## Phase 0 — inventory and let the languages emerge (local, no model calls)

**Do not pre-declare the list.** Derive it from the corpus, or you will train a skill on a technology
that barely appears. Grep the scoped transcripts for language and library terms, count *files*, and keep
only **languages** that clear a floor (say ~20 sessions) — libraries and dialects are recorded as
sub-topics of their language, never as their own skill at this stage.

Present the derived roster with counts and confirm it before launching. Record each finding's source
session and project — the project tag is what makes contradictions visible later (see **Governance**).

## Phase 1 — hand the launch to the user

A skill cannot start a workflow. Print the scoped plan (languages, session count, **batch count = the
number of agents**) and ask the user to send a message containing **`ultracode`**, e.g.:

> ultracode — mine my session history into domain skills

Same launch facts as BUILD (see [`../outputty/build.md`](../outputty/build.md)): the `Workflow` tool loads
**only** in that turn, the terminal CLI exposes it and the Desktop agent pane does not, and unattended
running is the permission mode's call. Don't try to call `Workflow` in this turn, and never fall back to
dispatching Agent-tool subagents one at a time — that fan-out *is* what the workflow replaces.

## Phase 2 — the workflow

Author the script fresh from the scoped plan. **Embed the session list and paths as literals** — inline
`args` can arrive as a JSON *string* and crash on the first line.

```js
export const meta = {
  name: 'outputty-domains',
  description: 'Mine session transcripts into global per-language skills: extract per batch, merge per language, gate, stage.',
  phases: [{ title: 'Extract' }, { title: 'Consolidate' }, { title: 'Gate' }],
}
const BATCHES  = [ /* paste the scoped batches as a literal: [{ id, sessions: [{path, project}] }, …] */ ]
const HELD_OUT = [ /* ~20% of sessions, withheld from Extract — the gate's evidence */ ]
const EXTRACT = { model: 'haiku', effort: 'medium' }   // a batch of transcripts in, a fixed schema out — mechanical, and the schema is what makes Haiku safe here
const MERGE   = { model: 'sonnet', effort: 'xhigh' }   // judgment: what generalises, and where the evidence conflicts
const JUDGE   = { model: 'sonnet', effort: 'xhigh' }

// 1. EXTRACT — one agent per BATCH, fully parallel. Returns language-tagged findings, never prose.
const found = (await pipeline(BATCHES, b =>
  agent(extractPrompt(b), { ...EXTRACT, label: `x:${b.id}`, phase: 'Extract', schema: FINDINGS })
)).filter(Boolean).flatMap(r => r.findings)      // { language, topic, claim, evidence, project, kind }

// 2. GROUP — plain JS, no agent. One bucket per language; `topic` stays a field, not a bucket.
const byLanguage = groupBy(found, f => f.language)

// 3. CONSOLIDATE + GATE — per language, independently (pipeline: no barrier between stages)
const staged = await pipeline(Object.entries(byLanguage),
  ([lang, fs]) => agent(mergePrompt(lang, fs, readCurrent(lang)),   // bounded add/delete/replace vs the CURRENT skill; conflicts surfaced, not silently resolved
    { ...MERGE, label: `merge:${lang}`, phase: 'Consolidate', schema: CANDIDATE }),
  (cand, [lang]) => parallel([                                      // 3 independent judges, held-out evidence only
    'would this have helped on these held-out sessions?',
    'does any claim contradict other evidence in the corpus, or the current skill?',
    'is it technique, or is it narrative about a past session?',
  ].map(lens => () => agent(judgePrompt(cand, lens, HELD_OUT),
      { ...JUDGE, label: `gate:${lang}`, phase: 'Gate', schema: VERDICT })))
    .then(vs => ({ lang, cand, keep: vs.filter(Boolean).filter(v => v.pass).length >= 2 }))
)
return { staged: staged.filter(Boolean).filter(s => s.keep), rejected: staged.filter(s => s && !s.keep) }
```

**Extraction returns structured findings, never prose** — `{ language, topic, claim, evidence (session +
what happened), project, kind }` where `topic` is the library/dialect (`pandas`, `duckdb`) and `kind` is
`technique` / `gotcha` / `preference`. A schema is what keeps the cheap extractor honest; free-text
summaries at this scale produce mush, and a batched extractor drifts fastest without one.

**The gate is the point.** A candidate is only staged if a majority of judges pass it against **held-out
sessions the extractors never saw**. Rejected candidates are returned with their reason, not silently
dropped — that is the rejected-edit record.

## Phase 3 — review, then adopt

The workflow **stages**; it never writes a live skill. Present per language: the candidate diff against the
current skill, the judges' verdicts, any **surfaced contradictions** awaiting a ruling, and the
rejected candidates. The user adopts per language. On adopt,
back up the existing file first, and write `~/.claude/skills/<language>/SKILL.md`.

**Bootstrapping is not validated optimization.** Against an empty starting skill nearly any candidate
"improves", so the first pass is *synthesis* — the gate only does real work from the second run onward.
Say so rather than presenting a first-run pass as evidence the skill is good.

## Governance — the parts that rot if ignored

- **Generalise by default; escalate only on contradiction.** What the user does in one project is assumed
  to apply everywhere — a single project is enough evidence. Do **not** hold a finding back waiting for a
  second project to confirm it. The one thing that stops a claim is **conflicting evidence**: two sessions
  that solve the same problem incompatibly, or a candidate that contradicts what the current skill already
  says. Never silently pick a winner — **surface the conflict** in the staged proposal with both sides and
  their sessions, and let the user settle it. A resolved contradiction is the highest-value thing this
  pipeline produces.
- **Every global skill costs context forever.** Its description sits in *every* session's prompt. One
  skill per language keeps that bounded; retire a language that stops earning its line.
- **Technique, not narrative.** A skill is instructions ("use `X` for Y because Z"), never a story about a
  past session. The session is the *evidence*, not the content.

## Growth — split only on evidence

A language skill accumulates topics, so it will grow. Split in two stages, never pre-emptively:

1. **First, move depth into `references/`.** When `SKILL.md` gets long (roughly past ~200 lines, or when
   one topic dominates it), keep `SKILL.md` as the router — the short, always-loaded index — and move the
   heavy topic into `~/.claude/skills/<language>/references/<topic>.md`, read on demand. This is the same
   progressive-disclosure shape outputty's own skills use, and it costs no extra trigger.
2. **Only then, mint a sibling skill** — and only when a topic is *independently triggerable* (the user
   reaches for it without the parent language in play). Its description must name the **discriminator**
   ("only when the target engine is DuckDB specifically"), or it will compete with the parent for
   activation. Nesting under the language is the default precisely because it avoids that fight.

## Re-running

Record the newest session timestamp consumed in `~/.claude/skills/.domains-checkpoint.json`. Later runs
mine only sessions after it, merge into the existing skills as bounded edits, and re-gate — so the skills
accumulate across projects instead of being rebuilt from scratch.
