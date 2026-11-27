/** The shape of a stack of PRs: which PR sits on which, found from the PRs' own base branches. */

/** The open PRs, bottom to top, walked down from the top branch through each PR's base until `base`. */
export function chainFrom(prs, topBranch, base) {
  const byHead = new Map(prs.map((pr) => [pr.headRefName, pr]));
  const chain = [];
  let branch = topBranch;
  while (branch !== base) {
    const pr = byHead.get(branch);
    // A branch with no open PR breaks the chain, so linking or rebasing it would skip a layer.
    if (!pr) throw new Error("no open PR for branch " + branch + " between " + topBranch + " and " + base);
    chain.unshift(pr);
    branch = pr.baseRefName;
  }
  return chain;
}

/** The branch the walk down from `topBranch` ends on: the base of the lowest PR that has a PR under it. */
export function bottomBase(prs, topBranch) {
  const byHead = new Map(prs.map((pr) => [pr.headRefName, pr]));
  let branch = topBranch;
  while (byHead.has(branch)) branch = byHead.get(branch).baseRefName;
  return branch;
}

/** What to rebase after a lower layer changed: each branch above it, bottom to top, onto the branch below it. */
export function restackPlan(chain, changedBranch) {
  const index = chain.findIndex((pr) => pr.headRefName === changedBranch);
  // A changed branch outside the chain has nothing above it to rebase.
  if (index < 0) throw new Error("branch " + changedBranch + " is not in the chain");
  return chain.slice(index + 1).map((pr) => ({ branch: pr.headRefName, onto: pr.baseRefName }));
}
