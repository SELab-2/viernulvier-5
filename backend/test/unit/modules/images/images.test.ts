import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { buildTestApp } from '../../../helpers/build-app'
import fs from 'fs/promises'
import path from 'path'
import { env } from '../../../../../src/config/env.js'

describe('Images Module', () => {
    let app: any
    const testUuid = '550e8400-e29b-41d4-a716-446655440000'
    const testDir = path.resolve('./test-crops')

    beforeAll(async () => {
        // Mock CROP_LOCATION
        vi.stubEnv('CROP_LOCATION', testDir)
        
        await fs.mkdir(testDir, { recursive: true })
        await fs.writeFile(path.join(testDir, `${testUuid}.webp`), 'fake-image-data')
        
        app = await buildTestApp()
    })

    afterAll(async () => {
        await fs.rm(testDir, { recursive: true, force: true })
        await app.close()
        vi.unstubAllEnvs()
    })

    it('should return 404 for non-existent image', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/images/00000000-0000-0000-0000-000000000000'
        })

        expect(response.statusCode).toBe(404)
        expect(JSON.parse(response.payload)).toEqual({ message: 'Image not found' })
    })

    it('should return 200 and image data for existing image', async () => {
        const response = await app.inject({
            method: 'GET',
            url: `/api/v1/images/${testUuid}`
        })

        expect(response.statusCode).toBe(200)
        expect(response.headers['content-type']).toBe('image/webp')
        expect(response.headers['cross-origin-resource-policy']).toBe('cross-origin')
        expect(response.payload).toBe('fake-image-data')
    })

    it('should return 400 for invalid UUID', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/api/v1/images/invalid-uuid'
        })

        expect(response.statusCode).toBe(400)
    })
})
