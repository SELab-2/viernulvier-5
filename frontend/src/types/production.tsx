import type { Event } from "./event"

/**
 * Localized text structure
 */
export type LocalizedText = {
    nl?: string
    fr?: string
    en?: string
} | null;

export interface ProductionPayload {
  super_title?: LocalizedText,
  title?: LocalizedText,
  artist?: LocalizedText, 
  teaser?: LocalizedText, 
  description?: LocalizedText, 
  description_2?: LocalizedText, 
  // is_draft: boolean,
}

export interface ProductionPayloadRespone {
    data: {
        id: string,
        super_title?: LocalizedText,
        title?: LocalizedText,
        artist?: LocalizedText, 
        teaser?: LocalizedText, 
        description?: LocalizedText, 
        description_2?: LocalizedText, 
        // is_draft: boolean,
    }
}

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

export interface ProductionSettingsFields {
    artist: string
    banner: string
    extraPictures: string[]
    genres: LocalizedText[]
    tags: LocalizedText[]
}

/**
 * Basic structure for a production response from the API
 */
export interface ProductionResponse {
    data: {
        id: string
        title: LocalizedText
        description: LocalizedText
        artist: LocalizedText
        // Voeg hier andere velden toe indien nodig
    }
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
