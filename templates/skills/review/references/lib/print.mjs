/** Prints a script's result as JSON, then its report for reading. */
export function print(result) {
  console.log(JSON.stringify(result, null, 2));
  // The report is for reading, not for parsing.
  if (result.report) console.log("\n" + result.report);
}
