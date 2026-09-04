// Between `npm run test:rules` and `npm run test:e2e`, each of which owns
// its own `firebase emulators:exec` lifecycle, the Firestore emulator's
// underlying JVM has been observed to NOT actually exit on this machine
// even well after the CLI reports it stopped (confirmed by directly
// checking for the java process afterward -- it was still running,
// unkilled, 30+ seconds later). A passive wait/poll can't fix that: it
// isn't slow, it just doesn't happen on its own. So this polls briefly for
// the fast/common case, and if the port is still held after that, actively
// finds and kills whatever's bound to it before handing control to the
// next `emulators:exec`. Shells out to already-present OS utilities
// (netstat/taskkill on Windows, lsof/kill elsewhere) -- no new npm
// dependency, and this only ever runs as test tooling, never app code.
import net from 'net'
import { execSync } from 'child_process'

const PORT = Number(process.argv[2] || 8080)
const PASSIVE_POLL_DEADLINE_MS = 5000
const POLL_INTERVAL_MS = 300
const FINAL_DEADLINE_MS = 15000

function isPortFree(port) {
  return new Promise((resolve) => {
    const srv = net.createServer()
    srv.once('error', () => resolve(false))
    srv.once('listening', () => srv.close(() => resolve(true)))
    srv.listen(port, '127.0.0.1')
  })
}

async function pollUntilFree(port, deadlineMs) {
  const deadline = Date.now() + deadlineMs
  while (Date.now() < deadline) {
    if (await isPortFree(port)) return true
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
  }
  return false
}

function killWhateverIsOnPort(port) {
  try {
    if (process.platform === 'win32') {
      const out = execSync(`netstat -ano -p TCP`, { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split('\n')) {
        if (line.includes(`:${port} `) && /LISTENING/.test(line)) {
          const parts = line.trim().split(/\s+/)
          const pid = parts[parts.length - 1]
          if (pid && /^\d+$/.test(pid)) pids.add(pid)
        }
      }
      for (const pid of pids) {
        try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' }) } catch {}
      }
    } else {
      try {
        const pids = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' }).trim()
        if (pids) execSync(`kill -9 ${pids.split('\n').join(' ')}`, { stdio: 'ignore' })
      } catch {}
    }
  } catch {
    // best-effort only -- fall through to the final poll either way
  }
}

async function main() {
  if (await pollUntilFree(PORT, PASSIVE_POLL_DEADLINE_MS)) {
    console.log(`Port ${PORT} is free.`)
    process.exit(0)
  }

  console.log(`Port ${PORT} still held after ${PASSIVE_POLL_DEADLINE_MS}ms -- actively clearing it.`)
  killWhateverIsOnPort(PORT)

  if (await pollUntilFree(PORT, FINAL_DEADLINE_MS)) {
    console.log(`Port ${PORT} is free.`)
    process.exit(0)
  }

  console.error(`Port ${PORT} still not free after actively clearing it. Stopping rather than starting test:e2e against a possibly-stale emulator.`)
  process.exit(1)
}

main()
