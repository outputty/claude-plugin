#!/usr/bin/env node
/**
 * Puts a ticket on the project board and moves it between Todo and In Progress.
 *
 * Usage:
 *   node board.mjs add <ticket>
 *   node board.mjs move <ticket> "todo"|"in progress"
 *
 * The board, its project id and its Status ids come from the **Board** line of the repo's CLAUDE.md. Adding is
 * idempotent, and a move to the status the item already has changes nothing, so both are safe to run again.
 */
import { readFileSync } from "node:fs";
import { optionFor, parseBoard } from "./lib/board.mjs";
import { print, run } from "./lib/shell.mjs";

const LIMIT = 500;
const gh = (...args) => run("gh", args).trim();

function itemIdOf(board, repo, ticket) {
  const listing = JSON.parse(
    gh("project", "item-list", board.number, "--owner", board.org, "--limit", String(LIMIT), "--format", "json"),
  );
  const item = listing.items.find((entry) => entry.content?.repository === repo && entry.content?.number === ticket);
  if (item) return item.id;
  // A full page may hide the item, so the build learns the list was cut, not that the ticket is missing.
  if (listing.items.length >= LIMIT) throw new Error("the board holds " + LIMIT + " items or more; raise the limit");
  throw new Error("ticket " + ticket + " is not on the board: run add first");
}

const [command, ticketText, status] = process.argv.slice(2);
const ticket = Number(ticketText);
if (!command || !ticket) throw new Error('usage: board.mjs add|move <ticket> ["todo"|"in progress"]');
const root = run("git", ["rev-parse", "--show-toplevel"]).trim();
const board = parseBoard(readFileSync(root + "/CLAUDE.md", "utf8"));
const repo = JSON.parse(gh("repo", "view", "--json", "nameWithOwner")).nameWithOwner;
if (command === "add") {
  const url = JSON.parse(gh("issue", "view", String(ticket), "--json", "url")).url;
  gh("project", "item-add", board.number, "--owner", board.org, "--url", url);
  print({ ticket, added: true });
} else if (command === "move") {
  const option = optionFor(board, status);
  gh(
    "project",
    "item-edit",
    "--id",
    itemIdOf(board, repo, ticket),
    "--project-id",
    board.projectId,
    "--field-id",
    board.fieldId,
    "--single-select-option-id",
    option,
  );
  print({ ticket, status });
} else {
  throw new Error("usage: board.mjs add|move ...");
}
