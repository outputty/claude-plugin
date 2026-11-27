/** The one place the review scripts run `gh` and `git`, so every command reads GitHub the same way. */
import { execFileSync } from "node:child_process";

export const run = (command, args) => execFileSync(command, args, { encoding: "utf8", maxBuffer: 512 * 1024 * 1024 });

export function repoOf() {
  const info = JSON.parse(run("gh", ["repo", "view", "--json", "owner,name"]));
  return { owner: info.owner.login, name: info.name };
}
