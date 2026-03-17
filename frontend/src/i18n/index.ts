import en from './locales/en'
import nl from './locales/nl'
import type { Locale, Messages } from './types'

const DEFAULT_LOCALE: Locale = 'nl'

const MESSAGES: Record<Locale, Messages> = {
  nl,
  en,
}

const LOCALE_STORAGE_KEY = 'locale'
const LOCALE_PATH_REGEX = /^\/(nl|en)(?=\/|$)/i

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

export function getLocaleFromPath(pathname: string): Locale | undefined {
  const match = pathname.match(LOCALE_PATH_REGEX)
  if (!match?.[1]) {
    return undefined
  }

  return resolveLocale(match[1])
}

export function withLocalePath(pathname: string, locale: Locale): string {
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  const stripped = normalizedPath.replace(LOCALE_PATH_REGEX, '') || '/'

  if (stripped === '/') {
    return `/${locale}`
  }

  return `/${locale}${stripped}`
}

export function getActiveLocale(pathname?: string): Locale {
  if (typeof window !== 'undefined') {
    const localeFromPath = getLocaleFromPath(pathname ?? window.location.pathname)
    if (localeFromPath) {
      return localeFromPath
    }

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
