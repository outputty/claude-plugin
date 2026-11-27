#!/usr/bin/env node
/**
 * Prints every review thread of a PR, checked against GitHub's own count.
 *
 * Usage: node threads.mjs <pr>
 *
 * Why it exists: a model listing 38 threads returned 1. This script lists them all or fails.
 */
import { listThreads } from "./lib/list-threads.mjs";
import { isReviewThread, tagOf, wasClosedByReview } from "./lib/thread.mjs";
import { print } from "./lib/print.mjs";

export function commandThreads(pr) {
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

const [pr] = process.argv.slice(2);
if (!pr) throw new Error("usage: threads.mjs <pr>");
print(commandThreads(pr));
