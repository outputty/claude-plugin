export const meta = {
  name: "review",
  description:
    "Reviews a pull request on six axes behind a commit pre-flight and posts each finding as a GitHub thread, or re-checks the threads still open",
  whenToUse:
    'From a build session with args {mode: "full" | "recheck", pr, base, skillsDir}; a recheck adds {pinnedHead, round}',
  phases: [
    { title: "Evidence", detail: "pin the head, pre-flight the commits, gather the spec and the tool output" },
    { title: "Read", detail: "six axis readers, each on Sonnet" },
    { title: "Judge", detail: "open every cited source, clear findings, write the valid questions" },
    { title: "Recheck", detail: "one check per open thread, and one pass over the fix commits" },
    { title: "Post", detail: "post, reply to, resolve and reopen threads on the PR" },
  ],
};

const AXES = ["standards", "spec", "correctness", "provenance", "tests", "simplicity"];
const MAX_RECHECKS = 2;

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
const EVIDENCE = {
  type: "object",
  properties: {
    head: { type: "string" },
    fixedPoint: { type: "string" },
    tree: { type: "string" },
    dir: { type: "string" },
    specAvailable: { type: "boolean" },
    preflight: { type: "string", enum: ["pass", "stop"] },
    splitShas: { type: "array", items: { type: "string" } },
    reason: { type: "string" },
  },
  required: ["head", "fixedPoint", "tree", "dir", "specAvailable", "preflight"],
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
  if (!input || !["full", "recheck"].includes(input.mode)) throw new Error('args.mode must be "full" or "recheck"');
  if (!input.pr || !input.base || !input.skillsDir) throw new Error("args needs pr, base and skillsDir");
  if (input.mode === "recheck" && (!input.pinnedHead || !input.round))
    throw new Error("a recheck needs pinnedHead and round");
}

/** Pins the head in its own worktree, pre-flights the commits, and writes the spec, diff and tool output under dir. */
function gatherEvidence(input, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/evidence-brief.md for PR " +
    input.pr +
    " with base " +
    input.base +
    ". Check out nothing in the current worktree: use a detached worktree of the PR head. The tracker commands are in " +
    paths.tracker +
    ".";
  return agent(prompt, { phase: "Evidence", model: "sonnet", schema: EVIDENCE, label: "Evidence" });
}

/** One reader per axis, each handed the evidence directory and its brief. */
function readAxis(axis, evidence, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/" +
    axis +
    "-brief.md. Its placeholders are: diff = git -C " +
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
  return agent(prompt, { phase: "Read", model: "sonnet", schema: FINDINGS, label: axis });
}

/** The Opus pass: opens every cited source itself, drops what fails, keeps the valid questions. */
function judgeFindings(evidence, reports, paths) {
  const prompt =
    "Follow " +
    paths.review +
    "/references/judge-brief.md. Evidence: " +
    evidence.dir +
    ", tree " +
    evidence.tree +
    ", head " +
    evidence.head +
    ". The six readers reported: " +
    JSON.stringify(reports);
  return agent(prompt, { phase: "Judge", model: "opus", effort: "high", schema: JUDGED, label: "Judge" });
}

/** Posts the review with one inline thread per finding, and the summary as its body. */
function postReview(input, evidence, judged, paths) {
  const prompt =
    "Post the review of PR " +
    input.pr +
    ' with the "Post a review with inline threads" commands of ' +
    paths.tracker +
    " and the summary shape of " +
    paths.review +
    "/references/report.md. Pinned head " +
    evidence.head +
    ". Each thread body starts with the marker [review F<n> <axis>], n counting from 1 in this order. Findings: " +
    JSON.stringify(judged.findings) +
    ". Dropped by the judge: " +
    judged.dropped +
    ". Summary: " +
    judged.summary +
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
  return agent(prompt, { phase: "Recheck", model: "opus", effort: "medium", schema: CHECKED, label: thread.marker });
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
  return agent(prompt, { phase: "Recheck", model: "opus", effort: "medium", schema: FINDINGS, label: "Fixes" });
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
  phase("Evidence");
  const evidence = await gatherEvidence(input, paths);
  if (evidence.preflight === "stop") return { verdict: "stop", splitShas: evidence.splitShas, reason: evidence.reason };
  phase("Read");
  const readers = specAxes(evidence);
  const reports = (await parallel(readers.map((axis) => () => readAxis(axis, evidence, paths)))).filter(Boolean);
  if (reports.length < readers.length)
    log("readers lost: " + (readers.length - reports.length) + " of " + readers.length + " returned nothing");
  phase("Judge");
  const judged = await judgeFindings(evidence, reports, paths);
  phase("Post");
  const posted = await postReview(input, evidence, judged, paths);
  return {
    verdict: judged.findings.length ? "findings" : "clean",
    head: evidence.head,
    findings: judged.findings.length,
    url: posted.url,
    readersLost: readers.length - reports.length,
  };
}

/** The axes this run reads: the Spec axis is skipped when the ticket gave no spec. */
function specAxes(evidence) {
  if (evidence.specAvailable) return AXES;
  log("no spec available: the Spec reader is skipped");
  return AXES.filter((axis) => axis !== "spec");
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
return args.mode === "full" ? orchestrateFull(args, paths) : orchestrateRecheck(args, paths);
