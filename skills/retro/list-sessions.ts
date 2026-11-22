#!/usr/bin/env bun
/**
 * Lists a repo's Claude Code sessions across its primary checkout and every worktree.
 * Usage: bun list-sessions.ts [repo-root] [YYYY-MM-DD]
 * No date: the 15 most recently active sessions. A date: every session ACTIVE on or after
 * that local date (last timestamp >= local midnight), so a session resumed that day counts.
 * `bun list-sessions.ts ~/code/app 2026-09-20` -> one line per session, most recent first.
 */
import { readdirSync, openSync, readSync, closeSync, fstatSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";

const args = process.argv.slice(2);
const date = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const cwd = args.find((a) => a !== date) ?? process.cwd();
const gitDir = Bun.spawnSync(["git", "rev-parse", "--path-format=absolute", "--git-common-dir"], { cwd });
if (gitDir.exitCode !== 0) throw new Error(`not a git checkout: ${cwd}`);
// A worktree's common dir is the main repo's .git, so its parent is the primary checkout.
const repo = dirname(resolve(cwd, gitDir.stdout.toString().trim()));
const key = repo.replace(/[/.]/g, "-");
const root = join(homedir(), ".claude", "projects");
// The primary checkout's dir plus every `<repo>/.claude/worktrees/<name>` dir (claude --worktree, herdr).
const dirs = readdirSync(root).filter((d) => d === key || d.startsWith(key + "--"));

// Reads 64 KB from the head or the tail of a file: enough for a first or last timestamp.
const slice = (path: string, fromEnd: boolean, bytes = 65536) => {
  const fd = openSync(path, "r");
  const pos = fromEnd ? Math.max(0, fstatSync(fd).size - bytes) : 0;
  const buf = Buffer.alloc(bytes);
  const n = readSync(fd, buf, 0, bytes, pos);
  closeSync(fd);
  return buf.toString("utf8", 0, n);
};
const firstMatch = (text: string, re: RegExp) => text.match(re)?.[1];
const TS = /"timestamp":"([^"]+)"/g;

type Session = { path: string; dir: string; started: Date; last: Date; branch: string };
const sessions: Session[] = [];
for (const dir of dirs) {
  for (const f of readdirSync(join(root, dir))) {
    if (!f.endsWith(".jsonl")) continue;
    const path = join(root, dir, f);
    const head = slice(path, false);
    const ts = firstMatch(head, /"timestamp":"([^"]+)"/);
    if (!ts) continue; // no message ever recorded: an empty or aborted session
    const tail = slice(path, true);
    const lastTs = [...tail.matchAll(TS)].at(-1)?.[1] ?? ts;
    // The last branch recorded: a build starts on main and ends on its layer branch.
    const branch = [...tail.matchAll(/"gitBranch":"([^"]*)"/g)].at(-1)?.[1] ?? "?";
    const where = dir.slice(key.length).replace(/^--claude-worktrees-/, "") || "(primary)";
    sessions.push({ path, dir: where, started: new Date(ts), last: new Date(lastTs), branch });
  }
}
sessions.sort((a, b) => b.last.getTime() - a.last.getTime());
const since = date ? new Date(`${date}T00:00:00`) : undefined; // local midnight
const picked = since ? sessions.filter((s) => s.last >= since) : sessions.slice(0, 15);

// Real prompts: typed text, plus a slash command with arguments rendered as "/cmd args".
// Skipped: tool results, meta, compaction summaries, bare /clear-style commands, other <wrapped> text.
const prompts = async (path: string) => {
  const out: string[] = [];
  for (const line of (await Bun.file(path).text()).split("\n")) {
    if (!line.includes('"type":"user"')) continue;
    const m = JSON.parse(line);
    const c = m.message?.content;
    if (m.type !== "user" || m.isMeta || m.isSidechain || m.isCompactSummary || typeof c !== "string") continue;
    const cmd = firstMatch(c, /^<command-name>([^<]+)<\/command-name>/);
    const cmdArgs = firstMatch(c, /<command-args>([\s\S]*?)<\/command-args>/)?.trim();
    if (cmd) cmdArgs && out.push(`${cmd} ${cmdArgs}`);
    else if (!c.startsWith("<")) out.push(c);
  }
  return out;
};

const fmt = (d: Date) => d.toLocaleString("sv-SE", { hour12: false }).slice(0, 16);
console.log(
  `${repo}: ${dirs.length} dirs, ${sessions.length} sessions; ${since ? `active on or after ${date}: ${picked.length}` : "15 most recent"}`,
);
for (const [i, s] of picked.entries()) {
  const p = await prompts(s.path);
  const first = (p[0] ?? "").replace(/\s+/g, " ").slice(0, 80);
  console.log(
    `${String(i + 1).padStart(2)}  ${fmt(s.started)} -> ${fmt(s.last).slice(5)}  ${s.dir}/${s.branch}  ${p.length}u  ${first}  ${s.path}`,
  );
}
