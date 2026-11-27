#!/usr/bin/env node
/**
 * Runs the repo's format, lint and typecheck commands over the current tree and tells new errors from old ones.
 *
 * Usage: node checks.mjs --base <ref> --cmd "<command>" [--cmd "<command>" ...]
 *
 * Each command runs at the head, its output going to tmp/checks-<i>.log. A failing command runs again on <ref> in a
 * throwaway worktree: an error is pre-existing only when that run prints it too. Exits 1 when any command shows a new error.
 *
 * Why it exists: 2,000 hand-run checks in one build, each judged by eye for whether the error was already there.
 */
import { existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { newErrors } from "./lib/errors.mjs";
import { print, run } from "./lib/shell.mjs";

const MAX_SHOWN = 20;

/** The exit code and output of a shell command run in `cwd`; a failing command is a result, not an error. */
function runCheck(command, cwd) {
  try {
    return { code: 0, output: run("sh", ["-c", command + " 2>&1"], { cwd }) };
  } catch (error) {
    return { code: error.status ?? 1, output: String(error.stdout || "") + String(error.stderr || "") };
  }
}

/** The command's output on the base commit, in a worktree that shares the repo's installed dependencies. */
function runAtBase(command, base, root) {
  const worktree = join(root, "tmp", "checks-base");
  // A worktree left by an earlier run is removed first, so a rerun starts clean.
  if (existsSync(worktree)) run("git", ["worktree", "remove", "--force", worktree], { cwd: root });
  run("git", ["worktree", "add", "--detach", worktree, base], { cwd: root });
  const modules = join(root, "node_modules");
  if (existsSync(modules)) symlinkSync(modules, join(worktree, "node_modules"));
  const { output } = runCheck(command, worktree);
  run("git", ["worktree", "remove", "--force", worktree], { cwd: root });
  return output;
}

function checkOne(command, index, base, root) {
  const head = runCheck(command, root);
  const log = join("tmp", "checks-" + index + ".log");
  writeFileSync(join(root, log), head.output);
  if (head.code === 0) return { command, status: "pass", log, newErrors: [] };
  const fresh = newErrors(head.output, runAtBase(command, base, root));
  return {
    command,
    status: fresh.length ? "fail" : "pre-existing only",
    log,
    newErrors: fresh.slice(0, MAX_SHOWN),
    newErrorCount: fresh.length,
  };
}

const { values } = parseArgs({ options: { base: { type: "string" }, cmd: { type: "string", multiple: true } } });
if (!values.base || !values.cmd?.length) throw new Error('usage: checks.mjs --base <ref> --cmd "<command>" ...');
const root = run("git", ["rev-parse", "--show-toplevel"]).trim();
mkdirSync(join(root, "tmp"), { recursive: true });
const results = values.cmd.map((command, index) => checkOne(command, index, values.base, root));
const verdict = results.some((result) => result.status === "fail") ? "fail" : "pass";
print({ verdict, results });
if (verdict === "fail") process.exitCode = 1;
