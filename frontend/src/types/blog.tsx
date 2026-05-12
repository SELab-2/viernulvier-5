/**
 * Languages supported for blog content
 */
export type Language = 'nl' | 'en'

/**
 * Editable fields for a blog
 */
export interface BlogFields {
    /** The title of the blog */
    title: string
    /** content of the blog */
    content: string // Rich text editor content
}

/**
 * The contents of a blog based on the language
 */
export type BlogContent = Record<Language, BlogFields>
