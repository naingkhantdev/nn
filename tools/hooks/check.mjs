// Stop hook. If src/ changed, run typecheck and unit tests; exit 2 reports failures.
import { spawnSync } from 'node:child_process'
import { readInput } from './read-input.mjs'

const input = await readInput()
if (input.stop_hook_active) process.exit(0)

const sh = { encoding: 'utf8', shell: process.platform === 'win32' }
const status = spawnSync('git', ['status', '--porcelain'], sh).stdout ?? ''
if (!/\s(src\/|vite\.config|tsconfig)/m.test(status)) process.exit(0)

for (const script of ['typecheck', 'test']) {
  const r = spawnSync('npm', ['run', script], sh)
  if (r.status !== 0) {
    process.stderr.write(
      `npm run ${script} failed:\n${(r.stdout + r.stderr).slice(-4000)}\n`,
    )
    process.exit(2)
  }
}
process.exit(0)
