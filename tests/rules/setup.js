import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rules = readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8')
const storageRules = readFileSync(path.resolve(__dirname, '../../storage.rules'), 'utf8')

// firebase.json runs the emulator in singleProjectMode, so every rules test
// file shares one real Firestore/Auth namespace regardless of the
// projectId string passed here -- fileParallelism is disabled in
// vitest.config.js so files never seed/read concurrently, and each file
// additionally uses its own unique fixture-id prefix as defense in depth.
export function makeTestEnv(projectId) {
  return initializeTestEnvironment({
    projectId,
    firestore: { rules, host: '127.0.0.1', port: 8080 },
  })
}

// Same rationale as makeTestEnv, for Storage Security Rules instead of
// Firestore's. A separate function (rather than one config object with
// both) since no test file needs both at once.
export function makeStorageTestEnv(projectId) {
  return initializeTestEnvironment({
    projectId,
    storage: { rules: storageRules, host: '127.0.0.1', port: 9199 },
  })
}
