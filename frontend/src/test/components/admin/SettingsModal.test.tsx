import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import SettingsModal from '../../../components/admin/SettingsModal'

const adminUser = {
  id: '1',
  username: 'admin',
  role: 'ADMIN',
} as const

const editorUser = {
  id: '2',
  username: 'editor',
  role: 'EDITOR',
} as const

// Minimal messages fixture with just the settings and common namespaces.
const testMessages: Pick<Messages, 'settings' | 'common'> = {
  common: {
    loading: 'Laden...',
    brandName: 'VIERNULVIER',
    brandLogoAlt: 'VIERNULVIER',
  },
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
    temporaryPasswordHint: 'De editor zou dit bij eerste aanmelding moeten wijzigen.',
    passwordMinLengthHint: 'Minstens 6 tekens.',
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
}

function renderWithMessages(ui: React.ReactElement) {
  return render(
    <AdminMessagesContext.Provider value={testMessages as Messages}>
      {ui}
    </AdminMessagesContext.Provider>,
  )
}

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: [] }), { status: 200 })))
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not render anything when closed', () => {
    renderWithMessages(<SettingsModal isOpen={false} onClose={vi.fn()} user={adminUser} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not render when there is no authenticated user', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={null} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders the modal when open', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Instellingen')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderWithMessages(<SettingsModal isOpen onClose={onClose} user={adminUser} />)

    fireEvent.click(screen.getByRole('button', { name: 'Sluiten' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn()
    renderWithMessages(<SettingsModal isOpen onClose={onClose} user={adminUser} />)

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows My Account and Editors tabs for admins', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    expect(screen.getByRole('tab', { name: 'Mijn account' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Editors' })).toBeInTheDocument()
  })

  it('shows only My Account tab for editors', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={editorUser} />)

    expect(screen.getByRole('tab', { name: 'Mijn account' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Editors' })).not.toBeInTheDocument()
  })

  it('renders My Account tab content by default', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    expect(screen.getByLabelText('Gebruikersnaam')).toBeInTheDocument()
    expect(screen.getByDisplayValue('admin')).toBeInTheDocument()
  })

  it('switches to Editors tab and loads editors from the cms-users editor endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Editors' }))

    expect(screen.getByText('Editors beheren')).toBeInTheDocument()
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('/api/v1/cms-users/editors', expect.any(Object))
    })
  })

  it('shows password reset flow trigger on My Account tab, not always-open password fields', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    expect(screen.getByRole('button', { name: 'Wachtwoord wijzigen' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Nieuw wachtwoord')).not.toBeInTheDocument()
  })

  it('expands password reset fields after clicking the trigger', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord wijzigen' }))

    expect(screen.getByLabelText('Huidig wachtwoord')).toBeInTheDocument()
    expect(screen.getByLabelText('Nieuw wachtwoord')).toBeInTheDocument()
    expect(screen.getByLabelText('Bevestig nieuw wachtwoord')).toBeInTheDocument()
  })

  it('hides password reset fields when cancelled', () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord wijzigen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Annuleren' }))

    expect(screen.queryByLabelText('Nieuw wachtwoord')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Wachtwoord wijzigen' })).toBeInTheDocument()
  })

  it('shows validation error when new passwords do not match', async () => {
    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord wijzigen' }))

    fireEvent.change(screen.getByLabelText('Huidig wachtwoord'), { target: { value: 'huidig123' } })
    fireEvent.change(screen.getByLabelText('Nieuw wachtwoord'), { target: { value: 'nieuw123' } })
    fireEvent.change(screen.getByLabelText('Bevestig nieuw wachtwoord'), { target: { value: 'anders456' } })

    // There are two "Opslaan" buttons: the disabled account-save and the enabled password-save.
    // The enabled one is the password submit button.
    const saveButtons = screen.getAllByRole('button', { name: 'Opslaan' })
    const enabledSave = saveButtons.find((btn) => !btn.hasAttribute('disabled'))
    expect(enabledSave).toBeDefined()
    fireEvent.click(enabledSave!)

    expect(await screen.findByText('Wachtwoorden komen niet overeen.')).toBeInTheDocument()
  })

  it('submits password change via API and shows success feedback', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: '1', username: 'admin', role: 'ADMIN' } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('button', { name: 'Wachtwoord wijzigen' }))

    fireEvent.change(screen.getByLabelText('Huidig wachtwoord'), { target: { value: 'huidig123' } })
    fireEvent.change(screen.getByLabelText('Nieuw wachtwoord'), { target: { value: 'nieuw123!' } })
    fireEvent.change(screen.getByLabelText('Bevestig nieuw wachtwoord'), { target: { value: 'nieuw123!' } })

    const saveButtons = screen.getAllByRole('button', { name: 'Opslaan' })
    const enabledSave = saveButtons.find((btn) => !btn.hasAttribute('disabled'))
    expect(enabledSave).toBeDefined()
    fireEvent.click(enabledSave!)

    await waitFor(() => {
      expect(screen.getByText('Wachtwoord succesvol gewijzigd.')).toBeInTheDocument()
    })
  })

  it('propagates a saved username through the update callback and resets to the saved value when reopened', async () => {
    const onUserUpdated = vi.fn()
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ data: { id: '1', username: 'beheerder', role: 'ADMIN' } }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const onClose = vi.fn()
    const { rerender } = renderWithMessages(
      <SettingsModal isOpen onClose={onClose} user={adminUser} onUserUpdated={onUserUpdated} />,
    )

    fireEvent.change(screen.getByLabelText('Gebruikersnaam'), { target: { value: 'beheerder' } })
    fireEvent.click(screen.getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(onUserUpdated).toHaveBeenCalledWith({ id: '1', username: 'beheerder', role: 'ADMIN' })
      expect(screen.getByDisplayValue('beheerder')).toBeInTheDocument()
    })

    rerender(
      <AdminMessagesContext.Provider value={testMessages as Messages}>
        <SettingsModal
          isOpen={false}
          onClose={onClose}
          user={{ ...adminUser, username: 'beheerder' }}
          onUserUpdated={onUserUpdated}
        />
      </AdminMessagesContext.Provider>,
    )

    rerender(
      <AdminMessagesContext.Provider value={testMessages as Messages}>
        <SettingsModal
          isOpen
          onClose={onClose}
          user={{ ...adminUser, username: 'beheerder' }}
          onUserUpdated={onUserUpdated}
        />
      </AdminMessagesContext.Provider>,
    )

    expect(screen.getByDisplayValue('beheerder')).toBeInTheDocument()
  })

  it('shows Editors tab with create and management panels', () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    } as Response)

    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Editors' }))

    expect(screen.getByText('Editors beheren')).toBeInTheDocument()
    expect(screen.getByText('Nieuwe editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editor aanmaken' })).toBeInTheDocument()
  })

  it('shows add new editor button while an editor is selected and clicking it switches back to create mode', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: [{ id: '10', username: 'jan', role: 'EDITOR' }] }),
    } as Response)

    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Editors' }))

    // Wait for the editor list to load and click the editor
    const editorButton = await screen.findByRole('button', { name: /jan/i })
    fireEvent.click(editorButton)

    // The add-new-editor button should now be visible
    const addButton = screen.getByRole('button', { name: '+ Nieuwe editor' })
    expect(addButton).toBeInTheDocument()

    // Clicking it should switch the panel back to create mode
    fireEvent.click(addButton)
    expect(screen.getByText('Nieuwe editor')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editor aanmaken' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Nieuwe editor' })).not.toBeInTheDocument()
  })

  it('shows a localized error when loading editors fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network error'))

    renderWithMessages(<SettingsModal isOpen onClose={vi.fn()} user={adminUser} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Editors' }))

    expect(await screen.findByText('Editors laden mislukt.')).toBeInTheDocument()
  })
})
