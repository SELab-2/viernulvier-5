import { useState } from 'react'
import { getActiveLocale, setActiveLocale } from '../../i18n'
import type { Locale } from '../../i18n/types'

function getInitialLocale(): Locale {
  return getActiveLocale(window.location.pathname)
}

type UseLocaleResult = {
  locale: Locale
  handleLocaleChange: (nextLocale: Locale) => void
}

export function useLocale(): UseLocaleResult {
  const [locale, setLocale] = useState<Locale>(getInitialLocale)

  const handleLocaleChange = (nextLocale: Locale) => {
    setLocale(nextLocale)
    setActiveLocale(nextLocale)
  }

  return { locale, handleLocaleChange }
}
