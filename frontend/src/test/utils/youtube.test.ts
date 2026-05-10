import { describe, expect, it } from 'vitest'
import { getYouTubeEmbedUrl } from '../../utils/youtube'

describe('getYouTubeEmbedUrl', () => {
    it('converts a standard youtube.com watch url', () => {
        expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('converts a youtu.be short url', () => {
        expect(getYouTubeEmbedUrl('https://youtu.be/abc123'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('handles a watch url with extra query params', () => {
        expect(getYouTubeEmbedUrl('https://www.youtube.com/watch?v=abc123&t=30s'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('handles a youtu.be url with query params', () => {
        expect(getYouTubeEmbedUrl('https://youtu.be/abc123?t=30'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('returns null for a vimeo url', () => {
        expect(getYouTubeEmbedUrl('https://vimeo.com/123456')).toBeNull()
    })

    it('returns null for an empty string', () => {
        expect(getYouTubeEmbedUrl('')).toBeNull()
    })

    it('returns null for a random string', () => {
        expect(getYouTubeEmbedUrl('not a url')).toBeNull()
    })
})