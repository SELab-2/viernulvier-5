import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../i18n/types'
import { AdminMessagesContext } from './AdminMessagesContext'
import AdminTopBar from './AdminTopBar'

const testMessages: Pick<Messages, 'common'> = {
  common: {
    loading: 'Laden...',
    brandName: 'VIERNULVIER',
    brandLogoAlt: 'VIERNULVIER',
  },
}

function renderWithMessages(ui: React.ReactElement) {
  return render(
    <AdminMessagesContext.Provider value={testMessages as Messages}>
      {ui}
    </AdminMessagesContext.Provider>,
  )
}

describe('AdminTopBar', () => {
  it('renders the wordmark', () => {
    renderWithMessages(
      <AdminTopBar
        locale="nl"
        theme="light"
        onToggleLocale={vi.fn()}
        onSelectTheme={vi.fn()}
        themeToggleDark="Donker"
        themeToggleLight="Licht"
        localeToggleAriaLabel="Wissel taal"
      />,
    )

    expect(screen.getByAltText('VIERNULVIER')).toBeInTheDocument()
  })

  it('does not render a settings button (trigger moved to sidebar)', () => {
    renderWithMessages(
      <AdminTopBar
        locale="nl"
        theme="light"
        onToggleLocale={vi.fn()}
        onSelectTheme={vi.fn()}
        themeToggleDark="Donker"
        themeToggleLight="Licht"
        localeToggleAriaLabel="Wissel taal"
      />,
    )

    expect(screen.queryByRole('button', { name: 'Instellingen' })).not.toBeInTheDocument()
  })
})
