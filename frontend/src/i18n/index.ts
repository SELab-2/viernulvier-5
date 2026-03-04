import en from './locales/en'
import nl from './locales/nl'
import type { Locale, Messages } from './types'

const DEFAULT_LOCALE: Locale = 'nl'

const MESSAGES: Record<Locale, Messages> = {
  nl,
  en,
}

const LOCALE_STORAGE_KEY = 'locale'

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

export function getActiveLocale(): Locale {
  if (typeof window !== 'undefined') {
    const savedLocale = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (savedLocale) {
      return resolveLocale(savedLocale)
    }

    if (document?.documentElement?.lang) {
      return resolveLocale(document.documentElement.lang)
    }

    return resolveLocale(window.navigator.language)
  }

  return DEFAULT_LOCALE
}

export function setActiveLocale(locale: Locale) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  document.documentElement.lang = locale
}

export function getMessages(locale?: Locale): Messages {
  const activeLocale = locale ?? getActiveLocale()
  return MESSAGES[activeLocale]
}
