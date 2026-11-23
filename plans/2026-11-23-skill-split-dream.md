# skill-split-dream - plan record

Planned 2026-11-23 in the `plan-skill-split-dream` worktree, on Claude Code 2.1.330 (Claude Code).

## The idea, as given

> Split the skills into a fixed plugin layer and a user layer, and add a dream skill. Decided with the user: the plugin keeps the output style, context.md, init, herdr, dream and eval, fixed and immune to edits; every other skill (plan, build, tickets, prototype, audit, tracker, documentation, typescript-node, ts-pattern, tsup) moves to templates/skills, and init copies it to ~/.claude/skills, where it runs as /plan, /build and so on. ~/.claude/skills becomes a git repo, and each user skill carries its own evals/ folder. Upgrades: the user's copy always wins; a template only sets the scene, and init lists what a template changed as offers, assuming nothing. Dream replaces retro: it reads the transcripts since the last dream, turns each repeated correction into an edit to a user skill, a rule file, the repo's CLAUDE.md or a lint rule, adds a case from the session that showed it, measures the edit with the eval skill, applies every edit the eval holds, and commits each one with its numbers so git revert undoes it. context.md keeps naming the session skills, as /plan, /prototype and /build. Spike done: claude plugin eval loads a copy of a user skill wrapped as a throwaway plugin (skills/ plus .claude-plugin/plugin.json); it triggered 2/2 from a prompt naming no skill and passed its answer check 2/2. Not yet checked: a round that loads the outputty plugin and the wrapper together. This reverses 406aaf2, which moved the skills from templates/skills into the plugin.

## The user's description, as given (mid round 1)

> Plugin has two tiers of skills - plugin and user skills. Plugin skills are static and unaffected. All other skills that it has are just recommendations that are expected to change during dreaming or by some outside process. All skills will come with a standard eval folder that tells how to validate the specific skill.
>
> Then the idea is that I will do work work work and then after some period of time I will launch a dreaming agent that will go through transcripts and rapidly classify it using haiku to see places that had:
>
> 1. A lot of tool use
> 2. Repeat reads
> 3. Sessions/subagents/forks that had long runs
>
> It will then attempt to find what went wrong, what the context was, what skills were loaded, and then come up with a targeted improvement of the skill.
>
> Agent then makes its changes and runs the baseline eval with changes. Then another eval without changes but with prompts that attempt to recreate the point of friction. And it will then loop a few times until the least amount of prompts will deliver the optimal result.
>
> I don't know if this is what you had in mind

## The user's note, as given (mid round 2)

> One thing you should note that this should apply only to skills that output itself is editing and making changes to, because the user might have installed some sort of other skill packs, and those should not be dreamt about or evaled. Only skills that the user itself manages should be evaluated. Same applies to rules. And to figure out which skills are those, Dreaming should have the liberty to prefix skills, skill names with something so that we target only our own skills. And during the onboarding phase, you could offer the user to onboard a skill into being managed by Output-e and then bringing it in line with how Output-e expects skills to look like and run an initial eval loop. Same applies to rules.

## Research

- `skills.md:217` (code.claude.com/docs/en/skills.md, fetched 2026-11-23), "Resolve skills that share a name": "In a local terminal session, your skill replaces the built-in command, but not its aliases." The general line at `skills.md:445` says a personal skill's `name` sets the typed command "unless another command already uses that name"; the table row is the specific case. PR #280 had inferred the opposite for `/plan`.
- `skills.md:445`: "The directory name also invokes the skill." So a folder prefix (`outputty-plan/`) keeps `name: plan` typed as `/plan`.
- `skills.md:227`: cloud sessions and cloud scheduled tasks don't read `~/.claude/skills/`. A cloud routine cannot run dream.
- `skills.md:168`: skills enabled for a claude.ai account sync to the machine; `~/.claude/skills/synced/` holds them (docx, pdf, ... and a manifest.json), rewritten by the app. The skills repo must not track it.
- `memory.md:178` (code.claude.com/docs/en/memory.md, fetched 2026-11-23): "All `.md` files are discovered recursively" in a rules folder. A rule file's eval cases cannot live under `~/.claude/rules`.
- `memory.md:261`: a symlinked rule outside the working directory is treated as an external import. No symlinks.
- `plugin-evals.md`, "How runs are isolated" (via a claude-code-guide agent): each run gets a temporary home and loads only the target plugin; "Nothing personal or project-level loads"; ship what a case depends on inside the plugin under test. Two plugins in one run: not stated.
- `plugins/loading.md` (via the agent): a folder under `~/.claude/skills/` with `.claude-plugin/plugin.json` loads in place as `<name>@skills-dir`, never copied.
- `skills/eval/SKILL.md` step 6 and Don't: a candidate is kept only when words loaded every session are not higher, and no candidate is longer than the text it replaces.
- `skills/eval/scripts/round.sh`: `cd`s into a plugin-repo worktree and runs `claude plugin eval .`; its word count reads `$dir/skills`.
- `skills/init/SKILL.md` Do: removes `~/.claude/skills/{plan,...}` on every run. `__tests__/skills.test.mjs:474-482` asserts `templates/skills` is absent and init copies no skill. Both flip.
- PR #280 body: the skills moved into the plugin because "The copies were never edited: every installed skill was identical to `main`'s template."
- A worktree-isolated session refuses any command holding `claude plugin eval`: "this command runs a string through eval, which can't be verified to stay inside the worktree". The `!` prefix is refused too; the user ran S2 from a separate terminal.

## Spikes

- **S0 (the user's, before this session, not reproduced here)**: `claude plugin eval` on a copy of one user skill wrapped as a throwaway plugin (`skills/` plus `.claude-plugin/plugin.json`) triggered 2/2 from a prompt naming no skill and passed its answer check 2/2. One skill loaded, no competing descriptions.
- **S1 `/plan`**: observable - a scratch repo with `.claude/skills/plan/SKILL.md` whose body says "Reply with exactly PLAN-SKILL-LOADED"; `claude -p "/plan add a --limit flag" --model haiku --max-turns 2` replies with that word, not plan mode, 2/2. Result: `PLAN-SKILL-LOADED` both runs, with the installed plugin's `/outputty:plan` also present. Passed.
- **S2 composed plugin**: observable - one throwaway plugin holding all 14 skills, `output-styles/`, and a SessionStart hook that `cat`s `context.md`, `rules/code.md` and `rules/typescript.md`; the existing `trigger-plan` case passes 2/2 and a `hook-standing` case (regex `The repo's own name`) passes 2/2. Result, `claude plugin eval . --model sonnet --runs 2 -j 2 --ablation none --trust-plugin --no-publish`, run by the user: `trigger-plan` 2/2 ("Skill called 1x" each run), `hook-standing` 2/2 ("matched The repo's own name" each run), 9 s, $0.28. Passed. The style itself was not graded.

## Questions and answers

The user's pick, word for word, after each question.

1. XY: build the split as asked - settled by the args.
2. Q1 What should dream flag in the transcripts? "Both (Recommended)" - a script counts tool calls, repeat reads and run length and marks correcting turns; Haiku labels the cause of flagged windows only.
3. Q2 What does "the least amount of prompts" count? "Tool calls and turns (Recommended)" - best of up to 3 wordings.
4. Q3 When is a dream edit kept? "Dream's own rule (Recommended)" - the friction case improves beyond the noise and no existing case drops below the base; words may grow; eval's length rule stays for slimming.
5. Q4 What gate replaces retro's apply/reword/drop? "Commit unattended (Recommended)" - evidence from user turns and tool names, paths and counts; tool output text never enters an edit.
6. Q5 What may dream edit? "All four (your args)" - user skills and rule files committed; repo `CLAUDE.md` lines and lint rules on a `dream/<date>` branch with a PR in that repo.
7. Q6 Which transcripts? "Every project (Recommended)" - since the `Dream-Through:` trailer on the last dream commit in `~/.claude/skills`.
8. Q7 How does eval load a user skill? "One composed plugin (Recommended)".
9. Q8 Which spikes run now? "S1 /plan (Recommended), S2 harness (Recommended)".
10. Q9 What does init compare against? "A template branch (Recommended)".
11. Q10 Where do a rule file's cases live? "In the skills repo (Recommended)" - `~/.claude/skills/evals/rules/<file>/<section>/<case>/`; two commits per rule edit.
12. Q11 Terms? "Accept (Recommended)" - Plugin skill, User skill, Dream (replaces retro), Friction, Offer; Check extended.
13. Q12 When does dream run? "On request (Recommended)".
14. Q13 Do the plugin skills also keep their cases in `skills/<name>/evals/`? "User skills only" - against the recommendation; plugin skills' cases stay in `evals/skills/`.
15. Q14 Dream edits flowing back into `templates/skills`? "Never" - templates change only by hand.
16. Q15 How does outputty mark a skill it manages? "Folder prefix, same name (Recommended)".
17. Q16 How does outputty mark a rule file it manages? "Same file prefix (Recommended)".
18. Q17 How does onboarding work? "Init offers, initial loop (Recommended)".
19. Q18 Friction from an unmanaged skill? "One report line (Recommended)".
20. Level: "Level 1, place in hand (Recommended)". Gating: "None (Recommended)". Grade: "Working (Recommended)". Stack: "No (Recommended)".
21. Sizing: "One ticket" - against the recommendation of four tickets with blockers.
22. Settled? First answer, a note: "add a note to rewrite the readme". Second: "Settled, file after S2 (Recommended)".

## Options dropped

- Refuse the case (every skill stays in the plugin; dream edits only rule files and `CLAUDE.md`) - the skills where friction lands would never change outside a release.
- Drop the split (auto-memory, `skill-creator`) - neither reads transcripts nor measures an edit against the skill's cases; inferred from their descriptions.
- Friction only, corrections only - Q1: a window with no correction gives no statement of what right was; corrections alone miss friction the user never named.
- Follow-up prompts or added words as the measure - Q2: one `prompt.md` gives no simulated multi-turn user; words alone ignore the friction.
- Eval's length rule for dream edits, or the friction case alone - Q3: most dream edits add a line; the friction case alone hides regressions.
- A branch the user merges, or a question per edit - Q4: the user chose unattended commits with `git revert` as the undo.
- User-level only, or skills only - Q5: the user kept all four destinations.
- This repo only, or a pick each time - Q6: the user skills are global.
- Two plugins per case - Q7: not documented to load together. The skill alone - no style, rules or competing descriptions.
- Diff the new template against the user's copy - Q9: the user's own edits show as changes. A version in frontmatter - needs the plugin's old tags.
- One rule source in the skills repo copied out - Q10: a copy step and drift. No saved rule cases - a later dream could not rerun them.
- Plugin tier / user tier - Q11: "Layer" stays a build step; plugin skill and user skill are the terms.
- A local `/loop` - Q12: needs a session left open.
- An upstream ticket, or upstreaming in this ticket - Q14: "Never".
- A name prefix (`/outputty-plan`), or tracked means managed - Q15: the folder prefix keeps `/plan`; a stray `git add` would manage a pack silently.
- A rules subfolder - Q16: one prefix pattern for skills and rules.
- Rename only, or a separate `/outputty:manage` skill - Q17: init offers and runs the initial loop.
- Drop unmanaged friction silently - Q18.
- Level 2, the user skills as a skills-directory plugin (`outputty-user@skills-dir`) - commands become `/outputty-user:plan`.
- A setting as a gate - no flag mechanism in the plugin; the version bump is the switch.
- Four or two tickets - the user chose one.

## Decisions

- Plugin skills: init, herdr, dream, eval, plus the style and `hooks/context.md`, fixed and shipped with each version. The ten others (plan, build, tickets, prototype, audit, tracker, documentation, typescript-node, ts-pattern, tsup) move to `templates/skills/`, each with its `evals/`.
- Init copies each to `~/.claude/skills/outputty-<name>/` with `name: <name>`; `/plan`, `/build` and the rest stay bare in `context.md`, herdr and the goal lines.
- `~/.claude/skills` and `~/.claude/rules` are git repos tracking only `outputty-*`; a `template` branch in each; init lists that branch's diff as offers; the user's copy always wins.
- Onboarding: init offers each unmanaged skill and rule (`synced/` excluded); a yes renames, reshapes, writes cases and runs the initial loop.
- Dream replaces retro, runs on request as `/outputty:dream`, reads every project's sessions since the last `Dream-Through:` marker, flags friction with a script and Haiku labels, edits managed files only, keeps an edit by its own rule, and commits each kept edit with its numbers.
- Eval measures a user skill or rule through one composed throwaway plugin per version, built by `compose.sh`.
- One ticket, no stack, no gate, grade working; the README is rewritten.
- This reverses #280 (406aaf2, 337d491).

## Review after filing

The advisor reviewed the filed ticket on the user's ask; each point was checked against its source.

- **S1 on the chosen shape**: `.claude/skills/outputty-plan/SKILL.md` with `name: plan` - `/plan` replied `PLAN-SKILL-LOADED` 2/2, `/outputty-plan` 1/1. Q15 holds.
- **Where eval runs**: the slim-style rounds ran `claude plugin eval .claude/worktrees/slim` from the primary checkout; a worktree session is refused. A known limit, written into How to validate.
- **Subagent runs**: `<session-id>/subagents/agent-*.jsonl`, 192 of them in this project's folder.
- **Open**: whether a real flagged window reproduces as an eval case on the fixture. #293 carries `needs-planning` until a spike shows it.
- Friction reproduction: "needs-planning + spike (Recommended)". Cap per dream: "Four (Recommended)". The plan skill's advisor check after a settled draft: "Amend #293 (your ask)". Fixes F1-F8: "Apply all (Recommended)".
- The user's ask, as given: "and amend the ticket to always ask the advisor to run after the user says that the ticket seems ready and we are ready to file it. Run a check using the advisor first to make sure that everything really is the way it's supposed to be, and there are no extra things added that don't or shouldn't belong to this specific ticket. Well, basically catch inaccuracies and see whether we actually have the minimum solution required to actually solve the problem, the root of the problem, that is."
