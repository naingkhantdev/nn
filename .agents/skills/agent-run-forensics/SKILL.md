---
name: agent-run-forensics
description: "Audits an AI agent run by comparing its final claims against the actual tool calls, logs and file changes. Use when an agent says work is done and you need to verify it really happened."
---

# agent-run-forensics

## Steps
1. Collect the evidence: transcript or tool-call log, shell output, git diff, and the agent's final summary.
2. Split the final summary into separate claims (e.g. "tests pass", "file X updated", "bug fixed").
3. For each claim, find the evidence that proves it: the exact command and its output, the diff hunk, the file contents.
4. Mark each claim as one of:
   - **VERIFIED** — direct evidence exists
   - **UNSUPPORTED** — no evidence either way
   - **CONTRADICTED** — the evidence shows the opposite (e.g. the test command exited non-zero)
5. Output a table: claim | verdict | evidence (with file:line or log line).

## Red flags
- Says "tests pass" but no test command was run
- Says a file was edited but the diff does not contain it
- Errors in the log that the summary never mentions
