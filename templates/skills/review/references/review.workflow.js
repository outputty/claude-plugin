export const meta = {
  name: "review",
  description:
    "Reviews a pull request on six axes behind a commit pre-flight and posts each finding as a GitHub thread, or re-checks the threads still open",
  whenToUse:
    'From a build session with args {mode: "full" | "recheck", pr, base, skillsDir}; a recheck adds {pinnedHead, round}',
  phases: [
    { title: "Preflight", detail: "list the commits with their counts and stop on a blob or a message with no why" },
    { title: "Evidence", detail: "check the head out, gather the spec, the diff and the tool output" },
    { title: "Docs", detail: "one reader over the documentation, after the six axes and the docs layer" },
    { title: "Read", detail: "up to six axis readers, each on Haiku" },
    { title: "Judge", detail: "open every cited source, clear findings, write the valid questions" },
    { title: "Recheck", detail: "one check per open thread, and one pass over the fix commits" },
    { title: "Post", detail: "post, reply to, resolve and reopen threads on the PR" },
  ],
};

const AXES = ["standards", "spec", "correctness", "provenance", "tests", "simplicity"];
const MAX_RECHECKS = 2;
const SMALL_DIFF = 30;

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
  },
  required: ["head", "tree", "dir", "threads"],
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

/** The paths every agent of this run reads its brief and the tracker commands from. */
function readPaths(skillsDir) {
  return { review: skillsDir + "/outputty-review", tracker: skillsDir + "/outputty-tracker/SKILL.md" };
}

/** Fails fast on arguments the builder got wrong, before any agent costs tokens. */
function checkArgs(input) {
  if (!input || !["full", "recheck", "docs"].includes(input.mode))
    throw new Error('args.mode must be "full", "recheck" or "docs"');
  if (!input.pr || !input.base || !input.skillsDir) throw new Error("args needs pr, base and skillsDir");
  if (input.mode === "recheck" && (!input.pinnedHead || !input.round))
    throw new Error("a recheck needs pinnedHead and round");
}

/** The first step, on Haiku: pins the head and lists the commits with their counts, before anything else costs tokens. */
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

function carriesMostOfDiff(commit, total) {
  // Without code lines no commit can carry most of them.
  if (total === 0) return false;
  return commit.codeLines * 2 > total;
}

/** The pre-flight in plain code: the commits that carry most of the diff's code lines, and those whose message has no body. */
function preflightStops(commits) {
  const total = commits.reduce((sum, commit) => sum + commit.codeLines, 0);
  const blobs = commits.filter((commit) => carriesMostOfDiff(commit, total)).map((commit) => commit.sha);
  const noWhy = commits.filter((commit) => !commit.hasBody).map((commit) => commit.sha);
  const reasons = [];
  if (blobs.length) reasons.push("carries most of the diff: " + blobs.join(", "));
  if (noWhy.length) reasons.push("message has no why in its body: " + noWhy.join(", "));
  return { shas: [...new Set([...blobs, ...noWhy])], reason: reasons.join("; ") };
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
  const codeLines = pinned.commits.reduce((sum, commit) => sum + commit.codeLines, 0);
  const facts = { ...pinned.facts, codeLines, specAvailable: evidence.specAvailable };
  const skipped = AXES.map((axis) => ({ axis, reason: SKIPS[axis](facts) })).filter((entry) => entry.reason);
  const run = AXES.filter((axis) => !skipped.some((entry) => entry.axis === axis));
  return { run, skipped };
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
    ". Then remove the worktree " +
    evidence.tree +
    " and its files. Resolve nothing.";
  return agent(prompt, { phase: "Post", model: "haiku", schema: POSTED, label: "Post review" });
}

/** Lists every review thread of the PR and the diff each one's path took since the pinned head. */
function listThreads(input, paths) {
  const prompt =
    "Follow " +
    paths.review +
    '/references/recheck-brief.md, part "Gather", for PR ' +
    input.pr +
    " with pinned head " +
    input.pinnedHead +
    ". The tracker commands are in " +
    paths.tracker +
    ".";
  return agent(prompt, { phase: "Recheck", model: "haiku", schema: THREADS, label: "Threads" });
}

/** One thread against the commits that claim to fix it. */
function checkThread(thread, state, paths) {
  const prompt =
    "Follow " +
    paths.review +
    '/references/recheck-brief.md, part "Check a thread". Tree ' +
    state.tree +
    ", head " +
    state.head +
    ". Thread: " +
    JSON.stringify(thread);
  return agent(prompt, { phase: "Recheck", model: "sonnet", effort: "high", schema: CHECKED, label: thread.marker });
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
    ". A reopened thread is then handled like any other checked thread. Then remove the worktree " +
    state.tree +
    " and its files.";
  return agent(prompt, { phase: "Post", model: "haiku", schema: POSTED, label: "Post recheck" });
}

/** Counts what stays open after a recheck: unresolved checks plus new threads. */
function countOpen(checked, fresh) {
  return checked.filter((check) => !check.resolved).length + fresh.length;
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

function decideVerdict(left, round) {
  // Nothing is open, so the review is done.
  if (left === 0) return "clean";
  // The cap is reached: a further check only finds new things, so the open threads go to the user.
  if (round >= MAX_RECHECKS) return "cap";
  return "open";
}

async function orchestrateFull(input, paths) {
  phase("Preflight");
  const pinned = await listCommits(input, paths);
  const stops = preflightStops(pinned.commits);
  if (stops.shas.length) return { verdict: "stop", splitShas: stops.shas, reason: stops.reason };
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
  return {
    verdict: judged.findings.length ? "findings" : "clean",
    head: evidence.head,
    findings: judged.findings.length,
    url: posted.url,
    axes: chosen.run,
    skipped: chosen.skipped,
    readersLost: chosen.run.length - reports.length,
  };
}

/** The documentation check, its own run after the six axes and the docs layer: one Haiku reader over the docs the project names. */
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
  return {
    verdict: judged.findings.length ? "findings" : "clean",
    head: evidence.head,
    findings: judged.findings.length,
    url: posted.url,
  };
}

async function orchestrateRecheck(input, paths) {
  phase("Recheck");
  const state = await listThreads(input, paths);
  const toCheck = state.threads.filter(isReviewThread).filter(needsCheck);
  const reopen = toCheck.filter(isClosedByBuilder);
  const checked = (await parallel(toCheck.map((thread) => () => checkThread(thread, state, paths)))).filter(Boolean);
  if (checked.length < toCheck.length)
    log("threads not checked: " + (toCheck.length - checked.length) + " of " + toCheck.length);
  const fresh = (await readFixes(input, state, paths)).findings;
  phase("Post");
  const posted = await postRecheck(input, state, checked, reopen, fresh, paths);
  const left = countOpen(checked, fresh);
  const verdict = decideVerdict(left, input.round);
  if (verdict === "cap") log("recheck cap reached with " + left + " threads open: they go to the user");
  return {
    verdict,
    open: left,
    resolved: posted.resolved,
    reopened: reopen.length,
    fresh: fresh.length,
    head: state.head,
    url: posted.url,
  };
}

checkArgs(args);
const paths = readPaths(args.skillsDir);
const MODES = { full: orchestrateFull, recheck: orchestrateRecheck, docs: orchestrateDocs };
return MODES[args.mode](args, paths);
