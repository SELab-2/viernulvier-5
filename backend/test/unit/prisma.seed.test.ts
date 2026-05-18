import { beforeEach, describe, expect, it, vi } from 'vitest'

const adminUserUpsert = vi.fn(async () => undefined)
const poolEnd = vi.fn(async () => undefined)
const disconnect = vi.fn(async () => undefined)
const hashPassword = vi.fn(async (password: string) => `hashed:${password}`)

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    end: poolEnd,
  })),
}))

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: vi.fn().mockImplementation(() => ({})),
}))

vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({
    adminUser: {
      upsert: adminUserUpsert,
    },
    $disconnect: disconnect,
  })),
}))

vi.mock('../../src/utils/password.js', () => ({
  hashPassword,
}))

describe('prisma seed credentials', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()

    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/viernulvier_test'
    process.env.CMS_ADMIN_USERNAME = 'admin'
    process.env.CMS_ADMIN_PASSWORD = 'admin123'
    process.env.CMS_EDITOR_USERNAME = 'editor'
    process.env.CMS_EDITOR_PASSWORD = 'editor123'
  })

  it('exports a helper that reads seed credentials from the environment', async () => {
    const seed = await import('../../prisma/seed')

    expect(seed.getSeedUsers).toBeTypeOf('function')
    expect(seed.getSeedUsers(process.env)).toEqual([
      {
        username: 'admin',
        password: 'admin123',
        role: 'ADMIN',
      },
      {
        username: 'editor',
        password: 'editor123',
        role: 'EDITOR',
      },
    ])
  })

  it('throws when a required seed credential is missing', async () => {
    const seed = await import('../../prisma/seed')
    const env = {
      ...process.env,
      CMS_EDITOR_PASSWORD: undefined,
    }

    expect(() => seed.getSeedUsers(env)).toThrow(
      'Missing required seed credential env var: CMS_EDITOR_PASSWORD',
    )
  })

  it('throws when a required seed credential is blank', async () => {
    const seed = await import('../../prisma/seed')
    const env = {
      ...process.env,
      CMS_ADMIN_USERNAME: '   ',
    }

    expect(() => seed.getSeedUsers(env)).toThrow(
      'Missing required seed credential env var: CMS_ADMIN_USERNAME',
    )
  })

  it('hashes and upserts configured seed users, then closes database resources', async () => {
    const seed = await import('../../prisma/seed')

    await seed.main()

    expect(hashPassword).toHaveBeenNthCalledWith(1, 'admin123')
    expect(hashPassword).toHaveBeenNthCalledWith(2, 'editor123')
    expect(adminUserUpsert).toHaveBeenCalledTimes(2)
    expect(adminUserUpsert).toHaveBeenNthCalledWith(1, {
      where: { username: 'admin' },
      update: {
        passwordHash: 'hashed:admin123',
        role: 'ADMIN',
      },
      create: {
        username: 'admin',
        passwordHash: 'hashed:admin123',
        role: 'ADMIN',
      },
    })
    expect(adminUserUpsert).toHaveBeenNthCalledWith(2, {
      where: { username: 'editor' },
      update: {
        passwordHash: 'hashed:editor123',
        role: 'EDITOR',
      },
      create: {
        username: 'editor',
        passwordHash: 'hashed:editor123',
        role: 'EDITOR',
      },
    })
    expect(disconnect).toHaveBeenCalledTimes(1)
    expect(poolEnd).toHaveBeenCalledTimes(1)
  })
})
