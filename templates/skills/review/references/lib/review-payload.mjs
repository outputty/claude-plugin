/** What a review posts: one inline thread per finding, and the report the build reads back. */
import { renderSteps } from "./steps.mjs";
import { firstSentence } from "./thread.mjs";
import { renderFinding, summarizeWork } from "./work-summary.mjs";

/** The body of one inline thread. */
export function findingBody(finding, letter, number) {
  const lines = [`[review ${letter}${number} ${finding.axis}] ${finding.claim}`, "", "Evidence: " + finding.evidence];
  if (finding.change) lines.push("Change: " + finding.change);
  if (finding.rule) lines.push("Rule: " + finding.rule);
  if (finding.question) lines.push("Question: " + finding.question);
  return lines.join("\n");
}

/** The payload of one review: the summary as its body and one inline thread per finding. */
export function buildReviewPayload(input) {
  return {
    commit_id: input.head,
    event: "COMMENT",
    body: input.summary,
    comments: input.findings.map((finding, index) => ({
      path: finding.file,
      line: finding.line,
      side: "RIGHT",
      body: findingBody(finding, input.letter, index + 1),
    })),
  };
}

/** What the build reads after a review or a docs check posted its threads: one line per thread, one per plan finding, then the next step. */
export function postReport(findings, letter, plan = [], stepsTaken = []) {
  const threadBlocks = findings.map((finding, index) => renderFinding(finding, letter + (index + 1)));
  const planLines = plan.map((item, index) => "P" + (index + 1) + " plan: " + firstSentence(item.claim));
  const title =
    findings.length +
    " thread" +
    (findings.length === 1 ? "" : "s") +
    " posted, " +
    plan.length +
    " plan finding" +
    (plan.length === 1 ? "" : "s");
  const steps = [];
  if (findings.length > 0)
    steps.push(
      "Address every thread: a fix commit and a reply with one pointer, never resolve. Then start a recheck at round 1.",
    );
  if (plan.length > 0)
    steps.push("File each P<n> as a needs-planning ticket per the tracker skill and start its own plan session.");
  if (steps.length === 0) steps.push("Nothing to address. Go on.");
  const stepLines = stepsTaken.length ? ["Steps taken:", ...renderSteps(stepsTaken)] : [];
  return [title, summarizeWork(findings), ...threadBlocks, ...planLines, ...stepLines, "Next: " + steps.join(" ")].join(
    "\n",
  );
}
