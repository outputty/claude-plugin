/** The project board a repo's CLAUDE.md names: its number, project id, Status field and option ids. */

/** Reads the **Board** line: `<org>/<number>`, the project id, the Status field id and each `Name \`option id\``. */
export function parseBoard(claudeMd) {
  const line = claudeMd.split("\n").find((text) => /\*\*Board\*\*/.test(text));
  // A repo without a Board line has no board to move items on.
  if (!line) throw new Error("CLAUDE.md has no **Board** line");
  const [, org, number] = /`([^`/]+)\/(\d+)`/.exec(line) ?? [];
  const [, projectId] = /project id `([^`]+)`/.exec(line) ?? [];
  const [, fieldId] = /Status field `([^`]+)`/.exec(line) ?? [];
  const options = {};
  for (const [, name, id] of line.matchAll(/([A-Za-z][A-Za-z ]*?) `([0-9a-f]{8})`/g))
    options[name.trim().toLowerCase()] = id;
  if (!org || !projectId || !fieldId)
    throw new Error("the **Board** line lacks its number, project id or Status field id");
  return { org, number, projectId, fieldId, options };
}

/** The option id of a status the build may set: "todo" or "in progress"; never "done", which closing a ticket sets. */
export function optionFor(board, status) {
  if (status === "done") throw new Error("do not move an item to Done: closing the ticket or merging its PR does");
  const id = board.options[status];
  if (!id) throw new Error("no status " + status + " on the board, expected " + Object.keys(board.options).join(", "));
  return id;
}
