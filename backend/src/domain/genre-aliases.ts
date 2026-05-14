export const GENRE_SEARCH_ALIASES: Record<string, string[]> = {
    theater: ['theater', 'theatre'],
    theatre: ['theatre', 'theater'],
    dans: ['dans', 'dance'],
    dance: ['dance', 'dans'],
    concert: ['concert'],
    nightlife: ['nightlife'],
    talks: ['talks', 'talk'],
    comedy: ['comedy', 'komedie'],
    komedie: ['komedie', 'comedy'],
    monument: ['monument'],
    circus: ['circus'],
    performance: ['performance', 'voorstelling'],
    voorstelling: ['voorstelling', 'performance'],
    'spoken word': ['spoken word'],
    'listening session': ['listening session'],
}

export type ProductionSearchLanguage = 'nl' | 'en' | 'fr'

export const PRODUCTION_SEARCH_LANGUAGE_FALLBACKS: Record<ProductionSearchLanguage, ProductionSearchLanguage[]> = {
    nl: ['nl', 'en', 'fr'],
    en: ['en', 'nl', 'fr'],
    fr: ['fr', 'nl', 'en'],
}

export const PRODUCTION_SEARCH_THRESHOLDS = {
    similarity: 0.2,
    wordSimilarity: 0.45,
    maxResults: 5000,
} as const

export const PRODUCTION_SEARCH_WEIGHTS = {
    titleExact: 1000,
    titlePrefix: 900,
    titleContains: 800,
    descriptionShortContains: 380,
    descriptionContains: 340,
    teaserContains: 320,
    titleSimilarity: 220,
    titleWordSimilarity: 200,
    descriptionShortSimilarity: 80,
    descriptionShortWordSimilarity: 70,
    descriptionSimilarity: 70,
    descriptionWordSimilarity: 65,
    teaserSimilarity: 60,
    teaserWordSimilarity: 55,
} as const

export function expandGenreTerms(genre: string): string[] {
    const normalized = genre.trim().toLowerCase()
    if (!normalized) {
        return []
    }

    const fromAliases = GENRE_SEARCH_ALIASES[normalized] ?? [normalized]
    return Array.from(new Set(fromAliases))
}

export function normalizeProductionSearchLanguage(lang?: string): ProductionSearchLanguage {
    const normalized = lang?.trim().toLowerCase()
    if (normalized === 'en' || normalized === 'fr') {
        return normalized
    }

    return 'nl'
}

export function getProductionSearchLanguageFallbacks(lang?: string): ProductionSearchLanguage[] {
    return PRODUCTION_SEARCH_LANGUAGE_FALLBACKS[normalizeProductionSearchLanguage(lang)]
}
