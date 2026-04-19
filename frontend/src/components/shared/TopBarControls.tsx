import type { ReactNode } from 'react'
import type { Locale } from '../../i18n/types'

export type Theme = 'light' | 'dark'

type ControlButtonProps = {
  children: ReactNode
  className: string
  ariaLabel: string
  onClick: () => void
  ariaPressed?: boolean
}

type ThemeToggleProps = {
  theme: Theme
  darkLabel: string
  lightLabel: string
  onSelectTheme: (theme: Theme) => void
  className?: string
  compact?: boolean
}

type LocaleToggleProps = {
  locale: Locale
  ariaLabel: string
  onToggleLocale: () => void
  className?: string
  textClassName?: string
  uppercase?: boolean
}

function ControlButton({ children, className, ariaLabel, onClick, ariaPressed }: ControlButtonProps) {
  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function SunIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12H5M19 12h2.5M4.2 19.8L6 18M18 6l1.8-1.8" />
    </svg>
  )
}

export function MoonIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M20.6 14.6a8.5 8.5 0 1 1-11.2-11.2 7 7 0 1 0 11.2 11.2Z" />
    </svg>
  )
}

export function SegmentedThemeToggle({
  theme,
  darkLabel,
  lightLabel,
  onSelectTheme,
  className = '',
  compact = false,
}: ThemeToggleProps) {
  const containerClassName = compact ? 'inline-flex items-center gap-1' : `inline-flex h-8 w-16 items-center border border-border bg-grey ${className}`.trim()
  const buttonBaseClassName = compact
    ? 'inline-flex h-8 w-8 items-center justify-center cursor-pointer rounded-full text-white transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40'
    : 'inline-flex h-8 w-8 items-center justify-center cursor-pointer text-black transition-colors'

  return (
    <div className={containerClassName}>
      <ControlButton
        className={`${buttonBaseClassName} ${!compact && theme === 'dark' ? 'bg-white' : !compact ? 'bg-grey' : ''}`.trim()}
        ariaLabel={darkLabel}
        ariaPressed={theme === 'dark'}
        onClick={() => onSelectTheme('dark')}
      >
        <MoonIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </ControlButton>
      <ControlButton
        className={`${buttonBaseClassName} ${!compact && theme === 'light' ? 'bg-white' : !compact ? 'bg-grey' : ''}`.trim()}
        ariaLabel={lightLabel}
        ariaPressed={theme === 'light'}
        onClick={() => onSelectTheme('light')}
      >
        <SunIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </ControlButton>
    </div>
  )
}

export function NextLocaleToggle({
  locale,
  ariaLabel,
  onToggleLocale,
  className = '',
  textClassName = '',
  uppercase = true,
}: LocaleToggleProps) {
  const nextLocale = locale === 'nl' ? 'en' : 'nl'

  return (
    <ControlButton
      className={`inline-flex h-8 items-center justify-center cursor-pointer font-semibold ${uppercase ? 'uppercase' : ''} ${className}`.trim()}
      ariaLabel={ariaLabel}
      onClick={onToggleLocale}
    >
      <span className={textClassName}>{uppercase ? nextLocale.toUpperCase() : nextLocale}</span>
    </ControlButton>
  )
}
