import { useState, useEffect } from 'react'
import { getActiveLocale, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'

function getInitialLocale(): Locale {
  return getActiveLocale(window.location.pathname)
}

type UseLocaleResult = {
  locale: Locale
  handleLocaleChange: (nextLocale: Locale) => void
}

const LOCALE_CHANGE_EVENT = 'admin-locale-change'

export function useLocale(): UseLocaleResult {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  useEffect(() => {
    const handleStorageChange = () => {
      setLocale(getInitialLocale())
    }

    window.addEventListener(LOCALE_CHANGE_EVENT, handleStorageChange)
    return () => window.removeEventListener(LOCALE_CHANGE_EVENT, handleStorageChange)
  }, [])

  const handleLocaleChange = (nextLocale: Locale) => {
    setActiveLocale(nextLocale)
    setLocale(nextLocale)
    // Dispatch global event so other components using useLocale re-render
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT))
  }

  return { locale, handleLocaleChange }
}
