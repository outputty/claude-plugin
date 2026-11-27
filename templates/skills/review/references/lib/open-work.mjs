/** The review threads still open at the head, each with its link and the lines it points at, for the build to read. */
import { aroundLine, editorLink, fileAt } from "./excerpt.mjs";
import { isReviewThread, tagOf, wasClosedByReview } from "./thread.mjs";

/** Findings, in the shape `renderFinding` prints, for every review thread the review has not settled. */
export function openWork(threads, head, root) {
  return threads
    .filter(isReviewThread)
    .filter((thread) => !thread.isResolved || !wasClosedByReview(thread))
    .filter((thread) => thread.line)
    .map((thread) => {
      const [tag, axis] = tagOf(thread.comments[0].body).split(" ");
      return {
        tag,
        axis,
        file: thread.path,
        line: thread.line,
        claim: thread.comments[0].body.replace(/^\[review [^\]]+\] /, ""),
        link: editorLink(root, thread.path, thread.line),
        snippet: aroundLine(fileAt(head, thread.path), thread.line),
      };
    });
}
