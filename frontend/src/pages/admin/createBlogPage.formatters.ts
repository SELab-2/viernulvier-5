import Quill from 'quill'

import type { BlogContent } from '../../types/blog'
import type { Locale } from '../../i18n/types'
import type { ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'

export type ProductionListResponse = {
    data: ProductionItem[]
}

export type ProductionDetailResponse = {
    data: ProductionItem
}

export type LocalizedBlogTitle = {
    nl: string
    en: string
}

export type BlogDetail = {
    id: string
    title?: string | null
    content?: unknown
    productions?: string[]
}

export type BlogDetailResponse = {
    data: BlogDetail
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null
}

function getEditorHtml(value: unknown): string {
    if (!value) {
        return ''
    }

    if (typeof value === 'string') {
        return value
    }

    if (isObject(value) && 'ops' in value) {
        const container = document.createElement('div')
        const quill = new Quill(container)
        quill.setContents(value as never)
        return quill.root.innerHTML
    }

    return ''
}

function parseLocalizedBlogTitle(value: string | null | undefined): LocalizedBlogTitle {
    if (!value) {
        return { nl: '', en: '' }
    }

    try {
        const parsed = JSON.parse(value) as Partial<LocalizedBlogTitle>
        return {
            nl: parsed.nl ?? '',
            en: parsed.en ?? '',
        }
    } catch {
        return { nl: '', en: '' }
    }
}

function parseBlogContent(value: unknown): BlogContent {
    if (!isObject(value)) {
        const html = getEditorHtml(value)
        return {
            nl: { title: '', content: html },
            en: { title: '', content: html },
        }
    }

    const extractLocaleContent = (localeValue: unknown): string => {
        if (isObject(localeValue) && 'content' in localeValue) {
            return getEditorHtml((localeValue as { content?: unknown }).content)
        }

        return getEditorHtml(localeValue)
    }

    const nlContent = extractLocaleContent(value.nl)
    const enContent = extractLocaleContent(value.en)

    return {
        nl: {
            title: '',
            content: nlContent,
        },
        en: {
            title: '',
            content: enContent,
        },
    }
}

export function formatBlogDetailForForm(blogDetail: BlogDetail): {
    form: BlogContent
    contentJson: Record<Locale, unknown | null>
} {
    const localizedTitle = parseLocalizedBlogTitle(blogDetail.title)

    const parsedContent = parseBlogContent(blogDetail.content)

    const normalizeLocaleJson = (localeValue: unknown): unknown | null => {
        if (isObject(localeValue) && 'content' in localeValue) {
            return (localeValue as { content?: unknown }).content ?? null
        }

        return localeValue ?? null
    }

    return {
        form: {
            nl: {
                title: localizedTitle.nl,
                content: parsedContent.nl.content,
            },
            en: {
                title: localizedTitle.en,
                content: parsedContent.en.content,
            },
        },
        contentJson: {
            nl: isObject(blogDetail.content) && 'nl' in blogDetail.content
                ? normalizeLocaleJson(blogDetail.content.nl)
                : normalizeLocaleJson(blogDetail.content),
            en: isObject(blogDetail.content) && 'en' in blogDetail.content
                ? normalizeLocaleJson(blogDetail.content.en)
                : normalizeLocaleJson(blogDetail.content),
        },
    }
}

function hasTextContent(value: string): boolean {
    const stripped = value.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim()
    return stripped.length > 0
}

function hasRichContent(value: unknown): boolean {
    if (!value) {
        return false
    }

    if (typeof value === 'string') {
        return hasTextContent(value)
    }

    if (isObject(value) && 'ops' in value && Array.isArray(value.ops)) {
        return value.ops.some((op) => {
            if (!isObject(op) || !('insert' in op)) {
                return false
            }

            if (typeof op.insert === 'string') {
                return op.insert.trim().length > 0
            }

            return Boolean(op.insert)
        })
    }

    return true
}

export type BlogPublishValidation =
    | 'allLanguageFilled'
    | 'notAllLanguageFilled'
    | 'atLeastOneLanguageRequired'
    | 'filledLanguageNeedsTitle'
    | 'filledLanguageNeedsContent'

export function validateBlogPublishInput(
    form: BlogContent,
    contentJson: Record<Locale, unknown | null>,
): BlogPublishValidation {
    const locales: Locale[] = ['nl', 'en']

    const states = locales.map((locale) => {
        const title = form[locale].title.trim()
        const htmlContent = form[locale].content
        const jsonContent = contentJson[locale]

        const hasTitle = title.length > 0
        const hasContent = hasTextContent(htmlContent) || hasRichContent(jsonContent)
        const isFilled = hasTitle || hasContent

        return { hasTitle, hasContent, isFilled }
    })

    if (!states.some((state) => state.isFilled)) {
        return 'atLeastOneLanguageRequired'
    }

    if (states.some((state) => state.isFilled && !state.hasTitle)) {
        return 'filledLanguageNeedsTitle'
    }

    if (states.some((state) => state.hasTitle && !state.hasContent)) {
        return 'filledLanguageNeedsContent'
    }

    if (states.every((state) => state.isFilled)) {
        return 'allLanguageFilled'
    }

    return 'notAllLanguageFilled'
}
