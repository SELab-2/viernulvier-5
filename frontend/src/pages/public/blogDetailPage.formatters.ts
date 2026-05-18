import type { Locale } from '../../i18n/types'
import type { ProductionCardItem } from '../../components/blogs/ProductionCard'
import { toPlainText } from '../../utils/text'

export type BlogDetails = {
    id: string
    title?: string | null
    content?: unknown
    productions?: string[]
    images?: (string | null)[]
    thumbnail_index?: number | null
}

export type BlogDetailResponse = {
    data: BlogDetails
}

export type QuillDelta = {
    ops: Array<Record<string, unknown>>
}

type LocalizedBlogContent = {
    nl?: unknown
    en?: unknown
}

type LocalizedBlogTitle = {
    nl?: string | null
    en?: string | null
}

function getPreferredLocalizedValue<T extends string | unknown>(
    localized: { nl?: T; en?: T },
    locale: Locale,
): T | null {
    const alternateLocale: Locale = locale === 'nl' ? 'en' : 'nl'
    const candidates = [localized[locale], localized[alternateLocale], localized.nl, localized.en]

    for (const candidate of candidates) {
        if (candidate == null) {
            continue
        }

        if (typeof candidate === 'string' && candidate.trim().length === 0) {
            continue
        }

        return candidate
    }

    return null
}

type LocalizedText = ProductionCardItem['title']

export type BlogLinkedProduction = ProductionCardItem

export type ProductionDetailResponse = {
    data: BlogLinkedProduction
}

export function parsePossibleJson(value: unknown): unknown {
    if (typeof value !== 'string') {
        return value
    }

    try {
        return JSON.parse(value) as unknown
    } catch {
        return value
    }
}

export function getLocalizedContent(content: unknown, locale: Locale): string|null {
    const parsed = parsePossibleJson(content)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogContent
        const preferred = getPreferredLocalizedValue(localized, locale)
        return preferred as string | null
    }

    return parsed as string
}

export function getLocalizedTitle(title: unknown, locale: Locale): string {
    const parsed = parsePossibleJson(title)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogTitle
        const preferred = getPreferredLocalizedValue(localized, locale)
        return typeof preferred === 'string' ? preferred.trim() : ''
    }

    if (typeof parsed === 'string') {
        return parsed.trim()
    }

    return ''
}

export function getProductionLabel(production: BlogLinkedProduction, locale: Locale): string {
    return getLocalizedText(production.title, locale) || production.id
}

// checks wether language exists in Title
export function hasLocalizedTitle(title: unknown, locale: Locale): boolean {
    const parsed = parsePossibleJson(title)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogTitle
        return typeof localized[locale] === 'string' && localized[locale]!.trim().length > 0
    }

    return typeof parsed === 'string' && parsed.trim().length > 0
}

export function normalizeContent(content: unknown): QuillDelta | null {
    if (!content) {
        return null
    }

    const parsed = parsePossibleJson(content)

    if (typeof parsed === 'object' && parsed !== null && 'ops' in parsed) {
        return parsed as QuillDelta
    }

    return null
}

function getLocalizedText(value: LocalizedText, locale: Locale): string {
    if (!value) {
        return ''
    }

    return (value[locale] ?? value.nl ?? value.en ?? value.fr ?? '').trim()
}

export function getProductionExcerpt(production: BlogLinkedProduction, locale: Locale): string {
    const raw = getLocalizedText(production.description_short ?? null, locale)
        || getLocalizedText(production.description ?? null, locale)
        || getLocalizedText(production.teaser ?? null, locale)
        || getProductionLabel(production, locale)

    const plain = toPlainText(raw)
    return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain
}

export function getProductionVenue(production: BlogLinkedProduction): string {
    const venues = (production.venue_names ?? []).map((value) => value.trim()).filter((value) => value.length > 0)
    if (venues.length > 0) {
        return venues.join(' • ')
    }

    return production.venue_name?.trim() || production.attendance_mode?.trim() || ''
}
