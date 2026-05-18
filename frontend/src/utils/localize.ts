type LocalizedField = {
    nl?: string | null
    fr?: string | null
    en?: string | null
} | null | undefined

export function localize(field: LocalizedField, locale: string): string | null {
    if (!field) return null
    return field[locale as 'en' | 'nl' | 'fr'] || field.en || field.nl || field.fr || null
}