---
name: split-standard-schema
tags: [split]
plugins: ["../../../.."]
max_turns: 2
timeout_seconds: 180
allowed_tools: [Skill]
---

```ts
const issues = validate(schema, input); // TypeBox errors: { instancePath: "/headers/content~1type", message }
for (const issue of issues) {
  const path = issue.instancePath.split("/").slice(1);
  console.log(path.join("."), issue.message);
}
```

For the header `content/type` this prints `headers.content~1type`. How do I get the real path segments?
