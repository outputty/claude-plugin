/** Which errors of a check run are new: the ones a run on the ticket's base commit does not show. */

const ANSI = /\x1b\[[0-9;]*m/g;
const ERROR_LINE = /error|✖|✗|warn|fail|not ok/i;

/** One output line with colours, line and column numbers removed, so the same error at a moved line matches. */
export function normalizeLine(line) {
  return line
    .replace(ANSI, "")
    .replace(/:\d+(:\d+)?/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** The lines of a check's output that report a problem, as printed. */
export function errorLines(output) {
  return output
    .split("\n")
    .map((line) => line.replace(ANSI, "").trimEnd())
    .filter((line) => ERROR_LINE.test(line));
}

/** The problem lines of the run at the head that the run at the base did not print. */
export function newErrors(headOutput, baseOutput) {
  const known = new Set(errorLines(baseOutput).map(normalizeLine));
  return errorLines(headOutput).filter((line) => !known.has(normalizeLine(line)));
}
