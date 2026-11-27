#!/usr/bin/env node
/**
 * Lists, reads, claims and sends back tickets.
 *
 * Usage:
 *   node tickets.mjs list                       open tickets in build order, with the goal lines
 *   node tickets.mjs read <n>                   one ticket: body, labels, comments, open blockers, base, draft commit
 *   node tickets.mjs claim <n>                  assign it to you
 *   node tickets.mjs send-back <n> --why <text> --what <text>
 *                                               label it needs-planning, post the Why and What, print the plan prompt
 *
 * Why it exists: the pick, the claim and the send-back were hand-typed gh calls, and a send-back once opened a plan
 * session with no reason in it. Every command is safe to run again.
 */
import { parseArgs } from "node:util";
import { goalLines, isBuildable, orderTickets, renderList } from "./lib/order.mjs";
import { baseOf, hasHowToValidate, planPrompt, sendBackComment } from "./lib/ticket.mjs";
import { print, run } from "./lib/shell.mjs";

const gh = (...args) => run("gh", args).trim();
const json = (...args) => JSON.parse(gh(...args));

function openBlockers(number) {
  return gh(
    "api",
    "repos/{owner}/{repo}/issues/" + number + "/dependencies/blocked_by",
    "--jq",
    '.[] | select(.state == "open") | .number',
  )
    .split("\n")
    .filter(Boolean)
    .map(Number);
}

function list() {
  const issues = json(
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "200",
    "--json",
    "number,title,labels,assignees,createdAt",
  );
  const prs = json("pr", "list", "--state", "all", "--limit", "200", "--json", "number,title,state");
  const tickets = issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    createdAt: issue.createdAt,
    labels: issue.labels.map((label) => label.name),
    assignees: issue.assignees.map((person) => person.login),
    openBlockers: openBlockers(issue.number),
    prs: prs.filter((pr) => pr.title.includes("#" + issue.number)),
  }));
  const ordered = orderTickets(tickets);
  const buildable = ordered.filter(isBuildable).map((ticket) => ticket.number);
  return { list: renderList(ordered), buildable, goal: goalLines(buildable) };
}

function read(number) {
  const issue = json("issue", "view", number, "--json", "number,title,body,labels,assignees,comments");
  return {
    number: issue.number,
    title: issue.title,
    labels: issue.labels.map((label) => label.name),
    assignees: issue.assignees.map((person) => person.login),
    openBlockers: openBlockers(number),
    base: baseOf(issue.body),
    hasHowToValidate: hasHowToValidate(issue.body),
    stack: issue.labels.some((label) => label.name === "stack"),
    body: issue.body,
    comments: issue.comments.map((comment) => comment.body),
  };
}

function sendBack(number, why, what) {
  const body = sendBackComment(why, what);
  const comments = json("issue", "view", number, "--json", "comments").comments;
  // The same comment twice would tell the plan session nothing new, so a rerun skips it.
  const posted = comments.some((comment) => comment.body === body);
  if (!posted) gh("issue", "comment", number, "--body", body);
  gh("issue", "edit", number, "--add-label", "needs-planning", "--remove-label", "ready", "--remove-assignee", "@me");
  return { ticket: Number(number), commented: !posted, prompt: planPrompt(number, why, what) };
}

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { why: { type: "string" }, what: { type: "string" } },
});
const [command, number] = positionals;
if (command === "list") print(list());
else if (command === "read" && number) print(read(number));
else if (command === "claim" && number) {
  gh("issue", "edit", number, "--add-assignee", "@me");
  print({ ticket: Number(number), claimed: true });
} else if (command === "send-back" && number) print(sendBack(number, values.why ?? "", values.what ?? ""));
else throw new Error("usage: tickets.mjs list | read <n> | claim <n> | send-back <n> --why <text> --what <text>");
