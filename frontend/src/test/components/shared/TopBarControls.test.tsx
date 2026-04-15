import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NextLocaleToggle, SegmentedThemeToggle } from '../../../components/shared/TopBarControls'

describe('TopBarControls', () => {
  it('renders the next locale label and toggles when clicked', () => {
    const onToggleLocale = vi.fn()

    render(
      <NextLocaleToggle locale="nl" ariaLabel="Wissel taal" onToggleLocale={onToggleLocale} className="text-white" />,
    )

    const toggle = screen.getByRole('button', { name: 'Wissel taal' })
    expect(toggle).toHaveTextContent('EN')

    fireEvent.click(toggle)
    expect(onToggleLocale).toHaveBeenCalledTimes(1)
  })

  it('marks the active theme button and forwards theme selection', () => {
    const onSelectTheme = vi.fn()

    render(
      <SegmentedThemeToggle
        theme="dark"
        darkLabel="Donkere modus"
        lightLabel="Lichte modus"
        onSelectTheme={onSelectTheme}
      />,
    )

    const darkButton = screen.getByRole('button', { name: 'Donkere modus' })
    const lightButton = screen.getByRole('button', { name: 'Lichte modus' })

    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
    expect(lightButton).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(lightButton)
    expect(onSelectTheme).toHaveBeenCalledWith('light')
  })

  it('passes the explicit theme value — dark button always calls onSelectTheme("dark")', () => {
    const onSelectTheme = vi.fn()

    render(
      <SegmentedThemeToggle
        theme="light"
        darkLabel="Donkere modus"
        lightLabel="Lichte modus"
        onSelectTheme={onSelectTheme}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Donkere modus' }))
    expect(onSelectTheme).toHaveBeenCalledWith('dark')
    expect(onSelectTheme).not.toHaveBeenCalledWith('light')
  })

  it('calling the same segment twice passes the same value both times (idempotent)', () => {
    const onSelectTheme = vi.fn()

    render(
      <SegmentedThemeToggle
        theme="dark"
        darkLabel="Donkere modus"
        lightLabel="Lichte modus"
        onSelectTheme={onSelectTheme}
      />,
    )

    const lightButton = screen.getByRole('button', { name: 'Lichte modus' })
    fireEvent.click(lightButton)
    fireEvent.click(lightButton)

    expect(onSelectTheme).toHaveBeenCalledTimes(2)
    expect(onSelectTheme).toHaveBeenNthCalledWith(1, 'light')
    expect(onSelectTheme).toHaveBeenNthCalledWith(2, 'light')
  })

  it('renders the compact theme control variant', () => {
    const onSelectTheme = vi.fn()

    render(
      <SegmentedThemeToggle
        theme="light"
        darkLabel="Donkere modus inschakelen"
        lightLabel="Lichte modus inschakelen"
        onSelectTheme={onSelectTheme}
        compact
      />,
    )

    expect(screen.getByRole('button', { name: 'Donkere modus inschakelen' })).toHaveClass('rounded-full')
    expect(screen.getByRole('button', { name: 'Lichte modus inschakelen' })).toHaveClass('rounded-full')
  })
})
