#!/usr/bin/env node
/**
 * Settles one review thread: close it, keep it open with a reply, or reopen one the builder resolved.
 *
 * Usage: node settle.mjs close|keep|reopen <thread> <tag> [reply]
 *
 *   close   replies "[review closed <tag>] <reply>" and resolves the thread
 *   keep    replies "[review open <tag>] <reply>" and leaves the thread open
 *   reopen  unresolves a thread the builder resolved, and says so
 */
import { run } from "./lib/github.mjs";
import { print } from "./lib/print.mjs";

export function reply(thread, body) {
  const mutation =
    "mutation($t:ID!,$b:String!){addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$t,body:$b}){comment{url}}}";
  run("gh", ["api", "graphql", "-f", "query=" + mutation, "-f", "t=" + thread, "-f", "b=" + body]);
}

export function setResolved(thread, resolved) {
  const name = resolved ? "resolveReviewThread" : "unresolveReviewThread";
  const mutation = "mutation($t:ID!){" + name + "(input:{threadId:$t}){thread{isResolved}}}";
  run("gh", ["api", "graphql", "-f", "query=" + mutation, "-f", "t=" + thread]);
}

const [command, thread, tag, text] = process.argv.slice(2);
if (command === "close") {
  reply(thread, "[review closed " + tag + "] " + text);
  setResolved(thread, true);
  print({ closed: thread });
} else if (command === "keep") {
  reply(thread, "[review open " + tag + "] " + text);
  print({ kept: thread });
} else if (command === "reopen") {
  setResolved(thread, false);
  reply(thread, "[review reopened " + tag + "] the builder resolved this thread; only the review resolves.");
  print({ reopened: thread });
} else {
  throw new Error("usage: settle.mjs close|keep|reopen <thread> <tag> [reply]");
}
