# OUTPUTTY - environment incomplete

Read-only work (reading, searching, answering) is fine, but REAL work is gated: the
require-environment guard denies file edits outside a git repository, and the outputty flow
additionally needs a GitHub remote, authenticated `gh`, and the `gh stack` extension (layers publish
as a stack of PRs — there is no single-PR fallback). Missing here:

{{missing}}

Fix these before doing real work in this project.
