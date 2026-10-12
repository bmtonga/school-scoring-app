import { spawnSync } from 'node:child_process'

const isWindows = process.platform === 'win32'
const result = spawnSync(
  isWindows ? 'cmd.exe' : 'npx',
  isWindows ? ['/d', '/s', '/c', 'npx supabase test db'] : ['supabase', 'test', 'db'],
  { stdio: 'inherit' },
)

if (result.error) {
  console.error(`Unable to run local Supabase database tests: ${result.error.message}`)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
