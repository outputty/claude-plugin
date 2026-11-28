/** Which ticket a merged PR finishes: the one its body closes, since GitHub closes it only when the PR reaches the default branch. */

/** The ticket number in a "Closes #n" line of a PR body, or null when the body closes none. */
export function ticketClosedBy(body) {
  const match = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#(\d+)/i.exec(body || "");
  return match ? Number(match[1]) : null;
}
