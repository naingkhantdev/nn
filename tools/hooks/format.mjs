// PostToolUse on Edit|Write. Runs Prettier on edited source files. Never blocks.
import { spawnSync } from 'node:child_process'
import { readInput } from './read-input.mjs'

const input = await readInput()
const file = input.tool_input?.file_path
if (
  file &&
  /\.(ts|tsx|css|json|mjs)$/.test(file) &&
  !/package-lock\.json$/.test(file)
) {
  spawnSync(
    'npx',
    ['--no-install', 'prettier', '--write', '--log-level', 'warn', file],
    {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    },
  )
}
process.exit(0)
