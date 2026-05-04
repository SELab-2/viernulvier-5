import { describe, expect, it } from 'vitest'
import { localize } from '../../utils/localize'

describe('localize', () => {
    it('returns null for null input', () => {
        expect(localize(null, 'nl')).toBeNull()
    })

    it('returns null for undefined input', () => {
        expect(localize(undefined, 'nl')).toBeNull()
    })

    it('returns the value for the requested locale', () => {
        expect(localize({ nl: 'Hallo', en: 'Hello', fr: 'Bonjour' }, 'nl')).toBe('Hallo')
        expect(localize({ nl: 'Hallo', en: 'Hello', fr: 'Bonjour' }, 'en')).toBe('Hello')
        expect(localize({ nl: 'Hallo', en: 'Hello', fr: 'Bonjour' }, 'fr')).toBe('Bonjour')
    })

    it('falls back to en when the requested locale is missing', () => {
        expect(localize({ en: 'Hello' }, 'nl')).toBe('Hello')
    })

    it('falls back to nl when en is also missing', () => {
        expect(localize({ nl: 'Hallo' }, 'fr')).toBe('Hallo')
    })

    it('falls back to fr when en and nl are both missing', () => {
        expect(localize({ fr: 'Bonjour' }, 'nl')).toBe('Bonjour')
    })

    it('returns null when the field is an empty object', () => {
        expect(localize({}, 'nl')).toBeNull()
    })

    it('skips empty string values and falls back', () => {
        expect(localize({ nl: '', en: 'Hello' }, 'nl')).toBe('Hello')
    })

    it('handles an unknown locale gracefully by falling back', () => {
        expect(localize({ nl: 'Hallo', en: 'Hello' }, 'de')).toBe('Hello')
    })
})