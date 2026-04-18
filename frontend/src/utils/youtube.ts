export function getYouTubeEmbedUrl(url: string): string | null {
    const match =
        url.match(/youtube\.com\/watch\?v=([^&]+)/) ||
        url.match(/youtu\.be\/([^?]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : null
}