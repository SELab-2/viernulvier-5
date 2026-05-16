import { describe, expect, it } from 'vitest'
import { getVideoEmbedUrl } from '../../utils/videos'

describe('getVideoEmbedUrl', () => {
    it('converts a standard youtube.com watch url', () => {
        expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=abc123'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('converts a youtu.be short url', () => {
        expect(getVideoEmbedUrl('https://youtu.be/abc123'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('handles a watch url with extra query params', () => {
        expect(getVideoEmbedUrl('https://www.youtube.com/watch?v=abc123&t=30s'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('handles a youtu.be url with query params', () => {
        expect(getVideoEmbedUrl('https://youtu.be/abc123?t=30'))
            .toBe('https://www.youtube.com/embed/abc123')
    })

    it('converts a standard vimeo.com watch url', () => {
        expect(getVideoEmbedUrl('https://www.vimeo.com/123456'))
            .toBe('https://player.vimeo.com/video/123456')
    })

    it('handles a vimeo player url', () => {
        expect(getVideoEmbedUrl('https://player.vimeo.com/video/123456'))
            .toBe('https://player.vimeo.com/video/123456')
    })

    it('returns null for an empty string', () => {
        expect(getVideoEmbedUrl('')).toBeNull()
    })

    it('returns null for a random string', () => {
        expect(getVideoEmbedUrl('not a url')).toBeNull()
    })

})