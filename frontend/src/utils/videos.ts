export function getVideoEmbedUrl(url: string): string | null {
    // YouTube: youtube.com/watch?v=ID or youtu.be/ID
    const youtubeMatch =
        url.match(/(?:www\.)?youtube\.com\/watch\?v=([^&]+)/) ||
        url.match(/(?:www\.)?youtu\.be\/([^?]+)/)
    if (youtubeMatch) {
        return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
 
    // Vimeo: vimeo.com/ID or player.vimeo.com/video/ID (already an embed)
    const vimeoMatch = url.match(/(?:www\.)?vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
        return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
 
    const vimeoPlayerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/)
    if (vimeoPlayerMatch) {
        return `https://player.vimeo.com/video/${vimeoPlayerMatch[1]}`
    }
 
    return null
}