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
        return {
            nl: { title: '', content: '' },
            en: { title: '', content: '' },
        }
    }

    const nlValue = isObject(value.nl) ? value.nl : null
    const enValue = isObject(value.en) ? value.en : null

    return {
        nl: {
            title: typeof nlValue?.title === 'string' ? nlValue.title : '',
            content: getEditorHtml(nlValue?.content),
        },
        en: {
            title: typeof enValue?.title === 'string' ? enValue.title : '',
            content: getEditorHtml(enValue?.content),
        },
    }
}

export function formatBlogDetailForForm(blogDetail: BlogDetail): {
    form: BlogContent
    contentJson: Record<Locale, unknown | null>
} {
    const localizedTitle = parseLocalizedBlogTitle(blogDetail.title)

    const parsedContent = parseBlogContent(blogDetail.content)

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
            nl: isObject(blogDetail.content) && 'nl' in blogDetail.content ? blogDetail.content.nl ?? null : null,
            en: isObject(blogDetail.content) && 'en' in blogDetail.content ? blogDetail.content.en ?? null : null,
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

export type BlogPublishValidation = 'ok' | 'atLeastOneLanguageRequired' | 'filledLanguageNeedsTitle'

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

        return { hasTitle, isFilled }
    })

    if (!states.some((state) => state.isFilled)) {
        return 'atLeastOneLanguageRequired'
    }

    if (states.some((state) => state.isFilled && !state.hasTitle)) {
        return 'filledLanguageNeedsTitle'
    }

    return 'ok'
}
