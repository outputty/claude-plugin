/** What a review thread is, and the state it is in: the review's markers on a comment, and who spoke last. */
/** "[review F3 tests] text" gives "F3 tests"; anything else gives "". */
export function tagOf(body) {
  const match = /^\[review ([^\]]+)\]/.exec(body);
  if (!match) return "";
  return match[1];
}

export function firstSentence(text) {
  return text.split("\n")[0].split(". ")[0].slice(0, 160);
}

/** A thread the review opened: its first comment starts with a review marker. */
export function isReviewThread(thread) {
  return tagOf(thread.comments[0].body) !== "";
}

/** True when the review itself closed the thread: a reply starts "[review closed". */
export function wasClosedByReview(thread) {
  return thread.comments.some((comment) => comment.body.startsWith("[review closed"));
}

/** True when the builder spoke last on a thread, or resolved it: a fix or a reply the review has not read yet. */
export function hasNewWord(thread) {
  if (thread.isResolved) return true;
  const last = thread.comments[thread.comments.length - 1];
  return !last.body.startsWith("[review");
}

/** Threads that still need the review: open ones, and ones the builder resolved without the review's closing reply. */
export function countUnsettled(threads) {
  return threads.filter((thread) => !thread.isResolved || !wasClosedByReview(thread)).length;
}

/** One line per review thread: its state, its tag, its place and the builder's last word. */
export function describeThread(thread) {
  const state = thread.isResolved ? (wasClosedByReview(thread) ? "resolved" : "resolved by the builder") : "open";
  const last = thread.comments[thread.comments.length - 1];
  return (
    state +
    " " +
    tagOf(thread.comments[0].body) +
    " " +
    thread.path +
    ":" +
    thread.line +
    " - " +
    firstSentence(last.body)
  );
}

/** The first "Pinned head: <sha>" line of the PR's reviews: the head the review read, which a recheck diffs from. */
export function pinnedHeadOf(reviews) {
  for (const review of reviews) {
    const match = /^Pinned head: ([0-9a-f]+)/m.exec(review.body || "");
    if (match) return match[1];
  }
  return "";
}
