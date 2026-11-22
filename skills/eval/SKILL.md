---
name: eval
description: Measures a change to a plugin's instruction files - its output style, its hook or a skill - with claude plugin eval, one section at a time - the current version and the changed one side by side on small cases tagged by section, kept only when the section's score holds and tool calls and tokens per prompt do not rise. Use as /outputty:eval followed by the file or section to change, on "eval this", "does this line earn its place", "slim the style", and before merging any change to output-styles/, hooks/ or skills/.
argument-hint: "<file or section> [the change]"
---

# eval

Input: a plugin's instruction file, and a change to one of its sections or the request to slim it. Output: each change kept or dropped by measurement, and the final and starting versions measured side by side: score per section, tool calls, tokens per prompt and reply words.

## Steps

Copy this checklist into your first reply and tick each item as it lands:

- [ ] 1. List the file's sections. For the section in hand, find its cases under `evals/<file>/<section>/`. When it has none, write one per behaviour the section claims, in the shape of [references/case.md](references/case.md).
- [ ] 2. Add a base worktree at `HEAD` with `git worktree add --detach`, and one candidate worktree per change. A candidate changes one section of the base and nothing else.
- [ ] 3. On the first round only, add a second worktree identical to the base and run it as a candidate: the gap between the two is the noise.
- [ ] 4. Run `${CLAUDE_SKILL_DIR}/scripts/round.sh <out-dir> <section> 3 <base> <candidate>...` in the background and wait for its notice. Use `all` in place of the section for every case.
- [ ] 5. Read the lines [scripts/measure.mjs](scripts/measure.mjs) prints, one per version: runs, tool calls, tokens, reply words, and passed/graded per section.
- [ ] 6. Keep a candidate when its section's passed count is at least the base's, beyond the noise when lower, and its tool calls, tokens and instruction words are not higher. Drop it otherwise.
- [ ] 7. Apply each kept change to the base worktree; the next round measures against it. Repeat from step 2 with the next change or section until no candidate is kept.
- [ ] 8. Run `all` with 3 runs on the starting version and the final one side by side. Report both lines, each kept and dropped change with its numbers, and each change no case reaches.

## Do

- Write a case as small as the behaviour allows: paste the code it needs into the prompt and grant no tools, unless the behaviour is how tools are used.
- Name every grader `<section>-<check>`, and tag every case with each section its graders check.
- Seed a case that needs a repo with `evals/fixture.sh`, linked into the case folder.
- Run the base and every candidate in the same round. Never compare with a round run earlier.
- Measure a file the plugin does not load itself, such as a rule file `init` installs, by adding it to the `SessionStart` hook's `cat` in the base and every candidate alike, uncommitted.
- Rewrite a grader that passes or fails in every run of every version: it measures nothing.
- Treat a cut no case reaches as untested: measure its tokens only, and name it to the user.
- Run the blank arm, `--ablation with-without`, once per section whose value against no plugin at all is in question.

## Don't

- Don't change two sections in one candidate.
- Don't name a project's code, data or domain in a case, and don't use the fixture's domain in the file under test.
- Don't write a candidate longer than the text it replaces; a wording that raises the score says it in fewer words.

## Glossary

- **Section** - one `##` part of an instruction file, and the tag of the cases that check it.
- **Case** - one prompt with its graders, under `evals/<file>/<section>/<name>/`.
- **Grader** - one check of a run, named `<section>-<check>`.
- **Base** - the version every candidate in a round is measured against.
- **Candidate** - the base with one change to one section.
- **Round** - the base and its candidates run side by side on one section's cases.
- **Noise** - the gap between the base and an identical copy of it in the same round.
