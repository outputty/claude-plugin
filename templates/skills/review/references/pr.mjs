#!/usr/bin/env node
/**
 * The review's exact steps as one script, so a model never counts, lists or decides them.
 *
 * Usage: node pr.mjs <command> ...
 *   facts <pr> <base>             pin the head; print the commits, the diff's counts, the pre-flight stops and the depth
 *   threads <pr>                  print every review thread, checked against GitHub's own count
 *   post <pr> <findings.json>     post a review with one inline thread per finding
 *   close <thread> <tag> <reply>  reply "[review closed <tag>] <reply>" and resolve the thread
 *   keep <thread> <tag> <reply>   reply "[review open <tag>] <reply>" and leave the thread open
 *   reopen <thread> <tag>         unresolve a thread the builder resolved, and say so
 *   status <pr> <round>           print the report of the threads and the verdict: clean, open or cap
 *
 * Why it exists: a model listing 38 threads returned 1, and the posting and listing agents cost more than the
 * review. A script lists them all or fails.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_RECHECKS = 2;
/** A change under every one of these limits gets the lite review. */
export const LITE_LIMITS = { codeLines: 80, testFiles: 3, filesAdded: 2, newExports: 2 };

// ---------------------------------------------------------------------------
// Decisions, in plain code
// ---------------------------------------------------------------------------

const TEST_PATH = /(^|\/)(__tests__|tests?|spec|__snapshots__)\/|\.(test|spec)\.[a-z]+$|\.snap$/;
const DOC_PATH = /(^|\/)docs\/|\.md$/;
const LOCK_PATH = /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|go\.sum)$/;

export function isTestPath(path) {
  return TEST_PATH.test(path);
}

export function isDocPath(path) {
  return DOC_PATH.test(path);
}

/** A path whose lines count as code: not a test, a snapshot, a document or a lock file. */
export function isCodePath(path) {
  if (isTestPath(path)) return false;
  if (isDocPath(path)) return false;
  return !LOCK_PATH.test(path);
}

/** The added and deleted code lines of a "git show --numstat" listing. */
export function countCodeLines(numstat) {
  let total = 0;
  for (const line of numstat.split("\n")) {
    const [added, deleted, path] = line.split("\t");
    // A binary file shows "-" and has no lines to count.
    if (added === "-") continue;
    if (!path) continue;
    if (!isCodePath(path)) continue;
    total += Number(added) + Number(deleted);
  }
  return total;
}

/** Added lines that begin a public name: the new exports of a diff of code files. */
export function countNewExports(diffText) {
  return diffText.split("\n").filter((line) => /^\+(export |pub |def [A-Za-z])/.test(line)).length;
}

/** True when the diff of a package manifest adds a dependency line. */
export function hasNewDependency(manifestDiff) {
  return manifestDiff.split("\n").some((line) => /^\+\s+"[^"]+":\s*"[\^~>=]*\d/.test(line) && !/"version"/.test(line));
}

export function totalCodeLines(commits) {
  return commits.reduce((sum, commit) => sum + commit.codeLines, 0);
}

function carriesMostOfDiff(commit, total) {
  // Without code lines no commit can carry most of them.
  if (total === 0) return false;
  return commit.codeLines * 2 > total;
}

/** The pre-flight: the commits that carry most of the diff's code lines, and those whose message has no body. */
export function preflightStops(commits) {
  const total = totalCodeLines(commits);
  const blobs = commits.filter((commit) => carriesMostOfDiff(commit, total)).map((commit) => commit.sha);
  const noWhy = commits.filter((commit) => !commit.hasBody).map((commit) => commit.sha);
  const reasons = [];
  if (blobs.length) reasons.push("carries most of the diff: " + blobs.join(", "));
  if (noWhy.length) reasons.push("message has no why in its body: " + noWhy.join(", "));
  return { shas: [...new Set([...blobs, ...noWhy])], reason: reasons.join("; ") };
}

/** The reasons a PR needs the full review; none means it is small enough for the checklist. */
export function fullReasons(commits, facts) {
  const codeLines = totalCodeLines(commits);
  const reasons = [];
  if (codeLines >= LITE_LIMITS.codeLines) reasons.push(codeLines + " code lines");
  if (facts.testFiles > LITE_LIMITS.testFiles) reasons.push(facts.testFiles + " test files changed");
  if (facts.filesAdded > LITE_LIMITS.filesAdded) reasons.push(facts.filesAdded + " files added");
  if (facts.newExports > LITE_LIMITS.newExports) reasons.push(facts.newExports + " new exports");
  if (facts.newDependencies) reasons.push("a new dependency");
  return reasons;
}

export function chooseDepth(commits, facts) {
  const reasons = fullReasons(commits, facts);
  // Nothing in the counts makes the change big.
  if (reasons.length === 0) return { depth: "lite", reasons };
  return { depth: "full", reasons };
}

/** "[review F3 tests] text" gives "F3 tests"; anything else gives "". */
export function tagOf(body) {
  const match = /^\[review ([^\]]+)\]/.exec(body);
  if (!match) return "";
  return match[1];
}

export function firstSentence(text) {
  return text.split("\n")[0].split(". ")[0].slice(0, 160);
}

/** A thread the review opened: its first comment starts with a review marker. */
export function isReviewThread(thread) {
  return tagOf(thread.comments[0].body) !== "";
}

/** True when the review itself closed the thread: a reply starts "[review closed". */
export function wasClosedByReview(thread) {
  return thread.comments.some((comment) => comment.body.startsWith("[review closed"));
}

export function decideVerdict(open, round) {
  // Nothing is open, so the review is done.
  if (open === 0) return "clean";
  // The cap is reached: a further recheck only finds new things, so the open threads go to the user.
  if (round >= MAX_RECHECKS) return "cap";
  return "open";
}

/** What the build does for a verdict. */
export function nextStep(verdict, open, round) {
  if (verdict === "clean") return "Every review thread is resolved. Go on.";
  if (verdict === "cap")
    return "Leave the " + open + " open threads for the user and name their count in the READY message.";
  return "Address what is still open, then start a recheck at round " + (round + 1) + ".";
}

/** The first "Pinned head: <sha>" line of the PR's reviews: the head the review read, which a recheck diffs from. */
export function pinnedHeadOf(reviews) {
  for (const review of reviews) {
    const match = /^Pinned head: ([0-9a-f]+)/m.exec(review.body || "");
    if (match) return match[1];
  }
  return "";
}

/** What the build reads after a pre-flight stop. */
export function stopReport(stops) {
  return {
    report: "Pre-flight stopped the review: " + stops.reason,
    next: "Split these commits: reset each, redo it as separate commits each with its why in the message body, push, then start the review again.",
  };
}

/** What the build reads after a review or a docs check posted its threads: one line per thread, then the next step. */
export function postReport(findings, letter) {
  const lines = findings.map(
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
  const title = findings.length + " thread" + (findings.length === 1 ? "" : "s") + " posted";
  if (findings.length === 0) return [title, "Next: Nothing to address. Go on."].join("\n");
  return [
    title,
    ...lines,
    "Next: Address every thread: a fix commit and a reply with one pointer, never resolve. Then start a recheck at round 1.",
  ].join("\n");
}

/** One line per review thread: its state, its tag, its place and the builder's last word. */
export function describeThread(thread) {
  const state = thread.isResolved ? (wasClosedByReview(thread) ? "resolved" : "resolved by the builder") : "open";
  const last = thread.comments[thread.comments.length - 1];
  return (
    state +
    " " +
    tagOf(thread.comments[0].body) +
    " " +
    thread.path +
    ":" +
    thread.line +
    " - " +
    firstSentence(last.body)
  );
}

/** Threads that still need the review: open ones, and ones the builder resolved without the review's closing reply. */
export function countUnsettled(threads) {
  return threads.filter((thread) => !thread.isResolved || !wasClosedByReview(thread)).length;
}

export function renderStatus(threads, round) {
  const mine = threads.filter(isReviewThread);
  const open = countUnsettled(mine);
  const verdict = decideVerdict(open, round);
  const title = "Review threads: " + mine.length + " in all, " + open + " not settled, verdict " + verdict;
  return {
    verdict,
    open,
    text: [title, ...mine.map(describeThread), "Next: " + nextStep(verdict, open, round)].join("\n"),
  };
}

/** The body of one inline thread. */
export function findingBody(finding, letter, number) {
  const lines = [`[review ${letter}${number} ${finding.axis}] ${finding.claim}`, "", "Evidence: " + finding.evidence];
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

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

const run = (command, args) => execFileSync(command, args, { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

function repoOf() {
  const info = JSON.parse(run("gh", ["repo", "view", "--json", "owner,name"]));
  return { owner: info.owner.login, name: info.name };
}

function commandFacts(pr, base) {
  const info = JSON.parse(run("gh", ["pr", "view", pr, "--json", "headRefOid"]));
  run("git", ["fetch", "origin", "pull/" + pr + "/head"]);
  run("git", ["fetch", "origin", base]);
  const head = info.headRefOid;
  const fixedPoint = run("git", ["rev-parse", "origin/" + base]).trim();
  const range = fixedPoint + "..." + head;
  const log = run("git", ["log", "--no-merges", "--format=%H%x1f%s%x1f%b%x1e", fixedPoint + ".." + head]);
  const commits = log
    .split("\x1e")
    .filter((entry) => entry.trim())
    .map((entry) => {
      const [sha, subject, body] = entry.trim().split("\x1f");
      const numstat = run("git", ["show", "--numstat", "--format=", sha]);
      return {
        sha: sha.slice(0, 9),
        subject,
        hasBody: Boolean(body && body.trim()),
        codeLines: countCodeLines(numstat),
      };
    });
  const changed = run("git", ["diff", "--name-only", range]).split("\n").filter(Boolean);
  const added = run("git", ["diff", "--diff-filter=A", "--name-only", range]).split("\n").filter(Boolean);
  const codeFiles = changed.filter(isCodePath);
  const codeDiff = codeFiles.length ? run("git", ["diff", range, "--", ...codeFiles]) : "";
  const manifests = changed.filter((path) => /(^|\/)package\.json$/.test(path));
  const manifestDiff = manifests.length ? run("git", ["diff", range, "--", ...manifests]) : "";
  const facts = {
    filesAdded: added.length,
    testFiles: changed.filter(isTestPath).length,
    docFiles: changed.filter(isDocPath).length,
    newExports: countNewExports(codeDiff),
    newDependencies: hasNewDependency(manifestDiff),
  };
  return {
    pr,
    head,
    fixedPoint,
    commits,
    facts,
    codeLines: totalCodeLines(commits),
    stops: preflightStops(commits),
    depth: chooseDepth(commits, facts),
  };
}

const THREADS_QUERY =
  "query($o:String!,$r:String!,$n:Int!,$after:String){repository(owner:$o,name:$r){pullRequest(number:$n){headRefOid reviews(first:50){nodes{body}} reviewThreads(first:100,after:$after){totalCount pageInfo{hasNextPage endCursor} nodes{id isResolved path line comments(first:30){nodes{author{login} body}}}}}}}";

/** Every review thread of the PR, page after page, or an error when the count GitHub gives does not match. */
export function listThreads(pr) {
  const { owner, name } = repoOf();
  const threads = [];
  let after = "";
  let total = 0;
  let head = "";
  let pinnedHead = "";
  for (;;) {
    const args = [
      "api",
      "graphql",
      "-f",
      "query=" + THREADS_QUERY,
      "-f",
      "o=" + owner,
      "-f",
      "r=" + name,
      "-F",
      "n=" + pr,
    ];
    if (after) args.push("-f", "after=" + after);
    const page = JSON.parse(run("gh", args)).data.repository.pullRequest;
    head = page.headRefOid;
    pinnedHead = pinnedHeadOf(page.reviews.nodes);
    total = page.reviewThreads.totalCount;
    for (const node of page.reviewThreads.nodes) threads.push({ ...node, comments: node.comments.nodes });
    if (!page.reviewThreads.pageInfo.hasNextPage) break;
    after = page.reviewThreads.pageInfo.endCursor;
  }
  if (threads.length !== total) throw new Error("listed " + threads.length + " threads, GitHub counts " + total);
  return { head, pinnedHead, total, threads };
}

function commandThreads(pr) {
  const { head, pinnedHead, total, threads } = listThreads(pr);
  const mine = threads.filter(isReviewThread);
  return {
    head,
    pinnedHead,
    total,
    others: total - mine.length,
    threads: mine.map((thread) => ({
      id: thread.id,
      tag: tagOf(thread.comments[0].body),
      path: thread.path,
      line: thread.line,
      isResolved: thread.isResolved,
      closedByReview: wasClosedByReview(thread),
      finding: thread.comments[0].body,
      replies: thread.comments.slice(1).map((comment) => comment.author?.login + ": " + comment.body),
    })),
  };
}

function reply(thread, body) {
  const mutation =
    "mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{url}}}";
  run("gh", ["api", "graphql", "-f", "query=" + mutation, "-f", "t=" + thread, "-f", "b=" + body]);
}

function setResolved(thread, resolved) {
  const name = resolved ? "resolveReviewThread" : "unresolveReviewThread";
  const mutation = "mutation($t:ID!){" + name + "(input:{threadId:$t}){thread{isResolved}}}";
  run("gh", ["api", "graphql", "-f", "query=" + mutation, "-f", "t=" + thread]);
}

function commandPost(pr, file) {
  const input = JSON.parse(readFileSync(file, "utf8"));
  const { owner, name } = repoOf();
  const payloadFile = join(tmpdir(), "review-payload-" + pr + ".json");
  writeFileSync(payloadFile, JSON.stringify(buildReviewPayload(input)));
  const out = JSON.parse(
    run("gh", [
      "api",
      "repos/" + owner + "/" + name + "/pulls/" + pr + "/reviews",
      "--method",
      "POST",
      "--input",
      payloadFile,
    ]),
  );
  return { url: out.html_url, posted: input.findings.length, report: postReport(input.findings, input.letter) };
}

function commandStatus(pr, round) {
  const { threads } = listThreads(pr);
  const status = renderStatus(threads, Number(round));
  return { verdict: status.verdict, open: status.open, report: status.text };
}

function main(argv) {
  const [command, ...rest] = argv;
  if (command === "facts") {
    const facts = commandFacts(rest[0], rest[1]);
    // A stop tells the build what to split, in the same report shape as a review.
    if (facts.stops.shas.length) return { ...facts, ...stopReport(facts.stops) };
    return facts;
  }
  if (command === "threads") return commandThreads(rest[0]);
  if (command === "post") return commandPost(rest[0], rest[1]);
  if (command === "close") {
    reply(rest[0], "[review closed " + rest[1] + "] " + rest[2]);
    setResolved(rest[0], true);
    return { closed: rest[0] };
  }
  if (command === "keep") {
    reply(rest[0], "[review open " + rest[1] + "] " + rest[2]);
    return { kept: rest[0] };
  }
  if (command === "reopen") {
    setResolved(rest[0], false);
    reply(rest[0], "[review reopened " + rest[1] + "] the builder resolved this thread; only the review resolves.");
    return { reopened: rest[0] };
  }
  if (command === "status") return commandStatus(rest[0], rest[1]);
  throw new Error("usage: pr.mjs facts|threads|post|close|keep|reopen|status ...");
}

// Run only when started from the shell, so a test can import the decisions above.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = main(process.argv.slice(2));
  console.log(JSON.stringify(result, null, 2));
  // The status report is for reading, not for parsing.
  if (result.report) console.log("\n" + result.report);
}
