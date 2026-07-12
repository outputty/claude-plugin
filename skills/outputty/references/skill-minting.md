# Minting a skill from the retrospective — read this before creating one

You're here because the mint bar (the retrospective step in build.md) is cleared. Two things before
writing: consult what's already stored, then write to Matt Pocock's writing-great-skills standard.

## 1. Consult stored memory first — build on it, don't start blank

- **Read the existing project skills** (`.claude/skills/*/SKILL.md`). A near-match → **patch it** with
  a targeted edit instead of minting a near-duplicate.
- **Installed-plugin skills (outputty's own) are read-only.** Never edit the plugin cache — a plugin
  update wipes it. If a plugin skill is what's deficient, record the lesson in auto-memory and consider
  an upstream contribution; fork locally only when the procedure genuinely differs.
- **Read the auto-memory** — the `MEMORY.md` index and topic files under
  `~/.claude/projects/<repo>/memory/`. Fold every stored lesson that bears on this procedure into the
  skill: the preference that shapes it, the gotcha it must avoid, the doc it depends on.
- **Read the expert knowledgebases** (`.claude/experts/<slug>.md`) if the procedure touches a grilled
  lens.
- After minting, **leave a back-pointer** in the auto-memory index ("procedure X now lives in skill
  Y"), so the next retro refines the skill instead of re-learning the lesson.

## 2. Write it to Pocock's standard

The new skill lives at **`.claude/skills/<name>/SKILL.md`** in the project repo, committed on the
feature branch so it ships with the PR. Pocock's governing virtue is **predictability**: the skill
makes the agent follow the same *process* each run. Every rule below serves that.

- **Leading words.** Anchor behaviour and invocation on a compact concept already in the model's
  pretraining (a *tight* loop, a *red* test) — one token that carries the intent, reused throughout.
- **Description = triggers, nothing else.** Front-load the leading word so it does invocation work
  immediately; **one trigger per branch** (synonyms renaming a branch are duplication); strip identity
  the body already states. Every word is paid context every turn.
- **Model- vs user-invoked.** Model-invoked only if the agent must reach it autonomously or another
  skill depends on it; else set `disable-model-invocation: true` to keep it off every-turn context.
- **Progressive disclosure.** Inline what *every* run needs; push what only some runs reach behind a
  pointer to a `references/*.md`, worded as an instruction — the pointer's wording, not its target,
  decides whether it's followed.
- **Co-locate** a concept's definition, rules, and caveats under one heading, so reading one part
  brings its neighbours.
- **Checkable completion criteria.** End each step with an exhaustive, checkable condition, so the
  agent can't declare done early.
- **Single source of truth.** Each fact in one authoritative place — one edit site, no drift.
- **Prune ruthlessly.** A sentence the model obeys by default is a no-op: delete the whole sentence,
  don't trim words.
- **State the positive.** Write the target behaviour, not the ban.

Before the skill lands, re-check the draft against every rule above.
