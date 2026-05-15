import { mkdir, writeFile, unlink, readdir } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import { env } from '../../config/env.js'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

type RawCreateBlogImageFile = {
    file_name: string
    file_base64: string
}

export type PersistedBlogImageFile = {
    file_path: string
    public_url: string
    mime_type: string
    original_filename: string
    file_size_bytes: number
}

function sanitizeFilename(fileName: string): string {
    return fileName
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 255)
}

function parseBase64Payload(fileBase64: string): Buffer {
    const match = fileBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (match) {
        return Buffer.from(match[2], 'base64')
    }
    return Buffer.from(fileBase64, 'base64')
}

export class BlogImagesStorage {
    private getUploadDir() {
        return path.resolve(process.cwd(), env.CROP_LOCATION)
    }

    private extractStoredName(imageReference: string): string | null {
        const trimmed = imageReference.trim()

        if (!trimmed) {
            return null
        }

        const baseName = path.basename(trimmed)
        const parsedName = path.parse(baseName).name

        return parsedName || null
    }

    resolveStoredFilePath(storedName: string): string {
        if (path.isAbsolute(storedName)) {
            return storedName
        }

        return path.join(this.getUploadDir(), storedName)
    }

    async persistBlogImageFiles(
        blogId: string,
        files: RawCreateBlogImageFile[]
    ): Promise<PersistedBlogImageFile[]> {
        const uploadDir = this.getUploadDir()
        await mkdir(uploadDir, { recursive: true })

        type ValidatedFile = {
            buffer: Buffer
            storedFileName: string
            public_url: string
            mime_type: string
            original_filename: string
            file_size_bytes: number
        }

        const validatedFiles: ValidatedFile[] = []

        for (let index = 0; index < files.length; index++) {
            const file = files[index]
            const originalName = file.file_name.trim() || `blog-image-${index}`
            const safeName = sanitizeFilename(originalName)
            const fileBuffer = parseBase64Payload(file.file_base64)

            if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
                throw new Error(`File size exceeds maximum allowed size of 15 MB`)
            }

            const detected = await fileTypeFromBuffer(fileBuffer)
            const detectedMimeType = detected?.mime ?? null

            if (!detectedMimeType || !ALLOWED_IMAGE_TYPES.has(detectedMimeType)) {
                throw new Error('Blog image must be a valid image (jpg, png, webp, gif)')
            }

            const ext = detected?.ext || 'jpg'
            const imageId = randomUUID()
            const storedFileName = `${imageId}.${ext}`

            validatedFiles.push({
                buffer: fileBuffer,
                storedFileName,
                public_url: `/api/v1/images/${imageId}`,
                mime_type: detectedMimeType,
                original_filename: safeName,
                file_size_bytes: fileBuffer.length,
            })
        }

        const persistedFiles: PersistedBlogImageFile[] = []

        for (const file of validatedFiles) {
            const fullPath = path.join(uploadDir, file.storedFileName)

            try {
                await writeFile(fullPath, file.buffer)
                persistedFiles.push({
                    file_path: fullPath,
                    public_url: file.public_url,
                    mime_type: file.mime_type,
                    original_filename: file.original_filename,
                    file_size_bytes: file.file_size_bytes,
                })
            } catch (writeError) {
                for (const persistedFile of persistedFiles) {
                    try {
                        await unlink(persistedFile.file_path)
                    } catch (unlinkError) {
                        console.error('Failed to clean up file:', unlinkError)
                    }
                }
                throw new Error(`Failed to save blog image file: ${writeError}`)
            }
        }

        return persistedFiles
    }

    async deleteStoredFiles(filePaths: string[]) {
        for (const filePath of filePaths) {
            try {
                await unlink(filePath)
            } catch (deleteError) {
                console.error('Failed to delete file:', deleteError)
            }
        }
    }

    async findStoredFilePaths(imageReference: string): Promise<string[]> {
        const storedName = this.extractStoredName(imageReference)
        if (!storedName) {
            return []
        }

        const uploadDir = this.getUploadDir()

        try {
            const entries = await readdir(uploadDir, { withFileTypes: true })
            return entries
                .filter((entry) => entry.isFile() && path.parse(entry.name).name === storedName)
                .map((entry) => path.join(uploadDir, entry.name))
        } catch {
            return []
        }
    }

    async deleteBlogImages(imageReferences: string[]) {
        const filePaths = (
            await Promise.all(imageReferences.map((imageReference) => this.findStoredFilePaths(imageReference)))
        ).flat()

        await this.deleteStoredFiles(filePaths)
    }
}
