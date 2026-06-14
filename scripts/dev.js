import { spawn } from 'node:child_process'

const isWindows = process.platform === 'win32'
const npmCommand = isWindows ? 'npm.cmd' : 'npm'

const processes = [
  startProcess('node', ['--watch', 'backend/server.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'development',
      BACKEND_PORT: '3001',
    },
  }),
  startProcess(npmCommand, ['run', 'dev:frontend']),
]

for (const child of processes) {
  child.on('exit', (code) => {
    if (code && code !== 0) {
      shutdown(code)
    }
  })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))

function startProcess(command, args, options = {}) {
  return spawn(command, args, {
    ...options,
    stdio: 'inherit',
    shell: isWindows,
  })
}

function shutdown(code) {
  for (const child of processes) {
    if (!child.killed) {
      child.kill()
    }
  }

  process.exit(code)
}
