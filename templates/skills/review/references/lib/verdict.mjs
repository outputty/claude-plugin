/** The verdict of a round: clean, idle or open, and what the build does next. */
import { countUnsettled, describeThread, hasNewWord, isReviewThread } from "./thread.mjs";

export function decideVerdict(open, changed) {
  // Nothing is open, so the review is done.
  if (open === 0) return "clean";
  // No open thread has a new fix or reply, so a recheck would read what it already read.
  if (changed === 0) return "idle";
  return "open";
}

/** What the build does for a verdict. */
export function nextStep(verdict, open, round) {
  if (verdict === "clean") return "Every review thread is resolved. Go on.";
  if (verdict === "idle")
    return (
      "Nothing changed on the " +
      open +
      " open threads since the last round. Start no recheck: fix a thread, reply with its pointer, or send each decision to a question session, then run status again."
    );
  return "Address what is still open, then start a recheck at round " + (round + 1) + ".";
}

export function renderStatus(threads, round) {
  const mine = threads.filter(isReviewThread);
  const open = countUnsettled(mine);
  const changed = countUnsettled(mine.filter(hasNewWord));
  const verdict = decideVerdict(open, changed);
  const title = "Review threads: " + mine.length + " in all, " + open + " not settled, verdict " + verdict;
  return {
    verdict,
    open,
    text: [title, ...mine.map(describeThread), "Next: " + nextStep(verdict, open, round)].join("\n"),
  };
}
