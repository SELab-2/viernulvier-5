import type { LocalizedText } from "./production"

export interface TaxonomyItem {
    id: string
    name: LocalizedText
}

export interface TaxonomyResponse {
    data: TaxonomyItem[]
}
