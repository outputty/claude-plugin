# Asking the builder

The builder is the Herdr agent named in the review's input, `<builder>`, such as `<repo>-builder-<k>`. Ask one question at a time; number them from 1.

Write the question blunt and dry: the `file:line`, then the question, then `Source or no proof.` Give no reasoning, no summary of the finding and no context. A why question carries the one fact it needs: the alternative that existed, with its `file:line`, or the ticket line that said otherwise.

- `Q1 src/orders/refund.ts:41: where did RefundState come from? Source or no proof.`
- `Q2 src/util/money.ts:9: why formatMoney when src/lib/money.ts:12 formatCurrency exists?`
- `Q3 src/orders/refund.ts:44: why pending when ticket criterion 2 says nothing to refund?`

Send the question, with no `--wait`, because `--wait` can return on the turn already in progress:

```sh
herdr agent prompt <builder> "Q<q> <file:line>: <question> Source or no proof. Begin ANSWER <q>:"
```

Send a stop the same way: `herdr agent prompt <builder> "Split <sha>. Reset it and redo it as separate commits."`

Read the answer until a line that starts `⏺ ANSWER <q>:` shows; the screen holds the question too, so match the answer's marker, not the question's:

```sh
herdr agent read <builder> --source recent-unwrapped --lines 80
```

Give up on an answer after ten minutes of reading every thirty seconds, and treat it as `no proof`.

## Proof for each kind of pointer

- A `file:line` or a commit: run `git show <pinned head>:<path>` or `git show <sha>`, and read it.
- A ticket or plan-comment line: read it in the evidence of step 3, not in the answer's quote of it.
- A sibling on `origin/<base>`: run `git show origin/<base>:<path>`.
- Words a user typed in the build's session: search the transcripts under `~/.claude/projects/` for the build worktree's folder, in the entries of type `user` whose content is text and not a `tool_result`. The build's own turns are claims and prove nothing.
- A pointer that does not exist, or says something other than claimed: the finding stands, and add a finding for the false claim, quoting both.
