import { useEffect, useState } from 'react'
import { apiFetch } from '../../../api/client'

type ProductionItemBase = {
    id: string
    image_url?: string | null
    links?: {
        media_gallery?: string | null
        poster_gallery?: string | null
    }
}

const getRelativePath = (url: string | null | undefined): string | null => {
    if (!url) return null
    const parts = url.split('/api/v1')
    return parts.length > 1 ? parts[1] : url
}

export function useProductionImages(items: ProductionItemBase[]) {
    const [images, setImages] = useState<Record<string, string>>({})

    useEffect(() => {
        const abortController = new AbortController()

        const fetchImages = async () => {
            const uniqueById = new Map(items.map((item) => [item.id, item]))
            const itemsToFetch = [...uniqueById.values()].filter(
                (item) => !item.image_url && !images[item.id] && (item.links?.media_gallery || item.links?.poster_gallery),
            )
            if (itemsToFetch.length === 0) return

            const results = await Promise.allSettled(
                itemsToFetch.map(async (item) => {
                    const galleryUrl = item.links?.media_gallery ?? item.links?.poster_gallery
                    const galleryPath = getRelativePath(galleryUrl)
                    if (!galleryPath) return null

                    try {
                        const galleryRes = await apiFetch<{ data: { links: { items: string } } }>(galleryPath, {
                            signal: abortController.signal,
                        })
                        const itemsPath = getRelativePath(galleryRes.data?.links?.items)
                        if (!itemsPath) return null

                        const itemsRes = await apiFetch<{ data: Array<{ links?: { crops: string } }> }>(itemsPath, {
                            signal: abortController.signal,
                        })
                        for (const galleryItem of (itemsRes.data || [])) {
                            if (!galleryItem.links?.crops) continue
                            const cropsPath = getRelativePath(galleryItem.links.crops)
                            if (!cropsPath) continue
                            const cropsRes = await apiFetch<{ data: Array<{ name: string; url: string }> }>(cropsPath, {
                                signal: abortController.signal,
                            })
                            const target =
                                cropsRes.data.find((c) => c.name === 'FE3_header') ||
                                cropsRes.data.find((c) => c.name === 'FEA_boxed') ||
                                cropsRes.data[0]
                            if (target?.url) return { id: item.id, url: target.url }
                        }
                    } catch {
                        return null
                    }

                    return null
                }),
            )

            const newImages: Record<string, string> = {}
            results.forEach((res) => {
                if (res.status === 'fulfilled' && res.value) newImages[res.value.id] = res.value.url
            })
            if (Object.keys(newImages).length > 0) {
                setImages((prev) => {
                    let changed = false
                    const merged = { ...prev }

                    Object.entries(newImages).forEach(([id, url]) => {
                        if (!merged[id]) {
                            merged[id] = url
                            changed = true
                        }
                    })

                    return changed ? merged : prev
                })
            }
        }

        void fetchImages()

        return () => abortController.abort()
    }, [images, items])

    return images
}
