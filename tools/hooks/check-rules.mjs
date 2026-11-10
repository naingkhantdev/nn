// PostToolUse on Edit|Write. Runs Firestore rules tests when rules change.
import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { readInput } from './read-input.mjs'

const input = await readInput()
const file = (input.tool_input?.file_path ?? '').replace(/\\/g, '/')
if (
  !/(firestore\.rules|test-rules\/)/.test(file) ||
  !existsSync('test-rules/package.json')
)
  process.exit(0)

const r = spawnSync('npm', ['--prefix', 'test-rules', 'test'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
})
if (r.status !== 0) {
  process.stderr.write(
    `Firestore rules tests failed:\n${(r.stdout + r.stderr).slice(-4000)}\n`,
  )
  process.exit(2)
}
process.exit(0)
