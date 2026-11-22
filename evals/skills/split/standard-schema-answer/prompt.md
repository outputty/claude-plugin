---
name: split-standard-schema-answer
tags: [split-answer]
plugins: ["../../../.."]
max_turns: 4
timeout_seconds: 240
allowed_tools: [Skill, Read, Glob, Grep]
---

```ts
const issues = validate(schema, input); // TypeBox errors: { instancePath: "/headers/content~1type", message }
for (const issue of issues) {
  const path = issue.instancePath.split("/").slice(1);
  console.log(path.join("."), issue.message);
}
```

For the header `content/type` this prints `headers.content~1type`. How do I get the real path segments?
