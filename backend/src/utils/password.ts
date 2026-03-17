import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)
const KEY_LENGTH = 64
const HASH_PREFIX = 'scrypt'

export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer

    return `${HASH_PREFIX}$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const [algorithm, salt, expectedHash] = storedHash.split('$')

    if (algorithm !== HASH_PREFIX || !salt || !expectedHash) {
        return false
    }

    const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer
    const expectedKey = Buffer.from(expectedHash, 'hex')

    if (derivedKey.length !== expectedKey.length) {
        return false
    }

    return timingSafeEqual(derivedKey, expectedKey)
}
