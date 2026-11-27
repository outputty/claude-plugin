/** The project board a repo's CLAUDE.md names: its number, project id, Status field and option ids. */

/** Org and number, from a projects URL, or from a backticked `<org>/<number>` on a line that names the board. */
function boardRef(claudeMd) {
  const url = /github\.com\/(?:orgs|users)\/([^/\s)]+)\/projects\/(\d+)/.exec(claudeMd);
  if (url) return { org: url[1], number: url[2] };
  const line = claudeMd.split("\n").find((text) => /board/i.test(text) && /`[^`/\s]+\/\d+`/.test(text));
  const pair = line ? /`([^`/\s]+)\/(\d+)`/.exec(line) : null;
  return pair ? { org: pair[1], number: pair[2] } : {};
}

/** Status options as `Name \`8-hex id\``, read from the lines that mention the Status or its options. */
function statusOptions(claudeMd) {
  const options = {};
  const lines = claudeMd.split("\n").filter((text) => /status|option/i.test(text));
  for (const line of lines)
    for (const [, name, id] of line.matchAll(/([A-Z][A-Za-z]*(?: [A-Za-z]+)*) `([0-9a-f]{8})`/g))
      options[name.trim().toLowerCase()] = id;
  return options;
}

/**
 * Reads the board from a CLAUDE.md in whatever layout it uses: one **Board** line, or one bullet each for the
 * number, the project id, the Status field id and the Status options. The ids are matched by their prefixes.
 */
export function parseBoard(claudeMd) {
  const { org, number } = boardRef(claudeMd);
  const projectId = /\bPVT_\w+/.exec(claudeMd)?.[0];
  const fieldId = /\bPVTSSF_\w+/.exec(claudeMd)?.[0];
  // A repo without these has no board to move items on, and a guessed id would move the wrong item.
  if (!org || !number || !projectId || !fieldId)
    throw new Error(
      "CLAUDE.md does not give the board's org and number, its project id (PVT_…) and its Status field id (PVTSSF_…)",
    );
  return { org, number, projectId, fieldId, options: statusOptions(claudeMd) };
}

/** The option id of a status the build may set: "todo" or "in progress"; never "done", which closing a ticket sets. */
export function optionFor(board, status) {
  if (status === "done") throw new Error("do not move an item to Done: closing the ticket or merging its PR does");
  const id = board.options[status];
  if (!id) throw new Error("no status " + status + " on the board, expected " + Object.keys(board.options).join(", "));
  return id;
}
