#!/usr/bin/env bun
/**
 * Flags the windows of Claude Code transcripts where work went wrong: heavy tool use, repeat reads, a long run or a correction.
 * A window is one user turn and everything the assistant and its subagents did before the next one.
 * Only counts, paths, skill names and times are printed; tool output never is.
 * Usage: bun friction.ts <transcript.jsonl>...
 * `bun friction.ts ~/.claude/projects/-repo/7f3a.jsonl` -> one JSON line per flagged window:
 * `{"session":"7f3a","start":"2026-11-20T10:00:00Z","end":"2026-11-20T10:31:00Z","toolCalls":212,"repeatReads":[{"path":"/repo/SKILL.md","count":9}],"durationMs":1860000,"corrections":0,"skillsLoaded":["build"]}`
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

export const TOOL_CALLS_FLAG = 40;
export const REPEAT_READS_FLAG = 3;
export const DURATION_FLAG_MS = 10 * 60 * 1000;
const CORRECTION = /^\s*(no|don'?t|stop|i said|wrong|that'?s not)\b/i;
const EDIT_TOOLS = new Set(["Edit", "Write", "NotebookEdit"]);

type ToolUse = { id: string; name: string; input: Record<string, unknown> };
type Record_ = {
  type: string;
  timestamp: string;
  isSidechain?: boolean;
  isMeta?: boolean;
  message?: { content?: unknown };
};
type Window = { prompt: string; start: string; end: string; toolUses: ToolUse[] };
type Flagged = {
  session: string;
  start: string;
  end: string;
  toolCalls: number;
  repeatReads: { path: string; count: number }[];
  durationMs: number;
  corrections: number;
  skillsLoaded: string[];
};

/**
 * Lists a transcript and its subagent runs: `<session-id>/subagents/agent-*.jsonl` beside it.
 * Caller owes an existing transcript path.
 */
export function transcriptFiles(path: string): string[] {
  const subagents = join(dirname(path), basename(path, ".jsonl"), "subagents");
  if (!existsSync(subagents)) return [path];
  const runs = readdirSync(subagents).filter((name) => /^agent-.*\.jsonl$/.test(name));
  return [path, ...runs.map((name) => join(subagents, name))];
}

/** Parses the user and assistant records of one JSONL file, skipping the other record types. */
export function readRecords(path: string): Record_[] {
  const records = readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.includes('"timestamp"'))
    .map((line) => JSON.parse(line) as Record_);
  return records.filter((record) => record.type === "user" || record.type === "assistant");
}

/** Returns the typed text of a real user turn, or undefined for tool results, meta records and slash-command wrappers. */
export function promptText(record: Record_): string | undefined {
  // A user record is a turn only when its content is typed text: tool results are arrays.
  if (record.type !== "user") return undefined;
  if (record.isMeta) return undefined;
  if (record.isSidechain) return undefined;
  const content = record.message?.content;
  if (typeof content !== "string") return undefined;
  // Wrapped text is a command, a caveat or a hook, not something the user typed.
  if (content.startsWith("<")) return undefined;
  return content;
}

/** Collects the tool_use blocks of an assistant record. */
export function toolUsesOf(record: Record_): ToolUse[] {
  const content = record.message?.content;
  if (!Array.isArray(content)) return [];
  return content.filter((block) => block?.type === "tool_use") as ToolUse[];
}

/**
 * Splits records, sorted by time, into one window per user turn. A record before the first turn belongs to no window.
 * Subagent records carry their own timestamps, so they fall inside the turn that was running.
 */
export function splitWindows(records: Record_[]): Window[] {
  const windows: Window[] = [];
  for (const record of [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const prompt = promptText(record);
    if (prompt !== undefined) {
      windows.push({ prompt, start: record.timestamp, end: record.timestamp, toolUses: [] });
      continue;
    }
    const current = windows.at(-1);
    if (!current) continue;
    current.end = record.timestamp;
    current.toolUses.push(...toolUsesOf(record));
  }
  return windows;
}

/** Drops a repeated tool_use id: transcripts repeat records, and each call counts once. */
export function uniqueToolUses(toolUses: ToolUse[]): ToolUse[] {
  const seen = new Set<string>();
  return toolUses.filter((use) => {
    if (seen.has(use.id)) return false;
    seen.add(use.id);
    return true;
  });
}

/**
 * Counts the reads of each file range since that file was last edited, and reports the files read the same range more than once.
 * `Read a, Read a, Edit a, Read a` -> [{ path: "a", count: 2 }]: the third read follows an edit, so it is a fresh read.
 */
export function repeatReadsOf(toolUses: ToolUse[]): { path: string; count: number }[] {
  const counts = new Map<string, number>();
  const worst = new Map<string, number>();
  for (const use of toolUses) {
    const path = String(use.input.file_path ?? use.input.notebook_path ?? "");
    if (EDIT_TOOLS.has(use.name)) {
      for (const key of [...counts.keys()].filter((key) => key.startsWith(path + "\0"))) counts.delete(key);
      continue;
    }
    if (use.name !== "Read") continue;
    const key = path + "\0" + String(use.input.offset ?? "") + "\0" + String(use.input.limit ?? "");
    const count = (counts.get(key) ?? 0) + 1;
    counts.set(key, count);
    worst.set(path, Math.max(worst.get(path) ?? 0, count));
  }
  return [...worst].filter(([, count]) => count > 1).map(([path, count]) => ({ path, count }));
}

/** Names each skill the window loaded through the Skill tool, once. */
export function skillsLoadedOf(toolUses: ToolUse[]): string[] {
  const names = toolUses.filter((use) => use.name === "Skill").map((use) => String(use.input.skill));
  return [...new Set(names)];
}

/** Summarizes one window: its counts, and its length in milliseconds. */
export function measureWindow(session: string, window: Window): Flagged {
  const toolUses = uniqueToolUses(window.toolUses);
  return {
    session,
    start: window.start,
    end: window.end,
    toolCalls: toolUses.length,
    repeatReads: repeatReadsOf(toolUses),
    durationMs: Date.parse(window.end) - Date.parse(window.start),
    corrections: CORRECTION.test(window.prompt) ? 1 : 0,
    skillsLoaded: skillsLoadedOf(toolUses),
  };
}

/** Says whether a measured window shows friction: any one of the four signals. */
export function isFlagged(measured: Flagged): boolean {
  const signals = [
    measured.toolCalls >= TOOL_CALLS_FLAG,
    measured.repeatReads.some((read) => read.count >= REPEAT_READS_FLAG),
    measured.durationMs >= DURATION_FLAG_MS,
    measured.corrections > 0,
  ];
  return signals.some(Boolean);
}

/** Reads a transcript with its subagent runs and returns its flagged windows. */
export function flaggedWindows(path: string): Flagged[] {
  const records = transcriptFiles(path).flatMap(readRecords);
  return splitWindows(records)
    .map((window) => measureWindow(basename(path, ".jsonl"), window))
    .filter(isFlagged);
}

/** Prints one JSON line per flagged window of every transcript given. */
export function orchestrateFriction(paths: string[]): void {
  for (const path of paths) {
    for (const flagged of flaggedWindows(path)) console.log(JSON.stringify(flagged));
  }
}

if (import.meta.main) orchestrateFriction(process.argv.slice(2));
