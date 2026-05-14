import { createReadStream } from 'node:fs'
import { mkdir, stat, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileTypeFromBuffer } from 'file-type'
import { env } from '../../config/env.js'

const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024
const ALLOWED_UPLOAD_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])

type RawCreatePosterFile = {
    file_name: string
    file_base64: string
}

export type PersistedPosterFile = {
    file_path: string
    mime_type: string
    original_filename: string
    file_size_bytes: number
}

function sanitizeFilename(fileName: string): string {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function parseBase64Payload(fileBase64: string): Buffer {
    const normalized = fileBase64.includes(',') ? fileBase64.split(',').pop() ?? '' : fileBase64
    const buffer = Buffer.from(normalized, 'base64')

    if (buffer.length === 0) {
        throw new Error('Poster file payload is invalid')
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error('Poster file is too large')
    }

    return buffer
}

export class PostersStorage {
    private getUploadDir() {
        return path.resolve(process.cwd(), env.POSTER_LOCATION)
    }

    resolveStoredFilePath(storedName: string): string {
        if (path.isAbsolute(storedName)) {
            return storedName
        }

        return path.join(this.getUploadDir(), storedName)
    }

    async persistPosterFiles(files: RawCreatePosterFile[]): Promise<PersistedPosterFile[]> {
        const uploadDir = this.getUploadDir()
        await mkdir(uploadDir, { recursive: true })

        type ValidatedFile = {
            buffer: Buffer
            storedFileName: string
            mime_type: string
            original_filename: string
            file_size_bytes: number
        }

        const validatedFiles: ValidatedFile[] = []

        for (const file of files) {
            const originalName = file.file_name.trim() || 'poster-file'
            const safeName = sanitizeFilename(originalName)
            const fileBuffer = parseBase64Payload(file.file_base64)

            const detected = await fileTypeFromBuffer(fileBuffer)
            const detectedMimeType = detected?.mime ?? null

            if (!detectedMimeType || !ALLOWED_UPLOAD_TYPES.has(detectedMimeType)) {
                throw new Error('Poster file must be an image (jpg, png, webp, gif) or a PDF')
            }

            const storedFileName = `${crypto.randomUUID()}-${safeName}`

            validatedFiles.push({
                buffer: fileBuffer,
                storedFileName,
                mime_type: detectedMimeType,
                original_filename: originalName,
                file_size_bytes: fileBuffer.length,
            })
        }

        const persistedFiles: PersistedPosterFile[] = []

        try {
            for (const validatedFile of validatedFiles) {
                const absoluteFilePath = path.join(uploadDir, validatedFile.storedFileName)
                await writeFile(absoluteFilePath, validatedFile.buffer)

                persistedFiles.push({
                    file_path: validatedFile.storedFileName,
                    mime_type: validatedFile.mime_type,
                    original_filename: validatedFile.original_filename,
                    file_size_bytes: validatedFile.file_size_bytes,
                })
            }
        } catch (error) {
            await Promise.all(
                persistedFiles.map((file) => unlink(this.resolveStoredFilePath(file.file_path)).catch(() => undefined)),
            )

            throw error
        }

        return persistedFiles
    }

    async deleteStoredFiles(filePaths: string[]) {
        await Promise.all(
            filePaths.map((filePath) => unlink(this.resolveStoredFilePath(filePath)).catch(() => undefined)),
        )
    }

    async getReadablePosterFile(storedPath: string) {
        const absolutePath = this.resolveStoredFilePath(storedPath)
        await stat(absolutePath)
        return createReadStream(absolutePath)
    }
}