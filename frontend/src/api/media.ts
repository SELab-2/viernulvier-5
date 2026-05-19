import { api } from './client'
import { z } from 'zod'

// Schemas
export const mediaItemSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    type: z.string(),
    original_filename: z.string(),
    position: z.number().int(),
    width: z.number().int().nullable(),
    height: z.number().int().nullable(),
    format: z.string().nullable(),
    gallery_id: z.string().uuid(),
    title: z.string().nullable(),
    description: z.string().nullable(),
    credits: z.string().nullable(),
    link: z.string().nullable(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export const cropSchema = z.object({
    id: z.string().uuid(),
    apiId: z.string().nullable(),
    name: z.string(),
    url: z.string(),
    item_id: z.string().uuid(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
})

export type MediaItem = z.infer<typeof mediaItemSchema>
export type Crop = z.infer<typeof cropSchema>

export type ImageSlot = 
    | { kind: 'existing'; crop_id: string; item_id: string;}
    | { kind: 'pending'; file: File }

// API calls
type GalleryItemsResponse = {
    data: MediaItem[]
}

type GalleryResponse = {
    data: { id: string }
}

type CropsResponse = {
    data: Crop[]
}

type CropResponse = {
    data: Crop
}

type ItemResponse = {
    data: MediaItem
}

export const getGalleryItems = (galleryId: string) => {
    return api.get<GalleryItemsResponse>(`/archive/media/items?galleryId=${galleryId}`)
}

export const getItemCrops = (itemId: string) => {
    return api.get<CropsResponse>(`/archive/media/items/crops?itemId=${itemId}`)
}

const HERO_CROP_FALLBACK_ORDER = ['FE3_header', 'FE3_boxed']
const MEDIA_CROP_FALLBACK_ORDER = ['FE3_boxed', 'FE3_header']

export const getPreferredHeroCropUrl = (crops: Crop[]): string | null => {
    for (const name of HERO_CROP_FALLBACK_ORDER) {
        const crop = crops.find((c) => c.name === name)
        if (crop) return crop.url
    }
    return null
}

export const getPreferredMediaCropUrl = (crops: Crop[]): string | null => {
    for (const name of MEDIA_CROP_FALLBACK_ORDER) {
        const crop = crops.find((c) => c.name === name)
        if (crop) return crop.url
    }
    return null
}

export const resolveCropUrl = (url?: string | null): string | null => {
    if (!url) return null
    if (/^https?:\/\//i.test(url)) return url
    const base = window.location.origin
    return `${base}/${url.replace(/^\//, '')}`
}

// load galary slots

export async function loadGallerySlots(galleryId: string): Promise<{
    banner: ImageSlot | null
    extras: ImageSlot[]
}> {
    const galleryRes = await getGalleryItems(galleryId)
    const items = galleryRes.data
 
    if (items.length === 0) return { banner: null, extras: [] }
 
    // First item → banner
    const firstCrops = await getItemCrops(items[0].id)
    const bannerCrop = firstCrops.data.find(c => c.name === 'FE3_header')
        ?? firstCrops.data.find(c => c.name === 'FE3_boxed')
        ?? null
 
    const banner: ImageSlot | null = bannerCrop
        ? { kind: 'existing', crop_id: bannerCrop.id, item_id: items[0].id }
        : null
 
    // Remaining items → extras
    const remainingItems = items.slice(1)
    const extrasCrops = await Promise.all(remainingItems.map(item => getItemCrops(item.id)))
 
    const extras: ImageSlot[] = extrasCrops
        .map<ImageSlot | null>((res, i) => {
            const crop = res.data.find(c => c.name === 'FE3_boxed')
                ?? res.data.find(c => c.name === 'FE3_header')
                ?? null
            if (!crop) return null
            return {
                kind: 'existing' as const,
                crop_id: crop.id,
                item_id: remainingItems[i].id,
            }
        })
        .filter((s): s is ImageSlot => s !== null)
 
    return { banner, extras }
}
 
// ─── Upload helper ────────────────────────────────────────────────────────────
//
// Uploads a single File:
//   1. Creates a media item inside the gallery.
//   2. POSTs the binary to /archive/media/upload (multipart).
//   3. Creates a crop record that points to the saved file.
//
// Returns the created crop so the caller can turn it into an ImageSlot.
 
async function uploadFile(
    file: File,
    gallery_id: string,
    cropName: 'FE3_header' | 'FE3_boxed',
    position: number,
): Promise<{ item: MediaItem; crop: Crop }> {
    // 1. Create the item record
    const itemRes = await api.post<ItemResponse>('/archive/media/items', {
        gallery_id: gallery_id,
        original_filename: file.name,
        type: file.type,
        position,
    })
    const item = itemRes.data;
    
    // 2. Create the crop record first so we have its id
    // const ext = file.name.split('.').pop() ?? 'bin'
    const cropRes = await api.post<CropResponse>('/archive/media/items/crops', {
        item_id: item.id,
        name: cropName,
    });

    const crop = cropRes.data;

    // 3. Upload the binary — server saves it as {cropId}.{ext}
    const form = new FormData();
    form.append('file', file);
    // form.append('file', new File([file], `${crop.id}.${ext}`, { type: file.type }));
    // form.append('crop_id', crop.id);
    
    try {
        await api.post(`/archive/media/items/crops/${crop.id}/upload`, form);
    } catch (err) {
        await api.delete(`/archive/media/items/crops/${crop.id}`);
        await api.delete(`/archive/media/items/${item.id}`);
        
        throw err
    }

    return { item, crop }
}
 
// ─── Save gallery slots ───────────────────────────────────────────────────────
//
// Reconciles the current banner/extras slots against what is already on the
// server.  Only pending slots are uploaded; existing slots are left alone.
// Slots that were removed are deleted.
//
// Returns { galleryId } so the caller can attach it to the production.
 
export async function saveGallerySlots(opts: {
    /** Pass the existing gallery id when editing, undefined when creating. */
    galleryId: string | undefined
    banner: ImageSlot | null
    extras: ImageSlot[]
    /** Crop ids that were present when the page loaded but are now absent. */
    removedCropIds: string[]
    removedItemIds: string[]
}): Promise<string> {
    const { banner, extras, removedCropIds, removedItemIds } = opts
 
    // 1. Ensure a gallery exists
    let galleryId = opts.galleryId
    if (!galleryId) {
        const res = await api.post<GalleryResponse>('/archive/media/galleries', {})
        galleryId = res.data.id
    }

    // incase we need to rollback
    const createdItems: string[] = []
    const createdCrops: string[] = []

    // Keep the list of created pending items in upload order so we can map them
    // back to the pending slots when we set positions later.
    const createdPendingItems: { itemId: string; cropId: string }[] = []

    try {
        // 2. Delete removed crops & items (best-effort)
        await Promise.allSettled(removedCropIds.map(id => api.delete(`/archive/media/items/crops/${id}`)))
        await Promise.allSettled(removedItemIds.map(id => api.delete(`/archive/media/items/${id}`)))

        // 3. Upload pending banner
        if (banner?.kind === 'pending') {
            
            const { item, crop } =  await uploadFile(banner.file, galleryId, 'FE3_header', 0)
            createdItems.push(item.id)
            createdCrops.push(crop.id)
            createdPendingItems.push({ itemId: item.id, cropId: crop.id })
        }

        // 4. Upload pending extras
        let position = extras.filter(s => s.kind ==='existing').length + 1
        for (const slot of extras) {
            if (slot.kind === 'pending') {
                const { item, crop } = await uploadFile(slot.file, galleryId, 'FE3_boxed', position)
                createdItems.push(item.id)
                createdCrops.push(crop.id)
                createdPendingItems.push({ itemId: item.id, cropId: crop.id })
            }
            position++
        }

        // 5. Ensure positions on the server match the desired order.
        // Desired order: banner (if present) then extras in the order provided.
        // For existing slots we use their item_id, for pending slots we consume createdPendingItems
        const desiredItemOrder: string[] = []
        const pendingIterator = createdPendingItems[Symbol.iterator]()
        if (banner) {
            if (banner.kind === 'existing') desiredItemOrder.push(banner.item_id)
            else {
                const next = pendingIterator.next()
                if (!next.done) desiredItemOrder.push(next.value.itemId)
            }
        }
        for (const slot of extras) {
            if (slot.kind === 'existing') desiredItemOrder.push(slot.item_id)
            else {
                const next = pendingIterator.next()
                if (!next.done) desiredItemOrder.push(next.value.itemId)
            }
        }

        // Patch positions to match desired order (0..n-1)
        await Promise.all(desiredItemOrder.map((itemId, idx) =>
            api.patch(`/archive/media/items/${itemId}`, { position: idx })
        ))

    } catch (err) { 
        await Promise.allSettled(createdCrops.map(id => api.delete(`/archive/media/items/crops/${id}`)));
        await Promise.allSettled(createdItems.map(id => api.delete(`/archive/media/items/${id}`)));
        
        throw err
    }
 
    return galleryId
}

// ─── Delete gallery ───────────────────────────────────────────────────────────
//
// Deletes a gallery and all its items/crops. Used for rollback when production
// creation or deletion fails after the gallery was already created.
// Errors are swallowed — this is always called in a cleanup path.
 
export async function deleteGallery(galleryId: string): Promise<void> {
    try {
        const galleryRes = await getGalleryItems(galleryId)
        const items = galleryRes.data
 
        await Promise.allSettled(
            items.map(async item => {
                const cropsRes = await getItemCrops(item.id)
                await Promise.allSettled(
                    cropsRes.data.map(c => api.delete(`/archive/media/items/crops/${c.id}`))
                )
                await api.delete(`/archive/media/items/${item.id}`)
            })
        )
 
        await api.delete(`/archive/media/galleries/${galleryId}`)
    } catch {
        // best-effort cleanup; caller should not throw
    }
}
