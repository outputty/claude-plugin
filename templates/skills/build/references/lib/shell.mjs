/** Runs commands without a shell, so no argument needs quoting, and returns what they print. */
import { execFileSync } from "node:child_process";

/** Runs `command` with `args` and returns its stdout; a failing command throws with its stderr. */
export function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  });
}

/** Prints a script's result as JSON. */
export function print(result) {
  console.log(JSON.stringify(result, null, 2));
}
