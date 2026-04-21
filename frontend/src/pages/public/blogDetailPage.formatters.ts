import type { Locale } from '../../i18n/types'

export type BlogDetails = {
    id: string
    title?: string | null
    content?: unknown
    productions?: string[]
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

type LocalizedText = {
    nl?: string | null
    en?: string | null
    fr?: string | null
} | null

export type BlogLinkedProduction = {
    id: string
    title: LocalizedText
    description_short?: LocalizedText
    description?: LocalizedText
    teaser?: LocalizedText
    image_url?: string | null
    created_at?: string
    venue_name?: string | null
    venue_names?: string[]
    attendance_mode?: string | null
}

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

export function getLocalizedContent(content: unknown, locale: Locale): unknown {
    const parsed = parsePossibleJson(content)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogContent
        return localized[locale] ?? localized.nl ?? localized.en ?? null
    }

    return parsed
}

export function getLocalizedTitle(title: unknown, locale: Locale): string {
    const parsed = parsePossibleJson(title)

    if (typeof parsed === 'object' && parsed !== null && ('nl' in parsed || 'en' in parsed)) {
        const localized = parsed as LocalizedBlogTitle
        return (localized[locale] ?? localized.nl ?? localized.en ?? '').trim()
    }

    if (typeof parsed === 'string') {
        return parsed.trim()
    }

    return ''
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

function toPlainText(value: string): string {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
}

export function getProductionLabel(production: BlogLinkedProduction, locale: Locale): string {
    return getLocalizedText(production.title, locale) || production.id
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

export function getProductionDate(production: BlogLinkedProduction, locale: Locale): string {
    if (!production.created_at) {
        return ''
    }

    const date = new Date(production.created_at)
    if (Number.isNaN(date.getTime())) {
        return ''
    }

    const dateLocale = locale === 'nl' ? 'nl-BE' : 'en-GB'

    return new Intl.DateTimeFormat(dateLocale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date)
}
