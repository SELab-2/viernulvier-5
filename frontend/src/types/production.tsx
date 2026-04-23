import type { Event } from "./event"

/**
 * Languages supported for production content
 */
export type Language = 'nl' | 'en'

/**
 * Editable fields for a production
 */
export interface ProductionContentFields {
    /** The title of the production */
    title: string
    /** The URL slug: production/{slug} */
    slug: string
    /** content of the production */
    content: string// TODO: depending on what text-editor is used, this type has to change
}

/**
 * Localized text structure
 */
export interface LocalizedText {
    nl?: string
    en?: string
    fr?: string
}

export interface ProductionSettingsFields {
    artist: string
    banner: string
    extraPictures: string[]
    genres: LocalizedText[]
    tags: LocalizedText[]
}

/**
 * The contents of a production based on the language
 */
export type ProductionContent = Record<Language, ProductionContentFields>

/**
 * All possible data that can be filled in the edit/create page
 * about a production
 */
export type ProductionForm = {
    content: ProductionContent
    settings: ProductionSettingsFields
    events: Event[]
}