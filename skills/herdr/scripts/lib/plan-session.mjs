/** Which session each case of the herdr skill starts: its name, tab, worktree, model, permission mode and prompt. */

export const OPUS = "claude-opus-5-5";
const MAX_GOAL_CHARS = 4000;

/** One line, as a prompt rides on one: runs of whitespace and newlines become one space. */
export function flatten(text) {
  return text.replace(/\s+/g, " ").trim();
}

/** The lowest `<repo>-builder-<k>` no agent holds. */
export function nextBuilderName(repo, agentNames) {
  for (let k = 1; ; k++) if (!agentNames.includes(repo + "-builder-" + k)) return repo + "-builder-" + k;
}

/** The highest number `k` among the repo's builders, or 0 when it has none. */
export function lastBuilderNumber(repo, agentNames) {
  const numbers = agentNames
    .map((name) => new RegExp("^" + repo + "-builder-(\\d+)$").exec(name))
    .filter(Boolean)
    .map((match) => Number(match[1]));
  return numbers.length ? Math.max(...numbers) : 0;
}

function need(request, ...fields) {
  const missing = fields.filter((field) => !request[field] || !String(request[field]).trim());
  if (missing.length) throw new Error("the " + request.case + " case needs --" + missing.join(" and --"));
}

/** The Why and What a ticket carries: its last \`needs-planning:\` comment, else its title and the first line of its Problem; null when it has neither. */
export function reasonFromTicket(ticket) {
  const marked = [...ticket.comments].reverse().find((comment) => comment.body.startsWith("needs-planning:"));
  const why = marked && /\*\*Why:\*\*\s*(.+)/.exec(marked.body)?.[1];
  const what = marked && /\*\*What:\*\*\s*(.+)/.exec(marked.body)?.[1];
  if (why && what) return { why, what };
  const problem = /##\s*Problem\s*\n+([^\n]+)/i.exec(ticket.body || "")?.[1];
  // A ticket with no marked comment and no Problem line has nothing to say about why it is being planned.
  return problem ? { why: ticket.title, what: problem } : null;
}

/** The prompt of a plan session: the ticket with its Why and What, or the idea. A ticket with no reason is refused. */
function planPrompt(request) {
  if (request.idea) return "/plan " + flatten(request.idea);
  need(request, "ticket", "why", "what");
  const sentence = (text) => flatten(text).replace(/\.$/, "");
  return "/plan " + request.ticket + " Why: " + sentence(request.why) + ". What: " + sentence(request.what) + ".";
}

const CASES = {
  build(request, repo, names) {
    need(request, "ticket", "goal", "feature");
    const prompt = [
      request.goal,
      "Feature branch: " + request.feature,
      request.goAhead ? "GO-AHEAD " + request.feature : "",
    ];
    return {
      name: nextBuilderName(repo, names),
      label: "",
      placement: "agents",
      worktree: "ticket-" + request.ticket,
      model: request.small ? "haiku" : "sonnet",
      effort: "medium",
      bypass: true,
      prompt: flatten(prompt.join(" ")),
    };
  },
  "build-loop"(request, repo, names) {
    need(request, "goal");
    return {
      name: nextBuilderName(repo, names),
      label: "",
      placement: "agents",
      worktree: "build-loop",
      model: "sonnet",
      effort: "medium",
      bypass: true,
      prompt: flatten(request.goal),
    };
  },
  orchestrator(request, repo) {
    const fallback = "List the open tickets per the tracker skill and start what is buildable.";
    return {
      name: repo + "-orchestrator",
      label: "",
      placement: "agents",
      worktree: "",
      model: "sonnet",
      effort: "",
      bypass: true,
      prompt: flatten(request.prompt || fallback),
    };
  },
  research(request) {
    need(request, "slug", "topic");
    return {
      name: "research" + request.slug,
      label: "(research) " + request.slug,
      placement: "tab",
      worktree: "research-" + request.slug,
      model: OPUS,
      effort: "ultracode",
      bypass: true,
      prompt: "/research " + flatten(request.topic),
    };
  },
  plan(request) {
    const id = request.ticket || request.slug;
    need({ ...request, id }, "id");
    return {
      name: "plan" + id,
      label: "(plan) " + id,
      placement: "tab",
      worktree: "plan-" + id,
      model: OPUS,
      effort: "",
      bypass: false,
      prompt: planPrompt(request),
    };
  },
  question(request) {
    need(request, "builder", "k", "text");
    const id = request.builder + "-" + request.k;
    return {
      name: request.builder + "-ask-" + request.k,
      label: "(ask) " + id,
      placement: "tab",
      worktree: "ask-" + id,
      model: OPUS,
      effort: "",
      bypass: false,
      prompt: "/plan question " + request.k + " from " + request.builder + ": " + flatten(request.text),
    };
  },
  proto(request) {
    const id = request.ticket || request.slug;
    need({ ...request, id }, "id");
    const subject = request.ticket ? request.ticket : flatten(request.idea || request.slug);
    return {
      name: "proto" + id,
      label: "(proto) " + id,
      placement: "tab",
      worktree: "proto-" + id,
      model: "haiku",
      effort: "",
      bypass: true,
      prompt: "/prototype " + subject,
    };
  },
};

const BUILD_CASES = ["build", "build-loop"];

/** True for the sessions that plan, prototype, research or answer a question: never the ones that build. */
export function isPlanningSession(agentName) {
  return /^(plan|proto|research)/.test(agentName) || /-ask-\d+$/.test(agentName);
}

/** A planning session starts no build, however it is asked. */
export function forbidBuildFrom(caseName, ownName) {
  if (BUILD_CASES.includes(caseName) && ownName && isPlanningSession(ownName))
    throw new Error("a planning session never starts a build: " + ownName + " files its ticket and stops");
}

/** The session a request starts, or an error naming what the case lacks. */
export function planSession(request, repo, agentNames) {
  const make = CASES[request.case];
  if (!make) throw new Error("unknown case " + request.case + ", expected " + Object.keys(CASES).join("|"));
  const session = make(request, repo, agentNames);
  // A goal line over the limit is cut by the harness, so the builder would start on half its end condition.
  if (session.prompt.startsWith("/goal") && session.prompt.length > MAX_GOAL_CHARS)
    throw new Error("the goal line is " + session.prompt.length + " characters; keep it under " + MAX_GOAL_CHARS);
  return session;
}

/** What follows `--` in `herdr agent start`: the arguments of `claude`, the prompt last. */
export function claudeArgs(session) {
  const args = [];
  if (session.worktree) args.push("--worktree", session.worktree);
  if (session.bypass) args.push("--permission-mode", "bypassPermissions");
  if (session.model) args.push("--model", session.model);
  if (session.effort) args.push("--effort", session.effort);
  return [...args, session.prompt];
}
