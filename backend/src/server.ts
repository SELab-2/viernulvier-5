import { env } from './config/env.js'
import { buildApp } from './app.js'

/**
 * Server entry point.
 * This file is NOT used by tests — they import buildApp() directly.
 */
async function start() {
    const app = await buildApp()

    try {
        await app.listen({ port: env.PORT, host: env.HOST })
        app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`)
        app.log.info(`Swagger docs available at http://${env.HOST}:${env.PORT}/docs`)
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
