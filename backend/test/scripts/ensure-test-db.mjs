import { spawn } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const backendRoot = resolve(__dirname, '..', '..')
const composeFile = resolve(backendRoot, 'test', 'docker-compose.yml')
const envFile = resolve(backendRoot, '.env.test')

dotenv.config({
  path: envFile,
  override: true,
})

process.env.NODE_ENV = 'test'

if (process.env.SKIP_TEST_DB_START === '1') {
  process.exit(0)
}

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('Missing DATABASE_URL in backend/.env.test')
  process.exit(1)
}

function run(command, args) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd: backendRoot,
      stdio: 'inherit',
      env: process.env,
    })

    child.on('error', rejectPromise)
    child.on('exit', (code) => {
      if (code === 0) {
        resolvePromise()
        return
      }

      rejectPromise(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

async function waitForDatabase(timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs
  let lastError = null

  while (Date.now() < deadline) {
    const client = new pg.Client({ connectionString: databaseUrl })

    try {
      await client.connect()
      await client.query('SELECT 1')
      await client.end()
      return
    } catch (error) {
      lastError = error
      try {
        await client.end()
      } catch {
        // ignore cleanup failures while polling for readiness
      }

      await new Promise((resolvePromise) => setTimeout(resolvePromise, 1000))
    }
  }

  throw new Error(`Test database did not become ready in time: ${lastError instanceof Error ? lastError.message : String(lastError)}`)
}

try {
  await run('docker', ['compose', '-f', composeFile, 'up', '-d'])
  await waitForDatabase()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}

