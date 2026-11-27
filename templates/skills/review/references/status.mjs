#!/usr/bin/env node
/**
 * Prints the report of a PR's review threads and the verdict: clean, idle or open.
 *
 * Usage: node status.mjs <pr> <round>
 */
import { listThreads } from "./lib/list-threads.mjs";
import { renderStatus } from "./lib/verdict.mjs";
import { print } from "./lib/print.mjs";

export function commandStatus(pr, round) {
  const { threads } = listThreads(pr);
  const status = renderStatus(threads, Number(round));
  return { verdict: status.verdict, open: status.open, report: status.text };
}

const [pr, round] = process.argv.slice(2);
if (!pr || !round) throw new Error("usage: status.mjs <pr> <round>");
print(commandStatus(pr, round));
