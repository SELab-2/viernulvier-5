import fs from 'fs/promises'
import path from 'path'
import { env } from '../../config/env.js'

export class ImagesRepository {
    private readonly extensions = ['webp', 'jpg', 'jpeg', 'png']

    /**
     * Finds the absolute path of an image by its UUID.
     * Checks multiple extensions on disk.
     */
    async findImagePath(identifier: string): Promise<string | null> {
        const directory = env.CROP_LOCATION
        const trimmed = identifier.trim()

        if (!trimmed) {
            return null
        }

        const candidates = new Set<string>()
        const baseName = path.basename(trimmed)
        candidates.add(baseName)
        candidates.add(path.parse(baseName).name)

        for (const candidate of candidates) {
            const directPath = path.join(directory, candidate)

            try {
                await fs.access(directPath)
                return path.resolve(directPath)
            } catch {
                // ignore and try extensions below
            }

            if (!path.extname(candidate)) {
                for (const ext of this.extensions) {
                    const filePath = path.join(directory, `${candidate}.${ext}`)

                    try {
                        await fs.access(filePath)
                        return path.resolve(filePath)
                    } catch {
                        continue
                    }
                }
            }
        }

        return null
    }
}
