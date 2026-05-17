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
        genre_ids?: string[]
        tag_ids?: string[]
        // is_draft: boolean,
    }
}

/**
 * Languages supported for production content
 */
export type Language = 'nl' | 'en'
