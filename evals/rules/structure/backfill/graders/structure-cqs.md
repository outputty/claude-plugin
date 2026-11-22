---
type: regex
pattern: "(function \\w+|=>\\s*)[^{;]*\\{(?:(?!\\n\\})[\\s\\S])*?(?:(saveInvoice|\\.insert)\\((?:(?!\\n\\})[\\s\\S])*?\\breturn\\s+[^;\\s}]|\\breturn\\s+[^;\\s}](?:(?!\\n\\})[\\s\\S])*?(saveInvoice|\\.insert)\\()"
match: not_contains
---
