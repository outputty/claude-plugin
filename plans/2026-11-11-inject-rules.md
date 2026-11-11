# inject-rules - plan record

Planned 2026-11-11 in the `plan-inject-rules` worktree, on Claude Code 2.1.322.

## The idea, as given

> The outputty plugin stops editing users' CLAUDE.md files: init today merges templates/CLAUDE.user.md into ~/.claude/CLAUDE.md and the Flow and standing rules into each repo's CLAUDE.md. Instead the plugin supplies that text itself, and the repo's own CLAUDE.md keeps only what is the repo's (where things live, Language, This repo). Hard constraint: every injected line is as short and precise as possible, so it takes the least of the user's context; audit each line for whether it earns its place. Two shapes to spike and compare: (A) a plugin SessionStart hook in hooks/hooks.json returning hookSpecificOutput.additionalContext, which the docs say lands as a system reminder, matches startup, resume, clear, compact and fork, and is capped at 10,000 characters per string; (B) a plugin rule that always loads, like .claude/rules/\*.md without paths. The docs list no plugin rules component and say a plugin-root CLAUDE.md is never loaded, so (B) needs a spike before it is ruled out, along with any other always-loaded plugin component (a skill is loaded on demand only). Unverified, to spike: the exact SessionStart payload, the re-fire after compact, whether a repo can turn a user-scoped plugin on or off with enabledPlugins, and whether injected text weighs the same as CLAUDE.md. Also settle what init does with the entries it already merged into existing CLAUDE.md files, and that a plugin cannot switch on its output style. Sources: code.claude.com/docs/en/plugins-reference.md (Standard layout, Environment variables), hooks.md (Matcher patterns, JSON output), settings-reference.md#enabledplugins.

## Research

- `plugins-reference.md`, Standard layout: no rules component; a `CLAUDE.md` at the plugin root is not loaded, and `claude plugin validate` warns about it. A plugin's `settings.json` applies only `agent` and `subagentStatusLine`.
- `output-styles.md`, frontmatter table: `force-for-plugin: true` applies a plugin style whenever the plugin is enabled and overrides the user's `outputStyle`. This contradicts the premise that a plugin cannot switch on its output style.
- `hooks.md`, Add context for Claude: `additionalContext` is capped at 10,000 characters per string; over the cap Claude gets a file path and a preview. The page advises CLAUDE.md for static instructions and factual phrasing, since imperative out-of-band text can trigger prompt-injection defenses.
- `hooks.md`, SessionStart: matchers `startup`, `resume`, `clear`, `compact`, `fork`; plain stdout also becomes context.
- `memory.md`: CLAUDE.md is delivered as a user message after the system prompt; the project-root CLAUDE.md is re-injected after compaction.
- `sub-agents.md`, What loads at startup: general-purpose and custom subagents load every CLAUDE.md level; Explore and Plan skip it.
- `mcp.md`: MCP server instructions are cut at 4,096 characters.
- `settings-reference.md` and `plugins/loading.md`: `enabledPlugins` precedence is user < project < local < flag < managed, so a project's `false` beats a user's `true`.
- History: commits `13492e3` and `57b11f1` took the plugin hookless and made a CLAUDE.md block its one always-on surface; the roadmap's Killed list holds "a globally installed plugin as the product". The repo's output style template carried `force-for-plugin` until `21504fa`, where it had no effect on a copied user style.
- `main` moved during planning: #244 shipped `templates/skills/prototype` and the fork-spike line; the planning branch was fast-forwarded to `4210c41`.

## Spikes

Each ran with a throwaway plugin loaded by `--plugin-dir`, and read the session transcript and the rendered request, not only the model's reply.

- **S1, shape A with JSON output.** SessionStart fired on startup, resume, fork, compact and clear, with the payloads `hooks.md` documents. The text arrives as a `hook_additional_context` attachment rendered as a `role: system` turn, `SessionStart hook additional context: …`, after the first user message and in the same turn as the environment, the output style and the skill listing - not as a system reminder. CLAUDE.md arrives in the user turn under "OVERRIDE any default behavior … MUST follow". A resume with unchanged text adds no copy; with changed text it appends a second copy, kept until a compact; a compact leaves one. Neither an Explore nor a general-purpose subagent saw the text. A sampled canary was followed in every run from the hook (imperative or factual) and from CLAUDE.md, and no reply flagged it as an injection; the canary was too easy to show a difference in weight.
- **S2, shape B and every other always-loaded component.** A plugin's `rules/`, `.claude/rules/` and root `CLAUDE.md` never reach context; `validate` warns only about the CLAUDE.md. A forced plugin style loads as `<plugin>:<name>`, replaces the user's style without touching settings, and does not collide with a user style of the same name. MCP server instructions arrive cut at 4,096 characters and need a running process. A plugin's `agent` setting replaces Claude Code's whole system prompt. Prior art: the official `explanatory-output-style` plugin uses a SessionStart hook.
- **S3, enabledPlugins.** `false` for a user-scoped plugin in a repo's `.claude/settings.json` or `.claude/settings.local.json` removes its skills, in an untrusted folder too. A follow-up run showed the disabled plugin's SessionStart hook does not fire.
- **S4, subagents and style selection.** A SubagentStart hook's JSON `additionalContext` reaches both Explore and general-purpose subagents; its plain stdout does not. `outputStyle: "<plugin>:<name>"` selects an unforced plugin style; the bare name does not.
- **S5, plain stdout.** An exec-form `cat` SessionStart hook reaches Claude as a `role: system` turn labelled `SessionStart:<source> hook success:`. After a compact one copy is left, and a fork subagent inherits it.
- **S6, plain stdout on resume.** Unchanged text adds no copy on resume; changed text appends a second copy, the same as S1.

## Answers, word for word

1. Q1 who owns the outputty lines: "Plugin owns them (Recommended)".
2. Q8 personal tool line: "Leave the plugin (Recommended)".
3. Q9 lines only one skill needs: "Move them (Recommended)".
4. Q10 the Flow: "Cut it (Recommended)".
5. Q11 lines in the installed `~/.claude/CLAUDE.md` the template lacked: "Fold all three".
6. Mid-round, the user asked: "Wait, so what is the solution you landed on? How will we inject these user prompts?"
7. Q2 shape: "SessionStart only".
8. Q5 repos that do not use outputty: "Same text, opt out per repo (Recommended)".
9. Q6 entries already merged: "Remove by meaning, on yes (Recommended)".
10. Q4 output style: "Plugin forces it".
11. Q12 where the fix lands: "Plugin hook (Recommended)".
12. Q13 gating: "None (Recommended)".
13. Q14 grade: "Production grade (Recommended)".
14. Q15 stack: "One PR (Recommended)".
15. Q16 hook output: "Plain cat (Recommended)".
16. Q17 the copied style: "Remove on yes (Recommended)".
17. Q18 shared understanding: "Yes, draft the ticket".
18. Q19 where retro writes a reply correction: "Plugin style only".
19. Q20 ticket: "Settled, priority high (Recommended)".

## Options and why each was dropped

- A plugin rule or plugin-root CLAUDE.md (shape B): never loads (S2).
- MCP server instructions: cut at 4,096 characters and need a process (S2).
- The plugin `agent` setting: replaces Claude Code's system prompt (S2).
- The lines inside the forced output style: the same delivery as the hook, but it mixes reply style with code rules; Q2 picked the hook.
- A SubagentStart hook beside SessionStart: Q2 chose SessionStart only, so subagents other than forks get no outputty lines.
- JSON output through a `sh` script: Q16 chose plain `cat`.
- A copied `~/.claude/rules/outputty.md` the user owns: Q1 chose plugin ownership.
- Keeping today's merge: Q1.
- No always-on text, every line in the skill that applies it: a session with no skill running follows none of the lines (Q12).
- Injecting the repo-level lines only where init ran: Q5 chose one text with an opt-out.
- Leaving merged entries in place: Q6.
- An unforced style selected by `outputStyle: "outputty:outputty"`, or its own ticket: Q4 chose forcing it.
- Retro writing reply corrections into `~/.claude/CLAUDE.md` or the repo's CLAUDE.md: Q19 chose the plugin's style.

## Decisions

- The plugin root holds `hooks/hooks.json`, one SessionStart hook in exec form that runs `cat ${CLAUDE_PLUGIN_ROOT}/hooks/context.md`, and `output-styles/outputty.md` with `force-for-plugin: true`.
- `hooks/context.md` is `templates/CLAUDE.user.md`, moved, then audited: every kept line shortened; the personal tool line, the Flow, the scratch line and the linter line cut; the gating paragraph moved to build and the worktree line to herdr; the prototype tabs, the fork-spike line and "read a ticket's labels and comments, or the transcript, before stating its state" folded in; a first line saying CLAUDE.md wins where it disagrees.
- Init merges and copies nothing of this, and on a re-run removes by meaning, on the user's yes, the lines it merged earlier, the copied style and the `outputStyle` key.
- The same text reaches every repo; a repo opts out with `enabledPlugins` false.
- Retro sends reply corrections to the plugin's own style.
- No flag, production grade, one PR, priority high.
