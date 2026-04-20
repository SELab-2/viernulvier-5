/**
 * Languages supported for production content
 */
export type Language = 'nl' | 'en'

/**
 * Editable fields for a production
 */
export interface ProductionFields {
    /** The title of the production */
    title?: string
    /** The URL slug: production/{slug} */
    slug?: string
    /** content of the production */
    content?: string// TODO: depending on what text-editor is used, this type has to change
}

/**
 * The contents of a production based on the language
 */
export type ProductionContent = Record<Language, ProductionFields>