/** A finding's place in the code: the link that opens it in the editor, and the lines around it at the pinned head. */
import { run } from "./github.mjs";

/** The link that opens a file at a line in the editor; `root` is the absolute path of the checkout. */
export function editorLink(root, file, line) {
  return "vscode://file" + root + "/" + file + ":" + line;
}

/** Lines `from` to `to` of a text, each with its number, and an arrow before the marked line. */
export function numberedLines(text, from, to, marked) {
  return text
    .split("\n")
    .slice(from - 1, to)
    .map((line, index) => (from + index === marked ? "> " : "  ") + (from + index) + " | " + line)
    .join("\n");
}

/** The lines around one line, three before and three after, the line marked. */
export function aroundLine(text, line, radius = 3) {
  return numberedLines(text, Math.max(1, line - radius), line + radius, line);
}

/** A file's text at a commit. */
export function fileAt(head, file) {
  return run("git", ["show", head + ":" + file]);
}

/** The absolute path of the checkout the script runs in. */
export function repoRoot() {
  return run("git", ["rev-parse", "--show-toplevel"]).trim();
}
