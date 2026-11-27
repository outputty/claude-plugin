/** Every review thread of a PR, read from GitHub. */
import { repoOf, run } from "./github.mjs";
import { pinnedHeadOf } from "./thread.mjs";

export const THREADS_QUERY =
  "query($o:String!,$r:String!,$n:Int!,$after:String){repository(owner:$o,name:$r){pullRequest(number:$n){headRefOid reviews(first:50){nodes{body}} reviewThreads(first:100,after:$after){totalCount pageInfo{hasNextPage endCursor} nodes{id isResolved path line comments(first:30){nodes{author{login} body}}}}}}}";

/** Every review thread of the PR, page after page, or an error when the count GitHub gives does not match. */
export function listThreads(pr) {
  const { owner, name } = repoOf();
  const threads = [];
  let after = "";
  let total = 0;
  let head = "";
  let pinnedHead = "";
  for (;;) {
    const args = [
      "api",
      "graphql",
      "-f",
      "query=" + THREADS_QUERY,
      "-f",
      "o=" + owner,
      "-f",
      "r=" + name,
      "-F",
      "n=" + pr,
    ];
    if (after) args.push("-f", "after=" + after);
    const page = JSON.parse(run("gh", args)).data.repository.pullRequest;
    head = page.headRefOid;
    pinnedHead = pinnedHeadOf(page.reviews.nodes);
    total = page.reviewThreads.totalCount;
    for (const node of page.reviewThreads.nodes) threads.push({ ...node, comments: node.comments.nodes });
    if (!page.reviewThreads.pageInfo.hasNextPage) break;
    after = page.reviewThreads.pageInfo.endCursor;
  }
  if (threads.length !== total) throw new Error("listed " + threads.length + " threads, GitHub counts " + total);
  return { head, pinnedHead, total, threads };
}
