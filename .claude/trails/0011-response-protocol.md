# Trail — 0011-response-protocol

> Add two conditional (NOT always-on) behavioural rules to `hooks/protocol.md`: an anchor + drift-check
> against the session's original question, and a lead-with-the-answer (BLUF) shape for substantial
> replies. Both gated so they trigger, not drone.

## Thought-trail

- **Trigger.** Over long sessions, a tangent drifts from the session's one question and never gets tied
  back — the user has to manually re-anchor, and context rots. Separately, substantial answers buried
  the conclusion under justification. The user wanted both fixed, codified in the injected protocol.
- **Decision: NOT under "Always-on rules".** Both rules are conditional — firing them every turn is the
  noise they're meant to fight. They get their own section, `## When it matters — trigger, don't drone`,
  each with an explicit trigger. This is the core of "I don't want it triggered all the time".
- **Drift-check.** An agent can't honestly compute a numeric "distance from goal" — that's fake
  precision. So: pin the anchor early (a flow's is product.md's North Star / the branch trail; else the
  opening request); on a real drift signal (~2+ exchanges off-anchor, or about to go deep off-path),
  STOP and surface a 3-line check — what the tangent is, how it relates, pursue/park/drop — and
  **re-anchor on return** ("Back to X:"). One check per drift, never a per-turn nag.
- **Lead-with-the-answer (BLUF), substantial replies only.** Shape: (1) solution → why → problem;
  (2) the solution in detail, why/problem taken as given; (3) an at-a-glance table/flowchart/diagram
  when it earns its place; (4) the rest (what was tried, sources) kept tight. Trigger is *agent-judged*
  "substantial deliverable", with terse-by-default as the fallback — chosen over an explicit user cue
  (predictable but needs the user to remember). It **extends** the existing "skeptical + concise" rule
  rather than fighting it, and is the conversational twin of `documentation`'s front-load ethos.
- **Not a skill (verified).** Ran `/skill-creator` to check fit: it optimises a SKILL.md *description*
  for trigger accuracy. These rules have no description and fire on conversation state, not user-request
  phrasing — a skill is pull-based, these are always-on-conditional. So protocol.md is the correct home;
  skill-creator does not apply.

## Outcome

- `hooks/protocol.md` — new `## When it matters — trigger, don't drone (NOT every turn)` section with
  the anchor + drift-check and lead-with-the-answer rules.
- `.claude/product.md` — new *What was tried* entry (0.4.0).
