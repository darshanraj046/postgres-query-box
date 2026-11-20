import { execFileSync } from 'child_process'
import { resolve } from 'path'
import { test, expect } from 'vitest'

test('query rules: every example, error and suggestion state', () => {
  const out = execFileSync(process.execPath, [resolve('test/qcheck.mjs')], { encoding: 'utf8' })
  expect(out).toMatch(/all passed/)
})
