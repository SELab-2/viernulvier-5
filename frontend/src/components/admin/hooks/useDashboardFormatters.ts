import type { Locale } from '../../../i18n/types'
import { useAdminMessages } from '../AdminMessagesContext'
import type { DeltaInfo } from './dashboardStatCards'

type DashboardFormatters = {
  formatCount: (value: number) => string
  formatDate: (value: string | null) => string
  formatDelta: (delta: DeltaInfo | undefined) => string
  locale: Locale
}

function makeCountFormatter(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : 'en-GB')
}

function makeSignFormatter(locale: Locale): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
    signDisplay: 'exceptZero',
    maximumFractionDigits: 0,
  })
}

function makeDateFormatter(locale: Locale): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(locale === 'nl' ? 'nl-BE' : 'en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function formatDeltaPill(delta: DeltaInfo | undefined, signFormatter: Intl.NumberFormat): string {
  if (!delta || delta.changePct === null) {
    return '—'
  }

  return signFormatter.format(delta.changePct) + '%'
}

function resolveLocale(): Locale {
  if (typeof document === 'undefined') {
    return 'nl'
  }

  const htmlLang = document.documentElement.lang as Locale | undefined
  return htmlLang === 'en' ? 'en' : 'nl'
}

export function useDashboardFormatters(): DashboardFormatters {
  const d = useAdminMessages().admin.dashboard
  const locale = resolveLocale()
  const countFormatter = makeCountFormatter(locale)
  const dateFormatter = makeDateFormatter(locale)
  const signFormatter = makeSignFormatter(locale)

  const formatCount = (value: number): string => countFormatter.format(value)

  const formatDate = (value: string | null): string => {
    if (!value) {
      return d.notSyncedYet
    }

    return dateFormatter.format(new Date(value))
  }

  const formatDelta = (delta: DeltaInfo | undefined): string => formatDeltaPill(delta, signFormatter)

  return {
    formatCount,
    formatDate,
    formatDelta,
    locale,
  }
}
