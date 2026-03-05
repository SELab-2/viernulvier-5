import en from './locales/en'
import nl from './locales/nl'
import type { Locale, Messages } from './types'

const DEFAULT_LOCALE: Locale = 'nl'

const MESSAGES: Record<Locale, Messages> = {
  nl,
  en,
}

export function resolveLocale(rawLocale?: string): Locale {
  if (!rawLocale) {
    return DEFAULT_LOCALE
  }

  const normalized = rawLocale.toLowerCase()

  if (normalized.startsWith('nl')) {
    return 'nl'
  }

  if (normalized.startsWith('en')) {
    return 'en'
  }

  return DEFAULT_LOCALE
}

export function getMessages(locale?: Locale): Messages {
  // Keep NL as the scaffold default until language switching is wired.
  const activeLocale = locale ?? DEFAULT_LOCALE
  return MESSAGES[activeLocale]
}
