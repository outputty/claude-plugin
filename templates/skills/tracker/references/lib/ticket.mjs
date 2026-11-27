/** What the build reads from a ticket: its base branch, its draft commit and whether it can be built as written. */

/** The branch in the "- Base:" line, or "main" when the ticket has none. */
export function baseOf(body) {
  const match = /^- Base: `([^`]+)`/m.exec(body);
  return match ? match[1] : "main";
}

/** True when the body has a **How to validate** section with something under it. */
export function hasHowToValidate(body) {
  const match = /How to validate\**\s*:?\s*\n+([^\n#][^\n]*)/i.exec(body);
  return Boolean(match);
}

/** The text of a send-back comment: the Why and the What, one line each, after the marker the plan session reads. */
export function sendBackComment(why, what) {
  const clean = (text) => text.replace(/\s+/g, " ").trim();
  // A comment without both parts is the empty tab the user saw, so neither may be blank.
  if (!clean(why) || !clean(what)) throw new Error("send-back needs a Why and a What");
  return "needs-planning:\n**Why:** " + clean(why) + "\n**What:** " + clean(what);
}

/** The prompt a plan session starts with for a ticket sent back. */
export function planPrompt(ticket, why, what) {
  const sentence = (text) => text.replace(/\s+/g, " ").trim().replace(/\.$/, "");
  return "/plan " + ticket + " Why: " + sentence(why) + ". What: " + sentence(what) + ".";
}
