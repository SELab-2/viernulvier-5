type LocalizedField = {
    nl?: string
    fr?: string
    en?: string
} | null | undefined

export function localize(field: LocalizedField, locale: string): string | null {
    if (!field) return null
    return field[locale as 'en' | 'nl' | 'fr'] || field.en || field.nl || field.fr || null
}