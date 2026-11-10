import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const dir = path.dirname(fileURLToPath(import.meta.url))
const run = (script, input) =>
  spawnSync(process.execPath, [path.join(dir, script)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
  })

test('blocks a write to a service account file', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: { file_path: 'x-service-account.json', content: '{}' },
    }).status,
    2,
  )
})
test('blocks content containing a private key', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: { file_path: 'a.ts', content: '-----BEGIN PRIVATE KEY-----' },
    }).status,
    2,
  )
})
test('blocks an edit adding a private key', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: {
        file_path: 'a.ts',
        old_string: 'x',
        new_string: '"private_key": "-----BEGIN RSA PRIVATE KEY-----',
      },
    }).status,
    2,
  )
})
test('blocks git add of a secret file', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: { command: 'git add foo-service-account.json' },
    }).status,
    2,
  )
})
test('blocks writing .dev.vars', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: { file_path: 'worker/.dev.vars', content: 'A=1' },
    }).status,
    2,
  )
})
test('allows a normal TypeScript write', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: { file_path: 'src/a.ts', content: 'x' },
    }).status,
    0,
  )
})
test('allows the public Firebase web config', () => {
  assert.equal(
    run('block-secrets.mjs', {
      tool_input: {
        file_path: 'src/core/firebaseConfig.ts',
        content: "apiKey: 'AIzaSyB18'",
      },
    }).status,
    0,
  )
})
test('allows an ordinary git command', () => {
  assert.equal(
    run('block-secrets.mjs', { tool_input: { command: 'git status' } }).status,
    0,
  )
})
test('check allows stopping when stop_hook_active is true', () => {
  assert.equal(run('check.mjs', { stop_hook_active: true }).status, 0)
})
test('check-rules passes when the edited file is unrelated', () => {
  assert.equal(
    run('check-rules.mjs', { tool_input: { file_path: 'src/a.ts' } }).status,
    0,
  )
})
test('format ignores non-source files', () => {
  assert.equal(
    run('format.mjs', { tool_input: { file_path: 'notes.md' } }).status,
    0,
  )
})
