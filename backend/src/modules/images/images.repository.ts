import fs from 'fs/promises'
import path from 'path'
import { env } from '../../config/env.js'

export class ImagesRepository {
    private readonly extensions = ['webp', 'jpg', 'jpeg', 'png']

    /**
     * Finds the absolute path of an image by its UUID.
     * Checks multiple extensions on disk.
     */
    async findImagePath(uuid: string): Promise<string | null> {
        const directory = env.CROP_LOCATION

        for (const ext of this.extensions) {
            const fileName = `${uuid}.${ext}`
            const filePath = path.join(directory, fileName)
            
            try {
                await fs.access(filePath)
                return path.resolve(filePath)
            } catch {
                continue
            }
        }

        return null
    }
}
