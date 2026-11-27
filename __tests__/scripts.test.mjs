import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, test } from "node:test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD = join(ROOT, "templates/skills/build/references");
const TRACKER = join(ROOT, "templates/skills/tracker/references");
const HERDR = join(ROOT, "skills/herdr/scripts");
const load = (path) => import(path);
const node = (script, args, options = {}) =>
  execFileSync("node", [script, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...options });

function tempRepo() {
  const dir = mkdtempSync(join(tmpdir(), "scripts-test-"));
  const git = (...args) => execFileSync("git", args, { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  writeFileSync(join(dir, "a.txt"), "one\n");
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  return { dir, git };
}

describe("the herdr session script starts each case by its rules", () => {
  const session = (args) => JSON.parse(node(join(HERDR, "session.mjs"), [...args, "--dry-run", "--repo", "shop"]));

  test("a plan session for a ticket carries its Why and What, and a bare one is refused", () => {
    const started = session([
      "plan",
      "--ticket",
      "1769",
      "--why",
      "a ruling is open",
      "--what",
      "decide it",
      "--agents",
      "x",
    ]);
    assert.equal(started.name, "plan1769");
    assert.deepEqual(started.args.slice(-1), ["/plan 1769 Why: a ruling is open. What: decide it."]);
    // The plan and question sessions start in the default mode, with nothing to enable.
    assert.equal(started.args.includes("bypassPermissions"), false);
    assert.throws(() => session(["plan", "--ticket", "1769", "--agents", "x"]), /needs --why and --what/);
  });

  test("a builder takes the lowest free number, in the agents tab, in bypass mode, with its feature branch", () => {
    const started = session([
      "build",
      "--ticket",
      "5",
      "--goal",
      "/goal ticket #5 is built",
      "--feature",
      "feature/x",
      "--go-ahead",
      "--agents",
      "shop-builder-1,shop-orchestrator",
    ]);
    assert.equal(started.name, "shop-builder-2");
    assert.equal(started.placement, "agents");
    assert.deepEqual(started.args, [
      "--worktree",
      "ticket-5",
      "--permission-mode",
      "bypassPermissions",
      "--model",
      "sonnet",
      "--effort",
      "medium",
      "/goal ticket #5 is built Feature branch: feature/x GO-AHEAD feature/x",
    ]);
  });

  test("a question session is named after its builder and runs in the default mode", () => {
    const started = session([
      "question",
      "--builder",
      "shop-builder-1",
      "--k",
      "3",
      "--text",
      "Cast  here?\nor later?",
      "--agents",
      "x",
    ]);
    assert.equal(started.name, "shop-builder-1-ask-3");
    assert.equal(started.args.at(-1), "/plan question 3 from shop-builder-1: Cast here? or later?");
  });

  test("a session whose agent exists is not started again, and a goal over 4000 characters is refused", () => {
    assert.equal(session(["orchestrator", "--agents", "shop-orchestrator"]).status, "exists");
    assert.throws(
      () => session(["build-loop", "--goal", "/goal " + "x".repeat(4000), "--agents", "x"]),
      /keep it under 4000/,
    );
  });
});

describe("the build scripts read state and do only what is missing", () => {
  test("a stack's chain, its base and its restack plan come from the PRs' own base branches", async () => {
    const chain = await load(join(BUILD, "lib/chain.mjs"));
    const prs = [
      { number: 3, headRefName: "l3", baseRefName: "l2" },
      { number: 1, headRefName: "l1", baseRefName: "feature/x" },
      { number: 2, headRefName: "l2", baseRefName: "l1" },
    ];
    assert.deepEqual(
      chain.chainFrom(prs, "l3", "feature/x").map((pr) => pr.number),
      [1, 2, 3],
    );
    assert.equal(chain.bottomBase(prs, "l3"), "feature/x");
    assert.deepEqual(chain.restackPlan(chain.chainFrom(prs, "l3", "feature/x"), "l1"), [
      { branch: "l2", onto: "l1" },
      { branch: "l3", onto: "l2" },
    ]);
    assert.throws(() => chain.chainFrom(prs, "l3", "main"), /no open PR for branch feature\/x/);
  });

  test("checks tells a new error from one the base commit already prints", () => {
    const { dir, git } = tempRepo();
    const checks = (command) => {
      try {
        return JSON.parse(node(join(BUILD, "checks.mjs"), ["--base", "HEAD", "--cmd", command], { cwd: dir }));
      } catch (error) {
        return JSON.parse(error.stdout);
      }
    };
    assert.equal(checks("echo fine").verdict, "pass");
    // The same error at the base is not new.
    assert.equal(checks("echo 'error: old'; exit 1").results[0].status, "pre-existing only");
    // A file only the head has makes an error the base never printed.
    writeFileSync(join(dir, "bad"), "");
    const fresh = checks("test -e bad && echo 'error: bad file' && exit 1; exit 0");
    assert.equal(fresh.verdict, "fail");
    assert.deepEqual(fresh.results[0].newErrors, ["error: bad file"]);
    assert.ok(git("status", "--short").length > 0);
  });

  test("cleanup removes a review's worktree and folders, and a rerun finds nothing", () => {
    const { dir, git } = tempRepo();
    mkdirSync(join(dir, "tmp/review-7-evidence"), { recursive: true });
    git("worktree", "add", "--detach", join(dir, "tmp/review-7"), "HEAD");
    const first = JSON.parse(node(join(BUILD, "cleanup.mjs"), ["7"], { cwd: dir }));
    assert.equal(first.removed.length, 2);
    assert.equal(existsSync(join(dir, "tmp/review-7")), false);
    assert.deepEqual(JSON.parse(node(join(BUILD, "cleanup.mjs"), ["7"], { cwd: dir })).removed, []);
  });

  test("drift reads the draft commit and the paths a ticket names, and classifies each", async () => {
    const body = await load(join(BUILD, "lib/ticket-body.mjs"));
    const text = "- Drafted against: `abc1234`\nSee `src/a.ts:12`, `src/a.ts`, `README.md` and `--flag`.";
    assert.equal(body.draftedAgainst(text), "abc1234");
    assert.deepEqual(body.pathsIn(text), ["src/a.ts", "README.md"]);
    assert.equal(body.classifyPath(false, ""), "gone");
    assert.equal(body.classifyPath(true, " a | 2 +-"), "changed");
    assert.equal(body.classifyPath(true, ""), "unchanged");
  });
});

describe("the tracker scripts order tickets, refuse a blank send-back and read the board", () => {
  const ticket = (number, extra) => ({
    number,
    title: "t" + number,
    createdAt: "2026-0" + number,
    labels: ["ready"],
    assignees: [],
    openBlockers: [],
    prs: [],
    ...extra,
  });

  test("buildable tickets come first by priority, and the goal lines match references/goal-lines.md", async () => {
    const order = await load(join(TRACKER, "lib/order.mjs"));
    const tickets = [
      ticket(1, { labels: ["ready", "priority:low"] }),
      ticket(2, { labels: [] }),
      ticket(3, { labels: ["ready", "priority:high"] }),
      ticket(4, { openBlockers: [9] }),
      ticket(5),
    ];
    assert.deepEqual(
      order.orderTickets(tickets).map((entry) => entry.number),
      [3, 5, 1, 4, 2],
    );
    assert.equal(order.statusOf(tickets[3]), "blocked by #9");
    assert.equal(order.statusOf(tickets[2]), "buildable · priority:high");
    const lines = readFileSync(join(TRACKER, "goal-lines.md"), "utf8");
    const goal = order.goalLines([3]);
    assert.ok(lines.includes(goal.loop));
    assert.ok(lines.includes(goal.one.replace("#3", "#<n>").replace("/build 3", "/build <n>")));
  });

  test("a send-back needs both parts, and a plan prompt carries them", async () => {
    const body = await load(join(TRACKER, "lib/ticket.mjs"));
    assert.throws(() => body.sendBackComment("a reason", "  "), /needs a Why and a What/);
    assert.equal(body.sendBackComment("r.", "w."), "needs-planning:\n**Why:** r.\n**What:** w.");
    assert.equal(body.planPrompt("7", "r.", "w"), "/plan 7 Why: r. What: w.");
    assert.equal(body.baseOf("- Base: `prototype/x`"), "prototype/x");
    assert.equal(body.baseOf("no base"), "main");
  });

  test("the board is read from this repo's one-line Board entry and from a bullet-per-id layout", async () => {
    const board = await load(join(TRACKER, "lib/board.mjs"));
    const parsed = board.parseBoard(readFileSync(join(ROOT, "CLAUDE.md"), "utf8"));
    assert.equal(parsed.org, "outputty");
    assert.equal(parsed.number, "4");
    assert.equal(board.optionFor(parsed, "in progress"), "47fc9ee4");
    assert.throws(() => board.optionFor(parsed, "done"), /closing the ticket/);
    // Another repo lists the same ids as one bullet each.
    const bullets = [
      "- Owner / repo: `outputty/laygo` (org `outputty`).",
      "- Board: project number `3` (`https://github.com/orgs/outputty/projects/3`), project id `PVT_kwDOB5XC3c4BgwWB`.",
      "- Status field id: `PVTSSF_lADOB5XC3c4BgwWBzhfur8I`.",
      "- Status option ids: Todo `f75ad846`, In Progress `47fc9ee4`, Done `98236657`.",
    ].join("\n");
    const other = board.parseBoard(bullets);
    assert.deepEqual(
      [other.org, other.number, other.projectId, other.fieldId],
      ["outputty", "3", "PVT_kwDOB5XC3c4BgwWB", "PVTSSF_lADOB5XC3c4BgwWBzhfur8I"],
    );
    assert.equal(board.optionFor(other, "todo"), "f75ad846");
    assert.throws(() => board.parseBoard("no board here"), /does not give the board/);
  });
});
