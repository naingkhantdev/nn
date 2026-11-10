// Reads Claude Code hook JSON from stdin. Returns {} on empty or invalid input.
export async function readInput() {
  let raw = ''
  for await (const chunk of process.stdin) raw += chunk
  try {
    return raw.trim() ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
