---
name: outputty-domains
description: Mine Claude Code session history into global per-domain skills (~/.claude/skills/<domain>/SKILL.md) — one agent per session in a dynamic workflow, merged per domain, gated against held-out sessions. Use when the user wants to turn past sessions into reusable domain expertise ("learn from my history", "build skills from what I've done", "bootstrap domain skills"), or to refresh those skills after a project.
---

# outputty-domains — turn session history into global domain skills

Past sessions are the only record of how this user actually solves problems in a domain. This skill
distils them into **global, per-domain skills** (`~/.claude/skills/<domain>/SKILL.md`) that apply across
every project. It fans out **one agent per session** as a dynamic workflow, merges findings per domain,
and gates each candidate before anything is written.

Adapted from [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt)'s discipline — bounded edits,
held-out validation, review-then-adopt — implemented natively on outputty's own workflow instead of its
Python engine.

## Its lane — never widen it

Domain skills carry **transferable technique only**: how to do X well in this domain. Everything else
belongs to an existing owner, and writing there is a bug:

| Content | Owner | This skill writes it? |
|---|---|---|
| Transferable domain technique | `~/.claude/skills/<domain>/` | ✅ **its only write** |
| Product decisions, North Star, roadmap | `.claude/product.md` (outputty) | ❌ never |
| Repo navigation, gotchas, bugs | `.wolf/` (OpenWolf hooks) | ❌ never |
| Cross-session process lessons | Claude Code auto-memory | ❌ never |
| The flow's own rules | the plugin's shipped skills | ❌ **hard no** — machine-editing forks the plugin |

Also never: secrets, credentials, or customer data lifted from a transcript (reference a *pattern*, never
a value); and never a project-specific convention presented as domain truth (see **Governance**).

## Scope the run before you spend anything

A full history is large — **check first, always**:

```bash
find ~/.claude/projects -name '*.jsonl' | wc -l        # session count
du -sh ~/.claude/projects                              # total size
```

One agent per session means **cost scales linearly with the session count** — a few thousand sessions is
a real bill. Scope it with the user (`AskUserQuestion`, cost named) before launching:

- **Which projects** — all, or one repo's directory under `~/.claude/projects/`.
- **How far back** — a date cut usually beats "everything"; recent sessions reflect current practice.
- **Floor out the noise** — skip transcripts below a size threshold (a few KB); they're aborted or
  trivial sessions and produce nothing but tokens.
- **Batch mode** *(cheap alternative)* — N sessions per agent instead of one each. Coarser findings,
  a fraction of the calls. Offer it when the session count is large.

State the resulting number of agents and stop for confirmation. **Never launch an unscoped run.**

## Phase 0 — inventory and let the domains emerge (local, no model calls)

**Do not pre-declare the domain list.** Derive it from the corpus, or you will train a skill on a
technology that barely appears. Grep the scoped transcripts for candidate terms and count *files*, then
keep only domains that clear a floor (say ~20 sessions). A term that appears twice is noise, not a domain.

Record, per candidate domain: session count, and **how many distinct projects it appears in** — that
second number matters in **Governance** below.

## Phase 1 — hand the launch to the user

A skill cannot start a workflow. Print the scoped plan (domains, session count, agent count) and ask the
user to send a message containing **`ultracode`**, e.g.:

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
  description: 'Mine session transcripts into global per-domain skills: extract per session, merge per domain, gate, stage.',
  phases: [{ title: 'Extract' }, { title: 'Consolidate' }, { title: 'Gate' }],
}
const SESSIONS = [ /* paste the scoped {path, project} list as a literal */ ]
const HELD_OUT = [ /* ~20% of SESSIONS, withheld from Extract — the gate's evidence */ ]
const EXTRACT = { model: 'haiku', effort: 'medium' }   // one transcript in, a fixed schema out — mechanical, and the schema is what makes Haiku safe here
const MERGE   = { model: 'sonnet', effort: 'xhigh' }   // judgment: what generalises vs what is one project's habit
const JUDGE   = { model: 'sonnet', effort: 'xhigh' }

// 1. EXTRACT — one agent per session, fully parallel. Each returns domain-tagged findings, never prose.
const found = (await pipeline(SESSIONS, s =>
  agent(extractPrompt(s), { ...EXTRACT, label: `x:${s.id}`, phase: 'Extract', schema: FINDINGS })
)).filter(Boolean).flatMap(r => r.findings)          // { domain, claim, evidence, project, kind }

// 2. GROUP — plain JS, no agent. Drop domains under the floor.
const byDomain = groupBy(found, f => f.domain)

// 3. CONSOLIDATE + GATE — per domain, independently (pipeline: no barrier between stages)
const staged = await pipeline(Object.entries(byDomain),
  ([domain, fs]) => agent(mergePrompt(domain, fs, readCurrent(domain)),   // bounded add/delete/replace vs the CURRENT skill
    { ...MERGE, label: `merge:${domain}`, phase: 'Consolidate', schema: CANDIDATE }),
  (cand, [domain]) => parallel([                                          // 3 independent judges, held-out evidence only
    'would this have helped on these held-out sessions?',
    'is any claim really one project\'s convention, not domain technique?',
    'does its description collide with an existing global skill\'s trigger?',
  ].map(lens => () => agent(judgePrompt(cand, lens, HELD_OUT),
      { ...JUDGE, label: `gate:${domain}`, phase: 'Gate', schema: VERDICT })))
    .then(vs => ({ domain, cand, keep: vs.filter(Boolean).filter(v => v.pass).length >= 2 }))
)
return { staged: staged.filter(Boolean).filter(s => s.keep), rejected: staged.filter(s => s && !s.keep) }
```

**Extraction returns structured findings, never prose** — `{ domain, claim, evidence (session + what
happened), project, kind }` where `kind` is `technique` / `gotcha` / `preference`. A schema is what keeps
the cheap extractor honest; free-text summaries at this scale produce mush.

**The gate is the point.** A candidate is only staged if a majority of judges pass it against **held-out
sessions the extractors never saw**. Rejected candidates are returned with their reason, not silently
dropped — that is the rejected-edit record.

## Phase 3 — review, then adopt

The workflow **stages**; it never writes a live skill. Present per domain: the candidate diff against the
current skill, the judges' verdicts, and the rejected candidates. The user adopts per domain. On adopt,
back up the existing file first, and write `~/.claude/skills/<domain>/SKILL.md`.

**Bootstrapping is not validated optimization.** Against an empty starting skill nearly any candidate
"improves", so the first pass is *synthesis* — the gate only does real work from the second run onward.
Say so rather than presenting a first-run pass as evidence the skill is good.

## Governance — the parts that rot if ignored

- **Triggers must be disjoint.** Nested domains (`sql` ⊃ `postgres`/`bigquery`, and `duckdb` alongside)
  will fight each other: overlapping descriptions make Claude load the wrong skill. Give the general
  domain the portable technique, and make each dialect's description name its **discriminator**
  ("only when the target engine is DuckDB specifically").
- **Every global skill costs context forever.** Its description sits in *every* session's prompt. Keep the
  roster small (~10) and retire domains that stop earning their line.
- **One project is not a domain.** A claim seen in a single project is that project's convention until a
  second project confirms it — stage it marked **provisional**, or hold it. This is the most likely way a
  bad global skill gets created: mining a corpus dominated by one repo and globalising its habits.
- **Technique, not narrative.** A domain skill is instructions ("use `X` for Y because Z"), never a story
  about a past session.

## Re-running

Record the newest session timestamp consumed in `~/.claude/skills/.domains-checkpoint.json`. Later runs
mine only sessions after it, merge into the existing skills as bounded edits, and re-gate — so the skills
accumulate across projects instead of being rebuilt from scratch.
