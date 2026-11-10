// PreToolUse on Edit|Write|Bash. Exit 2 blocks the tool call.
import { readInput } from './read-input.mjs'

const SECRET_FILE =
  /(service[-_]?account[^/\\\s]*\.json|\.dev\.vars|(^|[/\\\s])\.env(\.[\w-]+)?(\s|$)|\.(jks|keystore|pem|p12)(\s|$)|key\.properties)/i
const SECRET_TEXT = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /"type"\s*:\s*"service_account"/,
  /"private_key"\s*:/,
]

const input = await readInput()
const t = input.tool_input ?? {}
const block = (why) => {
  process.stderr.write(
    `Blocked: ${why}. Secrets must never enter the repo; use a Worker secret or keep the file outside the project.\n`,
  )
  process.exit(2)
}

if (
  t.file_path &&
  SECRET_FILE.test(t.file_path) &&
  !/\.example$/.test(t.file_path)
) {
  block(`writing a secret-looking file (${t.file_path})`)
}
const text = [
  t.content,
  t.new_string,
  ...(t.edits ?? []).map((e) => e.new_string),
]
  .filter(Boolean)
  .join('\n')
if (SECRET_TEXT.some((re) => re.test(text)))
  block('content looks like a private key or service account')

if (t.command) {
  if (/\bgit\s+(add|commit)\b/.test(t.command) && SECRET_FILE.test(t.command)) {
    block('git command names a secret-looking file')
  }
  if (SECRET_TEXT.some((re) => re.test(t.command)))
    block('command contains a private key')
}
process.exit(0)
