import { ImagesRepository } from './images.repository.js'

export class ImagesService {
    constructor(private readonly repository: ImagesRepository) {}

    async getImagePath(uuid: string): Promise<string | null> {
        return this.repository.findImagePath(uuid)
    }
}
