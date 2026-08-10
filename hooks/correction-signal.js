#!/usr/bin/env node
// outputty UserPromptSubmit hook: notice when the user is CORRECTING the assistant, and turn that
// moment into a memory operation. A correction is the highest-signal event in a session — it is the
// user paying to teach something the agent got wrong — and by default it is spent once and forgotten,
// so the same mistake returns next week.
//
// On a match it injects two instructions: recall first (a prior memory may already cover this, which
// makes the repeat the real finding), then record after resolving. It never blocks and never rewrites
// the prompt; a false positive costs a few tokens of advice the agent can ignore.
//
// PRECISION OVER RECALL, deliberately. Bare "no" or "don't" open ordinary instructions ("don't add a
// dependency"), so matching them would fire on half of all prompts and the advice would become noise
// the agent learns to skip. Every pattern below needs a correction-shaped phrase, not one word.
const fs = require("fs");

const CORRECTION_PATTERNS = [
  /\bthat(?:'s| is| was)? (?:not|wrong|incorrect|backwards)\b/i,
  /\bnot what i (?:said|meant|asked|wanted)\b/i,
  /\bi (?:said|told you|already said|asked for)\b/i,
  /\byou (?:were supposed to|should have|didn't|did not|forgot to|missed)\b/i,
  /\bwhy (?:did|are|would) you\b/i,
  /\b(?:revert|undo|roll ?back) (?:that|this|it|your)\b/i,
  /\b(?:no|nope),\s+(?:i|you|it|that|we|the)\b/i,
  /\bstop (?:doing|using|adding|trying|changing)\b/i,
  /\b(?:wrong|incorrect) (?:again|approach|answer|file|place)\b/i,
  /\bthat(?:'s| is)? still (?:wrong|broken|failing|not)\b/i,
  /\byou (?:keep|kept) (?:doing|adding|using|making)\b/i,
  /\bi (?:never|didn't|did not) (?:ask|say|want)\b/i,
  // Factual corrections of a claim or output, which read as statements rather than complaints:
  // "reports don't support mermaid, it must be svg".
  /\b(?:doesn't|does not|don't|do not|can't|cannot|won't|will not) (?:support|work|render|handle|allow|exist)\b/i,
  /\bit (?:must|has to|needs to) be\b/i,
];

const ADVICE = [
  "The user appears to be **correcting you**. Handle it as a memory operation, not just a fix:",
  "",
  "1. **Recall first.** Check stored memory for a lesson that already covers this. If one exists, you",
  "   repeated a known mistake — say so plainly, and treat *why the memory didn't reach you* as the real",
  "   finding (wrong trigger, too vague, wrong surface).",
  "2. **Then record**, once the correction is resolved and only if it is durable — a preference, a",
  "   convention, a gotcha that will recur. A one-off typo fix is not memory.",
  "3. **Route it to its owner.** A changed product decision → its product doc (`product.yaml`, `roadmap.yaml`, `architecture.yaml`). A behavioural lesson",
  "   about how to work → Claude Code auto-memory (`type: feedback`, with **Why** and **How to apply**).",
  "   Update the existing memory rather than adding a near-duplicate.",
  "",
  "Do not announce this reminder or thank the user for the correction — just apply it.",
].join("\n");

let input;
try {
  input = JSON.parse(fs.readFileSync(0, "utf8") || "{}");
} catch {
  process.exit(0);
}

const prompt = input.prompt_text || input.prompt || "";
if (!prompt || !CORRECTION_PATTERNS.some((re) => re.test(prompt))) process.exit(0);

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: ADVICE },
  }),
);
