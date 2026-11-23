#!/usr/bin/env bun
/**
 * Lists the Claude Code sessions of every project active since a moment, newest first.
 * Usage: bun list-sessions.ts [--since <ISO>]
 * No `--since`: the 15 most recently active sessions. A session resumed after the moment counts.
 * `bun list-sessions.ts --since 2026-11-16T18:02:00Z` -> one line per session: project, last active, the transcript path.
 */
import { closeSync, fstatSync, openSync, readSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type Session = { project: string; path: string; last: Date };

const root = join(homedir(), ".claude", "projects");
const TIMESTAMP = /"timestamp":"([^"]+)"/g;

/** Reads the last 64 KB of a file: enough to hold its final timestamp. */
export function tailOf(path: string, bytes = 65536): string {
  const fd = openSync(path, "r");
  const start = Math.max(0, fstatSync(fd).size - bytes);
  const buffer = Buffer.alloc(bytes);
  const read = readSync(fd, buffer, 0, bytes, start);
  closeSync(fd);
  return buffer.toString("utf8", 0, read);
}

/** Returns each project's transcripts that recorded a message, with the time of the last one. */
export function listSessions(projectsRoot: string): Session[] {
  const sessions: Session[] = [];
  for (const project of readdirSync(projectsRoot)) {
    for (const name of readdirSync(join(projectsRoot, project)).filter((file) => file.endsWith(".jsonl"))) {
      const path = join(projectsRoot, project, name);
      const last = [...tailOf(path).matchAll(TIMESTAMP)].at(-1)?.[1];
      // A transcript with no timestamp is an empty or aborted session.
      if (!last) continue;
      sessions.push({ project, path, last: new Date(last) });
    }
  }
  return sessions.sort((a, b) => b.last.getTime() - a.last.getTime());
}

/** Prints the sessions active since the moment given, or the 15 latest. */
export function orchestrateList(args: string[]): void {
  const flag = args.indexOf("--since");
  const since = flag === -1 ? undefined : new Date(args[flag + 1]);
  const sessions = listSessions(root);
  const picked = since ? sessions.filter((session) => session.last >= since) : sessions.slice(0, 15);
  console.log(
    `${sessions.length} sessions; ${since ? `active since ${since.toISOString()}: ${picked.length}` : "15 most recent"}`,
  );
  for (const session of picked)
    console.log(`${session.last.toISOString().slice(0, 16)}  ${session.project}  ${session.path}`);
}

if (import.meta.main) orchestrateList(process.argv.slice(2));
