import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from '../../../src/utils/password.js'

describe('password utils', () => {
    it('hashes passwords into a non-plaintext format', async () => {
        const password = 'super-secret-password'
        const hash = await hashPassword(password)

        expect(hash).not.toBe(password)
        expect(hash.startsWith('scrypt$')).toBe(true)
    })

    it('verifies the correct password and rejects the wrong one', async () => {
        const hash = await hashPassword('correct horse battery staple')

        await expect(verifyPassword('correct horse battery staple', hash)).resolves.toBe(true)
        await expect(verifyPassword('wrong password', hash)).resolves.toBe(false)
    })

    it('rejects malformed stored hashes', async () => {
        await expect(verifyPassword('anything', 'plain-text-password')).resolves.toBe(false)
    })
})
