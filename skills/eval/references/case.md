# A case

One folder per case, under the section it checks:

```text
evals/style/
├── fixture.sh                    seeds a small repo, for cases that need tools
├── reply/
│   └── error/
│       ├── prompt.md             frontmatter, then the prompt
│       └── graders/
│           ├── reply-cause.md
│           └── close-recap.md
└── less/
    └── limit/
        ├── prompt.md
        ├── case.yaml             names the fixture
        ├── fixture.sh -> ../../fixture.sh
        └── graders/less-scope.md
```

An inline case pastes the code it needs and grants no tools:

```markdown
---
name: reply-error
tags: [reply, close]
plugins: ["../../../.."]
max_turns: 3
timeout_seconds: 300
allowed_tools: []
---

Getting this error when I run `ledger import` a second time: <the stack trace and the two files it names, pasted in fences>

Why?
```

A case that measures tool use runs in the fixture repo:

```markdown
---
name: less-limit
tags: [less, close]
plugins: ["../../../.."]
max_turns: 30
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Edit, Write]
---

Add a --limit <n> option to `ledger export` that stops after n invoices.
```

```yaml
schema_version: "1.1"
name: less-limit
context:
  scaffold_script: fixture.sh
```

`plugins` points at the plugin root; set it when the root has no `.claude-plugin/plugin.json`, or the plugin never loads. Edit and Write run only with `--allow-tools`, which `round.sh` passes.

One grader per file, the file name its `<section>-<check>` name. An `llm` grader states a concrete PASS and FAIL:

```markdown
---
type: llm
---

PASS if the reply says the cause is that saveInvoice calls store.insert, a plain INSERT, so an invoice whose id is already stored violates the primary key. FAIL if it names another cause.
```

A `regex` grader reads the final reply, a `tool_used` grader the calls:

```markdown
---
type: regex
pattern: "### Problem[\\s\\S]*### Next"
---
```

```markdown
---
type: tool_used
tool: Edit
input_match: "import\\.ts"
min: 0
max: 0
---
```
