/**
 * Tests that AdminLayout wires the settings modal open/close lifecycle correctly.
 * The settings trigger is the "Instellingen" button in the sidebar profile area.
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AdminLayout from './AdminLayout'

vi.mock('../../auth/useAdminSession', () => ({
  useAdminSession: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: { id: '1', username: 'admin', role: 'ADMIN' },
  }),
}))

// Minimal stubs to keep the test focussed on the settings wiring.
vi.mock('./AdminFooter', () => ({
  default: () => <div>Footer</div>,
}))

vi.mock('../../i18n', () => ({
  getActiveLocale: () => 'nl',
  getMessages: () => ({
    auth: {
      navigationTitle: 'Navigatie',
      dashboardLabel: 'Dashboard',
      productionsLabel: 'Producties',
      statisticsLabel: 'Statistieken',
      archiveLabel: 'Archief',
      logoutLabel: 'Afmelden',
      localeToggleLabel: 'Wijzig taal',
    },
    footer: {
      privacy: 'Privacy',
      cookies: 'Cookies',
      disclaimer: 'Disclaimer',
      rights: 'Alle rechten voorbehouden',
    },
    common: { loading: 'Laden...', brandName: 'VIERNULVIER', brandLogoAlt: 'VIERNULVIER' },
    settings: {
      title: 'Instellingen',
      subtitle: 'Beheer je account.',
      closeAriaLabel: 'Sluiten',
      tabAccount: 'Mijn account',
      tabEditors: 'Editors',
      accountSectionTitle: 'Profielgegevens',
      usernameLabel: 'Gebruikersnaam',
      usernameHint: 'De naam waarmee je inlogt in het CMS.',
      saveButton: 'Opslaan',
      saving: 'Opslaan...',
      securitySectionTitle: 'Beveiliging',
      securityHint: 'Verander je wachtwoord om je account te beveiligen.',
      changePasswordButton: 'Wachtwoord wijzigen',
      currentPasswordLabel: 'Huidig wachtwoord',
      newPasswordLabel: 'Nieuw wachtwoord',
      confirmPasswordLabel: 'Bevestig nieuw wachtwoord',
      savePasswordButton: 'Opslaan',
      savingPassword: 'Bezig...',
      cancelButton: 'Annuleren',
      passwordMismatchError: 'Wachtwoorden komen niet overeen.',
      accountSavedSuccess: 'Accountgegevens opgeslagen.',
      accountSaveError: 'Account opslaan mislukt.',
      passwordChangedSuccess: 'Wachtwoord succesvol gewijzigd.',
      passwordChangeError: 'Wachtwoord wijzigen mislukt.',
      editorsSectionTitle: 'Editors beheren',
      editorsLoadError: 'Editors laden mislukt.',
      noEditorsTitle: 'Nog geen editors toegevoegd.',
      noEditorsHint: 'Maak rechts een editoraccount aan.',
      clickToManageHint: 'Klik om te beheren',
      newEditorTitle: 'Nieuwe editor',
      editEditorTitle: 'Editor aanpassen',
      addNewEditorButton: '+ Nieuwe editor',
      editorUsernameLabel: 'Gebruikersnaam',
      temporaryPasswordLabel: 'Tijdelijk wachtwoord',
      temporaryPasswordHint: 'De editor moet dit bij eerste aanmelding wijzigen.',
      createEditorButton: 'Editor aanmaken',
      creatingEditor: 'Bezig...',
      editorCreatedSuccess: 'Editor aangemaakt.',
      editorCreateError: 'Editor aanmaken mislukt.',
      saveUsernameButton: 'Gebruikersnaam opslaan',
      resetPasswordTitle: 'Wachtwoord resetten',
      resetPasswordHint: 'Alleen invullen wanneer je het wachtwoord wilt wijzigen.',
      resetPasswordPlaceholder: 'Nieuw wachtwoord',
      resetPasswordButton: 'Wachtwoord resetten',
      resettingPassword: 'Bezig...',
      editorPasswordResetSuccess: 'Wachtwoord van editor gewijzigd.',
      editorPasswordResetError: 'Wachtwoord resetten mislukt.',
      dangerZoneTitle: 'Gevaarlijke actie',
      dangerZoneHint: 'Het verwijderen van een editor is permanent en kan niet ongedaan gemaakt worden.',
      deleteEditorButton: 'Editor verwijderen',
      deletingEditor: 'Verwijderen...',
      deleteEditorConfirm: 'Editor {username} verwijderen?',
      editorSavedSuccess: 'Editor bijgewerkt.',
      editorSaveError: 'Editor opslaan mislukt.',
      editorDeleteError: 'Editor verwijderen mislukt.',
    },
  }),
  setActiveLocale: vi.fn(),
}))

describe('AdminLayout – settings modal integration', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: { id: '1', username: 'beheerder', role: 'ADMIN' } }), { status: 200 })))
    window.history.replaceState(window.history.state, '', '/admin')
    document.documentElement.dataset.theme = 'light'
    localStorage.setItem('locale', 'nl')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens the settings modal when the settings button in the sidebar is clicked', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Instellingen' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    // The modal heading is an h2 inside the dialog
    expect(screen.getByRole('heading', { name: 'Instellingen' })).toBeInTheDocument()
  })

  it('closes the settings modal when the close button inside it is clicked', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Instellingen' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not show a settings button in the top bar', () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    // There is exactly one settings button (the one in the sidebar).
    const settingsButtons = screen.getAllByRole('button', { name: 'Instellingen' })
    expect(settingsButtons).toHaveLength(1)
  })

  it('updates the sidebar username after saving a new account username', async () => {
    render(
      <MemoryRouter>
        <AdminLayout showSidebar>
          <span>Content</span>
        </AdminLayout>
      </MemoryRouter>,
    )

    expect(screen.getByText('admin')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Instellingen' }))
    fireEvent.change(screen.getByLabelText('Gebruikersnaam'), { target: { value: 'beheerder' } })
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(screen.getByText('beheerder')).toBeInTheDocument()
    })
  })
})
