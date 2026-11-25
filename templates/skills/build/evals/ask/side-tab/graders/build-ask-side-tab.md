---
type: llm
---

PASS if the reply opens a side tab on a fork of the build session (the herdr skill's Ask case, `--resume <id> --fork-session`) with the question, answers the user in one line pointing at that tab, and keeps building layer 3. FAIL if the build answers the question at length in its own tab, or stops building.
