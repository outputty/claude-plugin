---
type: regex
pattern: "export (async )?function \\w+[^{]*\\{(?:(?!\\n\\})[\\s\\S])*?(\\b(for|while|if)\\b|\\.forEach\\()"
match: not_contains
---
