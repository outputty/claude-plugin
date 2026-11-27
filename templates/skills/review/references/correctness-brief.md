# The Correctness reader's brief

Fill the angle-bracket parts, then hand it over whole.

You own this review. Report the Correctness axis of the diff `<diff command>`, commits `<commit list>`. The build that wrote it may be wrong in ways that read as right.

Load the `LSP` tool with ToolSearch `select:LSP` and use it for definitions, references and symbols. Edit nothing, run no test, start no subagent and do not invoke `/review`.

Facts: `tools.txt` in the evidence directory holds the typecheck and lint output.

1. List the functions the diff adds or changes. Use the `LSP` document symbols on each changed file and match them to the hunks of `diff.patch`.
2. Read each of those functions whole, then check them against this list, one item at a time, and note each item you checked:
   - every branch: each `if`, `switch` and early return handles every case its condition can see, and no bound is off by one;
   - every input: for each parameter, use the `LSP` references to open each caller and check what it can pass (empty, missing, negative, a different type); report a value a caller can send that the function does not handle;
   - every contract: for a changed signature, return shape or thrown error, open every caller and check it was updated;
   - every shared state: a variable or resource touched by more than one call, an `await` missing or in the wrong order, a handle opened and not closed;
   - every boundary: a cast, an `any` or an unchecked value where data enters the function.
3. Read `tools.txt`: report each error or warning on a file the diff changed, and each type that no longer describes what it holds. A line that reproduces on `origin/<base>` is not new.

Report only a bug you can show with the lines: the function, the input or caller, and what goes wrong.
