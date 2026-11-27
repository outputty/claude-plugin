/** Which tickets are buildable, in what order they are listed, and the goal lines that go with them. */

const TIER = { "priority:high": 0, "priority:low": 2 };

const hasLabel = (ticket, name) => ticket.labels.includes(name);

/** Labelled `ready`, with no assignee and every blocker closed. */
export function isBuildable(ticket) {
  return hasLabel(ticket, "ready") && ticket.assignees.length === 0 && ticket.openBlockers.length === 0;
}

function tierOf(ticket) {
  if (isBuildable(ticket) === false) return 3;
  const labelled = Object.keys(TIER).find((label) => hasLabel(ticket, label));
  // An unlabelled ticket sits between the high and the low tier.
  return labelled ? TIER[labelled] : 1;
}

/** Buildable tickets first, then `priority:high`, unlabelled and `priority:low`, newest first within a tier. */
export function orderTickets(tickets) {
  return [...tickets].sort((a, b) => tierOf(a) - tierOf(b) || b.createdAt.localeCompare(a.createdAt));
}

/** The status words after a ticket's title in the list. */
export function statusOf(ticket) {
  if (hasLabel(ticket, "needs-planning")) return "needs-planning";
  if (ticket.openBlockers.length) return "blocked by " + ticket.openBlockers.map((n) => "#" + n).join(", ");
  if (ticket.assignees.length) {
    const open = ticket.prs.filter((pr) => pr.state === "OPEN").length;
    const merged = ticket.prs.filter((pr) => pr.state === "MERGED").length;
    return "In Progress · " + open + " open PRs, " + merged + " merged";
  }
  const priority = ["priority:high", "priority:low"].find((label) => hasLabel(ticket, label));
  return ["buildable", priority].filter(Boolean).join(" · ");
}

/** One line per ticket, numbered, with a blank line between, in the shape of references/list.md. */
export function renderList(ordered) {
  return ordered
    .map((ticket, index) => index + 1 + ". #" + ticket.number + " " + ticket.title + "   " + statusOf(ticket))
    .join("\n\n");
}

/** The goal lines of references/goal-lines.md, with the numbers filled in. */
export function goalLines(numbers) {
  const [first] = numbers;
  const one =
    "/goal ticket #" +
    first +
    " is built by following /build " +
    first +
    ": its PR is open and ready for review with the docs layer last and each Implementation-criteria case's real output pasted; or a question to the user is open and not yet answered";
  const loop =
    "/goal every buildable ticket is built by following /build: each PR is open and ready for review, or merged when the merge rule allows; the goal ends when no open ticket is buildable";
  return { one: first ? one : "", loop };
}
