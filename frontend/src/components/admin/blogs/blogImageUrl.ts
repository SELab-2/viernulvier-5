export function resolveBlogImageUrl(imagePath: string): string {
    const trimmed = imagePath.trim()

    if (
        trimmed.startsWith('data:') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('/api/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://')
    ) {
        return trimmed
    }

    const fileName = trimmed.split('/').pop() ?? trimmed
    const fileNameWithoutExtension = fileName.replace(/\.[^.]+$/, '')

    return `/api/v1/images/${encodeURIComponent(fileNameWithoutExtension)}`
}