#!/usr/bin/env node
/**
 * Starts a herdr session for one case: build, build-loop, orchestrator, research, plan, question or proto.
 *
 * Usage: node session.mjs <case> [--ticket n] [--idea text] [--slug s] [--topic t] [--why text] [--what text]
 *                         [--goal line] [--feature branch] [--go-ahead] [--small] [--builder name] [--k n]
 *                         [--text question] [--prompt text] [--dry-run] [--repo name] [--agents a,b]
 *
 * It picks the name, tab, worktree, model and permission mode of the case, passes the prompt as an argument (so
 * nothing needs quoting), refuses a plan prompt with no Why and What, and starts nothing when the agent already
 * exists. A start that does not show up in `herdr agent list` is tried once more.
 *
 * Outside Herdr it prints the `claude` command for you to run, and starts nothing.
 */
import { basename, dirname } from "node:path";
import { parseArgs } from "node:util";
import { claudeArgs, forbidBuildFrom, lastBuilderNumber, planSession } from "./lib/plan-session.mjs";
import { findPaneId, shell } from "./lib/herdr.mjs";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    ticket: { type: "string" },
    idea: { type: "string" },
    slug: { type: "string" },
    topic: { type: "string" },
    why: { type: "string" },
    what: { type: "string" },
    goal: { type: "string" },
    feature: { type: "string" },
    "go-ahead": { type: "boolean" },
    small: { type: "boolean" },
    builder: { type: "string" },
    k: { type: "string" },
    text: { type: "string" },
    prompt: { type: "string" },
    "dry-run": { type: "boolean" },
    repo: { type: "string" },
    agents: { type: "string" },
  },
});
const request = { case: positionals[0], ...values, goAhead: values["go-ahead"] };
const git = (...args) => shell("git", args).trim();
const repo = values.repo || basename(dirname(git("rev-parse", "--path-format=absolute", "--git-common-dir")));
const listed = values.agents !== undefined ? null : JSON.parse(shell("herdr", ["agent", "list"])).result.agents;
const agents = listed ? listed.map((agent) => agent.name).filter(Boolean) : values.agents.split(",").filter(Boolean);
const own = listed?.find((agent) => agent.pane_id === process.env.HERDR_PANE_ID)?.name;
forbidBuildFrom(request.case, own);
const session = planSession(request, repo, agents);
const args = claudeArgs(session);

function startAgent(pane) {
  shell("herdr", ["agent", "start", session.name, "--kind", "claude", "--pane", pane, "--", ...args]);
}

function isListed() {
  return JSON.parse(shell("herdr", ["agent", "list"])).result.agents.some((agent) => agent.name === session.name);
}

function placeIn(workspace, cwd) {
  const create = (label) =>
    findPaneId(
      JSON.parse(
        shell("herdr", ["tab", "create", "--workspace", workspace, "--cwd", cwd, "--label", label, "--no-focus"]),
      ),
      "root_pane",
    );
  if (session.placement === "tab") return create(session.label);
  const own = (name) => listed.find((agent) => agent.name === name && agent.workspace_id === workspace);
  const orchestrator = own(repo + "-orchestrator");
  // With no orchestrator the agents tab does not exist yet, so this session opens it as its first pane.
  if (!orchestrator || session.name === repo + "-orchestrator") return create("(agents)");
  const last = lastBuilderNumber(repo, agents);
  const from = last ? own(repo + "-builder-" + last) : orchestrator;
  const direction = last ? "down" : "right";
  return findPaneId(
    JSON.parse(shell("herdr", ["pane", "split", from.pane_id, "--direction", direction, "--no-focus"])),
    "pane",
    from.pane_id,
  );
}

if (!process.env.HERDR_ENV && !values["dry-run"]) {
  console.log("not in Herdr; run: claude " + args.map((arg) => JSON.stringify(arg)).join(" "));
} else if (agents.includes(session.name)) {
  console.log(JSON.stringify({ status: "exists", name: session.name }, null, 2));
} else if (values["dry-run"]) {
  console.log(
    JSON.stringify(
      { status: "dry-run", name: session.name, placement: session.placement, label: session.label, args },
      null,
      2,
    ),
  );
} else {
  const pane = placeIn(process.env.HERDR_WORKSPACE_ID, git("rev-parse", "--show-toplevel"));
  shell("git", ["fetch", "origin", "main"]);
  startAgent(pane);
  // A start that never reaches the agent list left an empty tab; one more try, then say so.
  if (!isListed()) startAgent(pane);
  console.log(JSON.stringify({ status: isListed() ? "started" : "failed", name: session.name, pane }, null, 2));
}
