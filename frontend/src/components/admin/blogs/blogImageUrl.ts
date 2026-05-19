export function resolveBlogImageUrl(imagePath: string): string {
    const trimmed = imagePath.trim()

    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/api/')) {
        return trimmed
    }

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const parsed = new URL(trimmed)
            if (parsed.pathname.startsWith('/api/')) {
                return `${parsed.pathname}${parsed.search}${parsed.hash}`
            }
        } catch {
            return trimmed
        }

        return trimmed
    }

    const fileName = trimmed.split('/').pop() ?? trimmed
    const fileNameWithoutExtension = fileName.replace(/\.[^.]+$/, '')

    return `/api/v1/images/${encodeURIComponent(fileNameWithoutExtension)}`
}