/** What a ticket's body says about where its plan was read: the commit it was drafted against and the paths it names. */

/** The `main` commit in the "Drafted against" line, or "" when the body has none. */
export function draftedAgainst(body) {
  const match = /Drafted against:\s*`([0-9a-f]{7,40})`/i.exec(body);
  return match ? match[1] : "";
}

/** The file paths a body names in backticks, without a trailing :line, in the order first named. */
export function pathsIn(body) {
  const found = [];
  for (const [, token] of body.matchAll(/`([^`\s]+)`/g)) {
    const path = token.replace(/:\d+(-\d+)?$/, "");
    // A path has a directory or an extension; a bare word or a flag is not one.
    if (!/^[\w.@-]+(\/[\w.@-]+)+$|^[\w-]+\.[a-z]{1,5}$/.test(path)) continue;
    if (!found.includes(path)) found.push(path);
  }
  return found;
}

/** What happened to a path since the draft: "gone" when it is absent now, "changed" when its diff is not empty. */
export function classifyPath(existsNow, diffText) {
  if (!existsNow) return "gone";
  if (diffText.trim()) return "changed";
  return "unchanged";
}
