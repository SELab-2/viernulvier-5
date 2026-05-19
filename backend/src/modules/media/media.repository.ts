import type { PrismaClient } from '@prisma/client'
import { createWriteStream } from 'fs';
import fs from 'fs/promises'
import path from 'path';
import { pipeline } from 'stream/promises';

export class MediaRepository {
    constructor(private readonly prisma: PrismaClient) { }

    // Galleries
    async findAllGalleries(options: { page: number; limit: number; search?: string; lang?: string }) {
        const { page, limit, search } = options
        const skip = (page - 1) * limit
        const where = search ? { name: { contains: search } } : {}

        return this.prisma.gallery.findMany({
            where: where as any,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countGalleries(options: { search?: string; lang?: string }) {
        const { search } = options
        const where = search ? { name: { contains: search } } : {}
        return this.prisma.gallery.count({ where: where as any })
    }

    async findGalleryById(id: string) {
        return this.prisma.gallery.findUnique({
            where: { id },
        })
    }

    async createGallery(data: any) {
        return this.prisma.gallery.create({
            data
        })
    }

    async updateGallery(id: string, data: any) {
        return this.prisma.gallery.update({
            where: { id },
            data
        })
    }

    async deleteGallery(id: string) {
        return this.prisma.gallery.delete({
            where: { id }
        })
    }

    // Items
    async findAllItems(options: { page: number; limit: number; galleryId?: string; search?: string; lang?: string }) {
        const { page, limit, galleryId, search, lang = 'nl' } = options
        const skip = (page - 1) * limit
        
        const where: any = {}
        if (galleryId) where.gallery_id = galleryId
        if (search) {
            where.title = {
                path: [lang],
                string_contains: search,
            }
        }

        return this.prisma.item.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countItems(options: { galleryId?: string; search?: string; lang?: string }) {
        const { galleryId, search, lang = 'nl' } = options
        const where: any = {}
        if (galleryId) where.gallery_id = galleryId
        if (search) {
            where.title = {
                path: [lang],
                string_contains: search,
            }
        }
        return this.prisma.item.count({ where })
    }

    async findItemById(id: string) {
        return this.prisma.item.findUnique({
            where: { id },
        })
    }

    async createItem(data: any) {
        return this.prisma.item.create({
            data
        })
    }

    async updateItem(id: string, data: any) {
        return this.prisma.item.update({
            where: { id },
            data
        })
    }

    async deleteItem(id: string) {
        return this.prisma.item.delete({
            where: { id }
        })
    }

    // Crops
    async findAllCrops(options: { page: number; limit: number; itemId?: string; search?: string; lang?: string }) {
        const { page, limit, itemId, search } = options
        const skip = (page - 1) * limit
        const where: any = {}
        if (itemId) where.item_id = itemId
        if (search) where.name = { contains: search }

        return this.prisma.crop.findMany({
            where,
            skip,
            take: limit,
            orderBy: { created_at: 'desc' },
        })
    }

    async countCrops(options: { itemId?: string; search?: string; lang?: string }) {
        const { itemId, search } = options
        const where: any = {}
        if (itemId) where.item_id = itemId
        if (search) where.name = { contains: search }
        return this.prisma.crop.count({ where })
    }

    async findCropById(id: string) {
        return this.prisma.crop.findUnique({
            where: { id },
        })
    }

    async createCrop(data: any) {
        return this.prisma.crop.create({
            data
        })
    }

    async updateCrop(id: string, data: any) {
        return this.prisma.crop.update({
            where: { id },
            data
        })
    }

    async saveFile(filepath: string, stream: NodeJS.ReadableStream): Promise<void> {
        await fs.mkdir(path.dirname(filepath), { recursive: true })
        await pipeline(stream, createWriteStream(filepath))
    }

    async deleteCrop(id: string) {
        return this.prisma.crop.delete({
            where: { id }
        })
    }
}
