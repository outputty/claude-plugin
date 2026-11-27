/** The two things the session script needs from herdr and the shell: running a command, and finding a pane id in its JSON. */
import { execFileSync } from "node:child_process";

/** Runs `command` with `args` and returns its stdout; no shell, so no argument needs quoting. */
export function shell(command, args) {
  return execFileSync(command, args, {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/** The pane id in a herdr reply: `result.<key>.pane_id`, or any other `pane_id` that is not `except`. */
export function findPaneId(reply, key, except = "") {
  const direct = reply.result?.[key]?.pane_id;
  if (direct && direct !== except) return direct;
  const found = [];
  const walk = (value) => {
    if (value && typeof value === "object") {
      for (const [name, inner] of Object.entries(value)) {
        if (name === "pane_id" && typeof inner === "string") found.push(inner);
        else walk(inner);
      }
    }
  };
  walk(reply);
  const pane = found.find((id) => id !== except);
  if (!pane) throw new Error("no pane id in the herdr reply");
  return pane;
}
