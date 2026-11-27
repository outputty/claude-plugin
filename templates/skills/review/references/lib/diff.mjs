/** What a diff holds: which paths are code, and the lines, exports and dependencies it adds. */
export const TEST_PATH = /(^|\/)(__tests__|tests?|spec|__snapshots__)\/|\.(test|spec)\.[a-z]+$|\.snap$/;

export const DOC_PATH = /(^|\/)docs\/|\.md$/;

export const LOCK_PATH = /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock|bun\.lockb?|Cargo\.lock|go\.sum)$/;

export function isTestPath(path) {
  return TEST_PATH.test(path);
}

export function isDocPath(path) {
  return DOC_PATH.test(path);
}

/** A path whose lines count as code: not a test, a snapshot, a document or a lock file. */
export function isCodePath(path) {
  if (isTestPath(path)) return false;
  if (isDocPath(path)) return false;
  return !LOCK_PATH.test(path);
}

/** The added and deleted code lines of a "git show --numstat" listing. */
export function countCodeLines(numstat) {
  let total = 0;
  for (const line of numstat.split("\n")) {
    const [added, deleted, path] = line.split("\t");
    // A binary file shows "-" and has no lines to count.
    if (added === "-") continue;
    if (!path) continue;
    if (!isCodePath(path)) continue;
    total += Number(added) + Number(deleted);
  }
  return total;
}

/** Added lines that begin a public name: the new exports of a diff of code files. */
export function countNewExports(diffText) {
  return diffText.split("\n").filter((line) => /^\+(export |pub |def [A-Za-z])/.test(line)).length;
}

/** True when the diff of a package manifest adds a dependency line. */
export function hasNewDependency(manifestDiff) {
  return manifestDiff.split("\n").some((line) => /^\+\s+"[^"]+":\s*"[\^~>=]*\d/.test(line) && !/"version"/.test(line));
}

export function totalCodeLines(commits) {
  return commits.reduce((sum, commit) => sum + commit.codeLines, 0);
}
