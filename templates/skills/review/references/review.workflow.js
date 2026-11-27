export const meta = {
  name: "review",
  description:
    "Reviews a pull request behind a commit pre-flight and posts each finding as a GitHub thread, re-checks the threads still open, or checks the docs",
  whenToUse:
    'From a build session with args {mode: "review" | "recheck" | "docs", pr, base, skillsDir}; a recheck adds {pinnedHead, round}; "depth" forces "lite" or "full"',
  phases: [
    { title: "Preflight", detail: "list the commits with their counts and stop on a blob or a message with no why" },
    { title: "Evidence", detail: "check the head out, gather the spec, the diff and the tool output" },
    { title: "Checklist", detail: "lite: one Sonnet agent ticks a checklist over the whole diff, for a small change" },
    { title: "Read", detail: "full: up to six axis readers, each on Haiku" },
    { title: "Docs", detail: "one reader over the documentation, after the docs layer" },
    { title: "Judge", detail: "open every cited source, clear findings, write the valid questions" },
    { title: "Recheck", detail: "list the threads, check them five at a time, read the fix commits" },
    { title: "Post", detail: "post, reply to, resolve and reopen threads on the PR" },
  ],
};

/*
 * HOW A REVIEW RUNS
 *
 * The build session starts this workflow once per run and reads two fields of what it returns:
 * "report" (print it as it is) and "next" (the one thing to do now). Everything else is bookkeeping.
 *
 * mode "review" - the review of a PR's code
 *   1. Pre-flight (Haiku): pin the head, list the commits with their code-line counts.
 *   2. Stop, in plain code, when one commit carries most of the diff or a message has no why.
 *   3. Choose the depth, in plain code: lite for a small change, full for a big one.
 *   4. lite: one Sonnet agent ticks a checklist over the whole diff.
 *      full: Haiku gathers the evidence, up to six Haiku readers each read one axis,
 *            and one Sonnet judge, with the advisor, opens every cited source and drops what fails.
 *   5. Post (Haiku): one inline GitHub thread per finding.
 *
 * mode "docs" - the check of the documentation, after the docs layer
 *   1. Pre-flight, 2. evidence, 3. one Haiku docs reader, 4. the judge, 5. post.
 *
 * mode "recheck" - settles the threads still open; it reviews no old code again
 *   1. List every review thread (Haiku) and compare the count with GitHub's own.
 *   2. Check the open threads and the ones the builder resolved, ten to a Sonnet agent.
 *   3. Read the fix commits for a problem they introduced (Sonnet).
 *   4. Post (Haiku): resolve what is fixed, reply on what is not, reopen what the builder closed.
 *   5. Decide the verdict, in plain code: clean, open, cap or incomplete.
 */

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

const AXES = ["standards", "spec", "correctness", "provenance", "tests", "simplicity"];
const MAX_RECHECKS = 2;
/** Threads one recheck agent checks: more per agent costs too much attention, one per agent costs too many agents. A short list fills one agent. */
const CHECK_BATCH = 10;
const SMALL_DIFF = 30;
/** A change under every one of these limits gets the lite review. */
const LITE_LIMITS = { codeLines: 80, testFiles: 3, filesAdded: 2, newExports: 2 };

// ---------------------------------------------------------------------------
// The three runs
// ---------------------------------------------------------------------------

/** Mode "review": pre-flight, then the lite or the full review of the code, then the post. */
async function orchestrateReview(input, paths) {
  phase("Preflight");
  const pinned = await listCommits(input, paths);
  const stops = preflightStops(pinned.commits);
  // A blob or a message with no why cannot be traced, so nothing is read until the builder splits the commits.
  if (stops.shas.length) return reportStop(stops);
  const depth = chooseDepth(input, pinned);
  log("review depth: " + depth.depth + (depth.reasons.length ? ", " + depth.reasons.join(", ") : ""));
  // A small change gets the one-agent checklist.
  if (depth.depth === "lite") return orchestrateLite(input, pinned, paths);
  return orchestrateFull(input, pinned, depth, paths);
}

/** The lite review: one Sonnet agent ticks a checklist over the whole diff, with no worktree and no install. */
async function orchestrateLite(input, pinned, paths) {
  phase("Checklist");
  const result = await runChecklist(input, pinned, paths);
  phase("Post");
  const judged = { findings: result.findings, dropped: 0, summary: "Lite review. " + result.summary };
  const posted = await postReview(input, pinned, judged, [], "F", paths);
  const unticked = result.boxes.filter((box) => !box.ok);
  const lines = listFindingLines(result.findings, "F").concat(unticked.map(describeUntickedBox));
  return reportFindings({
    title: "Lite review of PR " + input.pr + " at " + pinned.head,
    findings: result.findings,
    lines,
    head: pinned.head,
    url: posted.url,
    extra: { depth: "lite", boxes: result.boxes.length, ticked: result.boxes.length - unticked.length },
  });
}

/** The full review: evidence, up to six readers, the judge, then the post. */
async function orchestrateFull(input, pinned, depth, paths) {
  phase("Evidence");
  const evidence = { ...pinned, ...(await gatherEvidence(input, pinned, paths)) };
  phase("Read");
  const chosen = chooseAxes(pinned, evidence);
  chosen.skipped.forEach((entry) => log("axis skipped: " + entry.axis + ", " + entry.reason));
  const reports = (await parallel(chosen.run.map((axis) => () => readAxis(axis, evidence, paths)))).filter(Boolean);
  if (reports.length < chosen.run.length)
    log("readers lost: " + (chosen.run.length - reports.length) + " of " + chosen.run.length + " returned nothing");
  phase("Judge");
  const judged = await judgeFindings(evidence, reports, chosen.run, paths);
  phase("Post");
  const posted = await postReview(input, evidence, judged, chosen.skipped, "F", paths);
  return reportFindings({
    title: "Full review of PR " + input.pr + " at " + evidence.head + ", axes " + chosen.run.join(", "),
    findings: judged.findings,
    lines: listFindingLines(judged.findings, "F"),
    head: evidence.head,
    url: posted.url,
    extra: {
      depth: "full",
      whyFull: depth.reasons,
      axes: chosen.run,
      skipped: chosen.skipped,
      readersLost: chosen.run.length - reports.length,
    },
  });
}

/** Mode "docs": the documentation check, its own run after the docs layer: one Haiku reader over the docs the project names. */
async function orchestrateDocs(input, paths) {
  phase("Preflight");
  const pinned = await listCommits(input, paths);
  phase("Evidence");
  const evidence = { ...pinned, ...(await gatherEvidence(input, pinned, paths)) };
  phase("Docs");
  const report = await readDocs(evidence, paths);
  phase("Judge");
  const judged = await judgeFindings(evidence, [report], ["docs"], paths);
  phase("Post");
  const posted = await postReview(input, evidence, judged, [], "D", paths);
  return reportFindings({
    title: "Docs check of PR " + input.pr + " at " + evidence.head,
    findings: judged.findings,
    lines: listFindingLines(judged.findings, "D"),
    head: evidence.head,
    url: posted.url,
    extra: { depth: "docs" },
  });
}

/** Mode "recheck": settles the threads still open and reads the fix commits, and decides what the build does next. */
async function orchestrateRecheck(input, paths) {
  phase("Recheck");
  // 1. Every review thread, counted against GitHub's own count.
  const state = await gatherThreads(input, paths);
  // A listing short of GitHub's count cannot say which threads are open, so nothing is posted.
  if (state === null) return reportRecheck({ input, verdict: "incomplete", lines: [], left: 0, head: "", url: "" });
  // 2. The threads that need a check, ten to an agent.
  const toCheck = state.threads.filter(isReviewThread).filter(needsCheck);
  const reopen = toCheck.filter(isClosedByBuilder);
  const checked = await checkAllThreads(toCheck, state, paths);
  const unchecked = toCheck.filter((thread) => !checked.some((check) => check.id === thread.id));
  if (unchecked.length > 0) log("threads not checked: " + unchecked.length + " of " + toCheck.length);
  // 3. The fix commits, for a problem a fix introduced.
  const fresh = (await readFixes(input, state, paths)).findings;
  // 4. Resolve, reply, reopen and post.
  phase("Post");
  const posted = await postRecheck(input, state, checked, reopen, fresh, paths);
  // 5. The verdict.
  const left = countOpen(checked, fresh);
  const verdict = decideVerdict(left, input.round, unchecked.length);
  const lines = listRecheckLines(state, checked, reopen, unchecked, fresh);
  return reportRecheck({
    input,
    verdict,
    lines,
    left,
    head: state.head,
    url: posted.url,
    posted,
    reopen,
    fresh,
    unchecked,
  });
}

// ---------------------------------------------------------------------------
// What the build session is told
// ---------------------------------------------------------------------------

/** The result of a pre-flight stop: the commits to split, and how. */
function reportStop(stops) {
  const next =
    "Split these commits: reset each, redo it as separate commits each with its why in the message body, push, then run the review again. " +
    stops.reason;
  return {
    verdict: "stop",
    splitShas: stops.shas,
    reason: stops.reason,
    report: "Pre-flight stopped the review: " + stops.reason,
    next,
  };
}

/** The result of a review or a docs check: one line per thread posted, and what to do about them. */
function reportFindings(run) {
  const count = run.findings.length;
  const verdict = count ? "findings" : "clean";
  const report = [run.title + ": " + count + " finding" + (count === 1 ? "" : "s") + " posted"]
    .concat(run.lines)
    .join("\n");
  return {
    verdict,
    findings: count,
    head: run.head,
    url: run.url,
    report,
    next: nextAfterFindings(run, verdict),
    ...run.extra,
  };
}

function nextAfterFindings(run, verdict) {
  // Nothing was found, so there is nothing to address.
  if (verdict === "clean") return "Nothing to address. Go on.";
  return (
    "Address every thread: a fix commit and a reply with one pointer, never resolve. Then run the recheck at pinnedHead " +
    run.head +
    ", round 1."
  );
}

/** The result of a recheck: what it resolved, reopened, found new and left open, and what to do next. */
function reportRecheck(run) {
  const open = run.left;
  const resolved = run.posted ? run.posted.resolved : 0;
  const reopened = run.reopen ? run.reopen.length : 0;
  const fresh = run.fresh ? run.fresh.length : 0;
  const unchecked = run.unchecked ? run.unchecked.length : -1;
  const title =
    "Recheck round " + run.input.round + " of PR " + run.input.pr + ": " + run.verdict + ", " + open + " open";
  return {
    verdict: run.verdict,
    open,
    resolved,
    reopened,
    fresh,
    unchecked,
    head: run.head,
    url: run.url,
    report: [title].concat(run.lines).join("\n"),
    next: nextAfterRecheck(run.verdict, open, run.input.round),
  };
}

function nextAfterRecheck(verdict, open, round) {
  // Every thread is resolved: the review is done.
  if (verdict === "clean") return "Every thread is resolved. Go on.";
  // A thread went unchecked: the listing or a check fell short, nothing was decided, and the round does not count.
  if (verdict === "incomplete")
    return "Run the recheck again at the same round " + round + ": the round does not count.";
  // The cap is reached: the open threads stay on the PR for the user.
  if (verdict === "cap")
    return "Leave the " + open + " open threads for the user and name their count in the READY message.";
  return "Address what is still open, then run the recheck again at round " + (round + 1) + ".";
}

/** First sentence of a finding or a reply, cut to one line for the build's list. */
function firstSentence(text) {
  return text.split("\n")[0].split(". ")[0].slice(0, 160);
}

function listFindingLines(findings, letter) {
  return findings.map(
    (finding, index) =>
      letter +
      (index + 1) +
      " " +
      finding.axis +
      " " +
      finding.file +
      ":" +
      finding.line +
      ": " +
      firstSentence(finding.claim),
  );
}

function describeUntickedBox(box) {
  return "box " + box.id + " not ticked: " + firstSentence(box.quote);
}

/** One line per checked thread, per unchecked thread and per new finding of a recheck. */
function listRecheckLines(state, checked, reopen, unchecked, fresh) {
  const markers = new Map(state.threads.map((thread) => [thread.id, firstSentence(thread.marker)]));
  const reopened = new Set(reopen.map((thread) => thread.id));
  const checkLines = checked.map(
    (check) =>
      (check.resolved ? "resolved" : "open") +
      (reopened.has(check.id) ? " (reopened)" : "") +
      " " +
      markers.get(check.id) +
      " -> " +
      firstSentence(check.reply),
  );
  const uncheckedLines = unchecked.map((thread) => "unchecked " + firstSentence(thread.marker));
  return checkLines.concat(uncheckedLines, listFindingLines(fresh, "N"));
}

// ---------------------------------------------------------------------------
// Decisions, in plain code
// ---------------------------------------------------------------------------

/** Fails fast on arguments the builder got wrong, before any agent costs tokens. */
function checkArgs(input) {
  if (input && input.depth && !["lite", "full"].includes(input.depth))
    throw new Error('args.depth must be "lite" or "full"');
  if (!input || !["review", "full", "recheck", "docs"].includes(input.mode))
    throw new Error('args.mode must be "review", "recheck" or "docs"');
  if (!input.pr || !input.base || !input.skillsDir) throw new Error("args needs pr, base and skillsDir");
  if (input.mode === "recheck" && (!input.pinnedHead || !input.round))
    throw new Error("a recheck needs pinnedHead and round");
}

/** The paths every agent of this run reads its brief and the tracker commands from. */
function readPaths(skillsDir) {
  return { review: skillsDir + "/outputty-review", tracker: skillsDir + "/outputty-tracker/SKILL.md" };
}

function totalCodeLines(commits) {
  return commits.reduce((sum, commit) => sum + commit.codeLines, 0);
}

function carriesMostOfDiff(commit, total) {
  // Without code lines no commit can carry most of them.
  if (total === 0) return false;
  return commit.codeLines * 2 > total;
}

/** The pre-flight in plain code: the commits that carry most of the diff's code lines, and those whose message has no body. */
function preflightStops(commits) {
  const total = totalCodeLines(commits);
  const blobs = commits.filter((commit) => carriesMostOfDiff(commit, total)).map((commit) => commit.sha);
  const noWhy = commits.filter((commit) => !commit.hasBody).map((commit) => commit.sha);
  const reasons = [];
  if (blobs.length) reasons.push("carries most of the diff: " + blobs.join(", "));
  if (noWhy.length) reasons.push("message has no why in its body: " + noWhy.join(", "));
  return { shas: [...new Set([...blobs, ...noWhy])], reason: reasons.join("; ") };
}

/** The reasons a PR needs the full review; none means it is small enough for the one-agent checklist. */
function fullReasons(pinned) {
  const codeLines = totalCodeLines(pinned.commits);
  const reasons = [];
  if (codeLines >= LITE_LIMITS.codeLines) reasons.push(codeLines + " code lines");
  if (pinned.facts.testFiles > LITE_LIMITS.testFiles) reasons.push(pinned.facts.testFiles + " test files changed");
  if (pinned.facts.filesAdded > LITE_LIMITS.filesAdded) reasons.push(pinned.facts.filesAdded + " files added");
  if (pinned.facts.newExports > LITE_LIMITS.newExports) reasons.push(pinned.facts.newExports + " new exports");
  if (pinned.facts.newDependencies) reasons.push("a new dependency");
  return reasons;
}

/** The depth of this review: the builder's override, else lite for a small change and full for a big one. */
function chooseDepth(input, pinned) {
  // The builder asked for a depth.
  if (input.depth) return { depth: input.depth, reasons: [] };
  const reasons = fullReasons(pinned);
  // Nothing in the counts makes the change big.
  if (reasons.length === 0) return { depth: "lite", reasons };
  return { depth: "full", reasons };
}

function skipWithoutCode(facts) {
  // A diff with no code lines has no code for the Standards or Correctness reader to read.
  if (facts.codeLines === 0) return "no code lines changed";
  return "";
}

function skipWithoutSpec(facts) {
  // The Spec reader compares the diff to a ticket's criteria; without a spec there is nothing to compare.
  if (!facts.specAvailable) return "no spec available";
  return "";
}

function skipWithoutTests(facts) {
  // The Tests reader maps criteria to new tests; with neither a spec nor a test file there is nothing to map.
  if (facts.codeLines === 0) return "no code lines changed";
  if (facts.specAvailable) return "";
  if (facts.testFiles > 0) return "";
  return "no spec and no test file";
}

function skipWithoutNew(facts) {
  // The Provenance reader asks where each new file, export and dependency came from; with none, nothing is new.
  if (facts.filesAdded > 0) return "";
  if (facts.newExports > 0) return "";
  if (facts.newDependencies) return "";
  return "no added file, export or dependency";
}

function skipSmall(facts) {
  // The Simplicity reader compares the diff to a smaller change; a very small diff has none.
  if (facts.codeLines < SMALL_DIFF) return "under " + SMALL_DIFF + " code lines";
  return "";
}

const SKIPS = {
  standards: skipWithoutCode,
  spec: skipWithoutSpec,
  correctness: skipWithoutCode,
  provenance: skipWithoutNew,
  tests: skipWithoutTests,
  simplicity: skipSmall,
};

/** The axes this run reads, decided from the pre-flight counts and the spec, and the ones it skips with their reasons. */
function chooseAxes(pinned, evidence) {
  const facts = { ...pinned.facts, codeLines: totalCodeLines(pinned.commits), specAvailable: evidence.specAvailable };
  const skipped = AXES.map((axis) => ({ axis, reason: SKIPS[axis](facts) })).filter((entry) => entry.reason);
  const run = AXES.filter((axis) => !skipped.some((entry) => entry.axis === axis));
  return { run, skipped };
}

function isReviewThread(thread) {
  return thread.marker.startsWith("[review");
}

/** A thread the builder resolved without the review's closing reply. */
function isClosedByBuilder(thread) {
  // Only the review closes a thread, so a resolved thread with no closing reply was closed by the builder.
  if (!thread.isResolved) return false;
  return !thread.closedByReview;
}

/** A thread still open, or one the builder closed and the review reopens. */
function needsCheck(thread) {
  // An open thread has not been cleared by the review yet.
  if (!thread.isResolved) return true;
  return isClosedByBuilder(thread);
}

/** True when the listing holds every review thread GitHub counts on the PR. */
function isListingComplete(state) {
  return state.threads.length === state.total - state.others;
}

/** Counts what stays open after a recheck: unresolved checks plus new threads. */
function countOpen(checked, fresh) {
  return checked.filter((check) => !check.resolved).length + fresh.length;
}

function decideVerdict(left, round, unchecked) {
  // A thread was left unchecked, so "clean" or "open" would be a guess: the round does not count and the recheck runs again.
  if (unchecked > 0) return "incomplete";
  // Nothing is open, so the review is done.
  if (left === 0) return "clean";
  // The cap is reached: a further check only finds new things, so the open threads go to the user.
  if (round >= MAX_RECHECKS) return "cap";
  return "open";
}

function axisOf(thread) {
  // A marker reads "[review F1 tests] ...": the third word is the axis.
  return thread.marker.split(" ")[2] || "";
}

/** The threads ordered by file, then axis, so neighbours are similar; cutting the order into groups of CHECK_BATCH keeps similar threads together and fills every agent, so a lone thread joins its neighbours. */
function groupSimilar(threads) {
  const key = (thread) => (thread.path || "") + " " + axisOf(thread);
  return [...threads].sort((left, right) => key(left).localeCompare(key(right)));
}

function withoutDiff(thread) {
  const { fixDiff, ...rest } = thread;
  return rest;
}

function diffsByPath(batch) {
  return Object.fromEntries(batch.map((thread) => [thread.path || "", thread.fixDiff]));
}

/** The items in groups of at most size, in order. */
function chunk(items, size) {
  const groups = [];
  for (let start = 0; start < items.length; start += size) groups.push(items.slice(start, start + size));
  return groups;
}

// ---------------------------------------------------------------------------
// Steps that start an agent, in the order a run meets them
// ---------------------------------------------------------------------------

/** Pre-flight, on Haiku: pins the head and lists the commits with their counts, before anything else costs tokens. */
function listCommits(input, paths) {
  const prompt =
    "Follow " + paths.review + "/references/preflight-brief.md for PR " + input.pr + " with base " + input.base + ".";
  return agent(prompt, { phase: "Preflight", model: "haiku", schema: PINNED, label: "Pre-flight" });
}

function toolsNote(input) {
  // The docs check reads documentation, so it needs no dependencies and no tool output.
  if (input.mode === "docs")
    return " Skip the install and the typecheck and lint run: the docs check needs no tool output.";
  return "";
}

/** Checks the head out into its own worktree and writes the spec, diff and tool output under the evidence directory: gathering only, so Haiku. */
function gatherEvidence(input, pinned, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/evidence-brief.md for PR " +
    input.pr +
    ", head " +
    pinned.head +
    ", fixed point " +
    pinned.fixedPoint +
    ", evidence directory " +
    pinned.dir +
    ". Check out nothing in the current worktree: use a detached worktree of the head. The tracker commands are in " +
    paths.tracker +
    "." +
    toolsNote(input);
  return agent(prompt, { phase: "Evidence", model: "haiku", schema: EVIDENCE, label: "Evidence" });
}

/** The lite review: one Sonnet agent ticks a checklist over the whole diff against the parent. */
function runChecklist(input, pinned, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/lite-brief.md and " +
    paths.review +
    "/references/reader-contract.md for PR " +
    input.pr +
    ", head " +
    pinned.head +
    ", fixed point " +
    pinned.fixedPoint +
    ", evidence directory " +
    pinned.dir +
    ". The tracker commands are in " +
    paths.tracker +
    ".";
  return agent(prompt, { phase: "Checklist", model: "sonnet", effort: "high", schema: LITE, label: "Checklist" });
}

/** One reader per axis, each handed the evidence directory and its brief. */
function readAxis(axis, evidence, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/" +
    axis +
    "-brief.md and " +
    paths.review +
    "/references/reader-contract.md. Its placeholders are: diff = git -C " +
    evidence.tree +
    " diff " +
    evidence.fixedPoint +
    "..." +
    evidence.head +
    "; commit list, sources, ticket and tool output = the files in " +
    evidence.dir +
    "; smell baseline = " +
    paths.review +
    '/references/smells.md, read whole. Return the findings through the schema, one per finding, with the axis name "' +
    axis +
    '".';
  return agent(prompt, { phase: "Read", model: "haiku", effort: "high", schema: FINDINGS, label: axis });
}

/** The docs reader: one Haiku agent over the docs the project names. */
function readDocs(evidence, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/docs-brief.md. Evidence: " +
    evidence.dir +
    ", tree " +
    evidence.tree +
    ", head " +
    evidence.head +
    ", fixed point " +
    evidence.fixedPoint +
    '. Return the findings through the schema, with the axis name "docs".';
  return agent(prompt, { phase: "Docs", model: "haiku", effort: "high", schema: FINDINGS, label: "docs" });
}

/** The judge, on Sonnet with the advisor: opens every cited source itself, drops what fails, keeps the valid questions. */
function judgeFindings(evidence, reports, run, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/judge-brief.md. Evidence: " +
    evidence.dir +
    ", tree " +
    evidence.tree +
    ", head " +
    evidence.head +
    ". The readers that ran were " +
    run.join(", ") +
    "; they reported: " +
    JSON.stringify(reports);
  return agent(prompt, { phase: "Judge", model: "sonnet", effort: "high", schema: JUDGED, label: "Judge" });
}

function cleanupNote(evidence) {
  const removal = "Then remove the evidence directory " + evidence.dir + ".";
  // A lite review made no worktree.
  if (!evidence.tree) return removal;
  // The review's worktree stays: the recheck moves it to the new head, and the build removes it when the ticket closes.
  return removal + " Keep the worktree " + evidence.tree + ": the recheck reuses it.";
}

/** Posts the review with one inline thread per finding, and the summary as its body. */
function postReview(input, evidence, judged, skipped, letter, paths) {
  const prompt =
    "Post the review of PR " +
    input.pr +
    ' with the "Post a review with inline threads" commands of ' +
    paths.tracker +
    " and the summary shape of " +
    paths.review +
    "/references/report.md. Pinned head " +
    evidence.head +
    ". Each thread body starts with the marker [review " +
    letter +
    "<n> <axis>], n counting from 1 in this order. Findings: " +
    JSON.stringify(judged.findings) +
    ". Dropped by the judge: " +
    judged.dropped +
    ". Summary: " +
    judged.summary +
    ". Axes not run, with their reasons, go under Not run: " +
    JSON.stringify(skipped) +
    ". " +
    cleanupNote(evidence) +
    " Resolve nothing.";
  return agent(prompt, { phase: "Post", model: "haiku", schema: POSTED, label: "Post review" });
}

/** Lists every review thread of the PR and the diff each one's path took since the pinned head. */
function listThreads(input, paths, note) {
  const prompt =
    "Follow " +
    paths.review +
    '/references/recheck-brief.md, part "Gather", for PR ' +
    input.pr +
    " with pinned head " +
    input.pinnedHead +
    ". The tracker commands are in " +
    paths.tracker +
    ". " +
    note;
  return agent(prompt, { phase: "Recheck", model: "haiku", schema: THREADS, label: "Threads" });
}

/** The thread listing, asked for again once when it comes back short of GitHub's own count. */
async function gatherThreads(input, paths) {
  const first = await listThreads(input, paths, "List every review thread, not only the ones with replies.");
  if (isListingComplete(first)) return first;
  const missing = first.total - first.others - first.threads.length;
  const retry = await listThreads(
    input,
    paths,
    "The last listing was short by " + missing + " threads. List all of them, ten per call, until the count matches.",
  );
  if (isListingComplete(retry)) return retry;
  return null;
}

/** Up to CHECK_BATCH threads, each against the commits that claim to fix it, by one agent. A file's diff is sent once, however many threads sit on it. */
async function checkThreads(batch, number, state, paths) {
  const prompt =
    "Follow " +
    paths.review +
    '/references/recheck-brief.md, part "Check threads". Tree ' +
    state.tree +
    ", head " +
    state.head +
    ". Return one check for each of these " +
    batch.length +
    " threads: " +
    JSON.stringify(batch.map(withoutDiff)) +
    ". The diff each file took since the pinned head: " +
    JSON.stringify(diffsByPath(batch));
  const result = await agent(prompt, {
    phase: "Recheck",
    model: "sonnet",
    effort: "high",
    schema: CHECKS,
    label: "Checks " + number,
  });
  return result.checks;
}

/** Every thread to check, similar ones together in groups of CHECK_BATCH run side by side; only checks for a thread asked about are kept. */
async function checkAllThreads(toCheck, state, paths) {
  const batches = chunk(groupSimilar(toCheck), CHECK_BATCH);
  const returned = await parallel(batches.map((batch, index) => () => checkThreads(batch, index + 1, state, paths)));
  const asked = new Set(toCheck.map((thread) => thread.id));
  return returned
    .filter(Boolean)
    .flat()
    .filter((check) => asked.has(check.id));
}

/** The fix commits only, for a problem a fix introduced. */
function readFixes(input, state, paths) {
  const prompt =
    "Follow " +
    paths.review +
    '/references/recheck-brief.md, part "Read the fixes", over git -C ' +
    state.tree +
    " diff " +
    input.pinnedHead +
    ".." +
    state.head +
    ". Return only problems the fix commits introduced, through the schema.";
  return agent(prompt, { phase: "Recheck", model: "sonnet", effort: "high", schema: FINDINGS, label: "Fixes" });
}

/** Resolves what the checks cleared, replies on what is still open, reopens what the builder closed, posts new threads. */
function postRecheck(input, state, checked, reopen, fresh, paths) {
  const prompt =
    "On PR " +
    input.pr +
    ", with the thread commands of " +
    paths.tracker +
    ": for each checked thread with resolved=true, post its reply starting [review closed <marker>], then resolve it; for each with resolved=false, post its reply and leave it open; first unresolve each thread in this list and reply [review reopened <marker>], because the builder resolved it: " +
    JSON.stringify(reopen.map((thread) => thread.id)) +
    "; post each new finding as a thread starting [review N<n> <axis>], n counting from 1. Checked: " +
    JSON.stringify(checked) +
    ". New: " +
    JSON.stringify(fresh) +
    ". A reopened thread is then handled like any other checked thread. Keep the worktree " +
    state.tree +
    ": the build removes it when the ticket closes.";
  return agent(prompt, { phase: "Post", model: "haiku", schema: POSTED, label: "Post recheck" });
}

// ---------------------------------------------------------------------------
// What each agent returns
// ---------------------------------------------------------------------------

const FINDING = {
  type: "object",
  properties: {
    axis: { type: "string" },
    file: { type: "string" },
    line: { type: "integer" },
    claim: { type: "string" },
    evidence: { type: "string" },
    rule: { type: "string" },
    question: { type: "string" },
  },
  required: ["axis", "file", "line", "claim", "evidence"],
};
const FINDINGS = {
  type: "object",
  properties: { findings: { type: "array", items: FINDING } },
  required: ["findings"],
};
const COMMIT = {
  type: "object",
  properties: {
    sha: { type: "string" },
    subject: { type: "string" },
    hasBody: { type: "boolean" },
    codeLines: { type: "integer" },
  },
  required: ["sha", "subject", "hasBody", "codeLines"],
};
const PINNED = {
  type: "object",
  properties: {
    head: { type: "string" },
    fixedPoint: { type: "string" },
    dir: { type: "string" },
    commits: { type: "array", items: COMMIT },
    facts: {
      type: "object",
      properties: {
        filesAdded: { type: "integer" },
        testFiles: { type: "integer" },
        docFiles: { type: "integer" },
        newExports: { type: "integer" },
        newDependencies: { type: "boolean" },
      },
      required: ["filesAdded", "testFiles", "docFiles", "newExports", "newDependencies"],
    },
  },
  required: ["head", "fixedPoint", "dir", "commits", "facts"],
};
const EVIDENCE = {
  type: "object",
  properties: { tree: { type: "string" }, specAvailable: { type: "boolean" } },
  required: ["tree", "specAvailable"],
};
const JUDGED = {
  type: "object",
  properties: {
    findings: { type: "array", items: FINDING },
    dropped: { type: "integer" },
    summary: { type: "string" },
  },
  required: ["findings", "dropped", "summary"],
};
const THREAD = {
  type: "object",
  properties: {
    id: { type: "string" },
    marker: { type: "string" },
    path: { type: "string" },
    line: { type: "integer" },
    isResolved: { type: "boolean" },
    closedByReview: { type: "boolean" },
    finding: { type: "string" },
    replies: { type: "string" },
    fixDiff: { type: "string" },
  },
  required: ["id", "marker", "isResolved", "closedByReview", "finding", "replies", "fixDiff"],
};
const THREADS = {
  type: "object",
  properties: {
    head: { type: "string" },
    tree: { type: "string" },
    dir: { type: "string" },
    threads: { type: "array", items: THREAD },
    total: { type: "integer" },
    others: { type: "integer" },
  },
  required: ["head", "tree", "dir", "threads", "total", "others"],
};
const CHECKED = {
  type: "object",
  properties: {
    id: { type: "string" },
    resolved: { type: "boolean" },
    reply: { type: "string" },
    source: { type: "string" },
  },
  required: ["id", "resolved", "reply", "source"],
};
const CHECKS = {
  type: "object",
  properties: { checks: { type: "array", items: CHECKED } },
  required: ["checks"],
};
const BOX = {
  type: "object",
  properties: { id: { type: "integer" }, ok: { type: "boolean" }, quote: { type: "string" } },
  required: ["id", "ok", "quote"],
};
const LITE = {
  type: "object",
  properties: {
    boxes: { type: "array", items: BOX },
    findings: { type: "array", items: FINDING },
    summary: { type: "string" },
  },
  required: ["boxes", "findings", "summary"],
};
const POSTED = {
  type: "object",
  properties: {
    url: { type: "string" },
    posted: { type: "integer" },
    resolved: { type: "integer" },
    reopened: { type: "integer" },
  },
  required: ["url", "posted", "resolved", "reopened"],
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

checkArgs(args);
const paths = readPaths(args.skillsDir);
// "full" is the old name of the review mode, kept so a session that loaded the old skill text still runs.
const MODES = {
  review: orchestrateReview,
  full: orchestrateReview,
  recheck: orchestrateRecheck,
  docs: orchestrateDocs,
};
return MODES[args.mode](args, paths);
