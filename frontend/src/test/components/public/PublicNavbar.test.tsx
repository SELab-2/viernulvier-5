import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { PublicMessagesContext } from '../../../components/public/PublicMessagesContext'
import PublicNavbar from '../../../components/public/PublicNavbar'
import type { Messages } from '../../../i18n/types'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => navigate,
    }
})

vi.mock('../../../i18n', () => ({
    withLocalePath: (path: string) => path,
    getActiveLocale: () => 'nl',
    getMessages: () => ({}),
    setActiveLocale: vi.fn(),
}))

vi.mock('../../../components/shared/TopBarControls', () => ({
    SegmentedThemeToggle: ({ onSelectTheme }: { onSelectTheme: (t: string) => void }) => (
        <button data-testid="theme-toggle" onClick={() => onSelectTheme('dark')}>
            theme
        </button>
    ),
    NextLocaleToggle: ({ onToggleLocale }: { onToggleLocale: () => void }) => (
        <button data-testid="locale-toggle" onClick={onToggleLocale}>
            locale
        </button>
    ),
}))

// ─── Messages stub ────────────────────────────────────────────────────────────

const messages = {
    common: { loading: 'Laden', brandName: 'VIERNULVIER', brandLogoAlt: 'VIERNULVIER logo' },
    nav: {
        home: 'Home',
        archive: 'ARCHIEF',
        searchAriaLabel: 'Zoeken',
        searchPlaceholder: 'Zoek...',
        navAriaLabel: 'Hoofdnavigatie',
        openMenuLabel: 'Menu openen',
        closeMenuLabel: 'Menu sluiten',
    },
    home: { title: 'Home' },
    auth: {
        localeToggleLabel: 'Wissel taal',
        darkModeLabel: 'Donkere modus',
        lightModeLabel: 'Lichte modus',
    },
} as unknown as Messages

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderNavbar(props: { locale?: 'nl' | 'en'; onToggleLocale?: () => void } = {}) {
    const { locale = 'nl', onToggleLocale = vi.fn() } = props
    return render(
        <MemoryRouter initialEntries={['/nl']}>
            <PublicMessagesContext.Provider value={messages}>
                <PublicNavbar locale={locale} onToggleLocale={onToggleLocale} />
            </PublicMessagesContext.Provider>
        </MemoryRouter>
    )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PublicNavbar', () => {
    beforeEach(() => {
        navigate.mockReset()
        document.documentElement.removeAttribute('data-theme')
        localStorage.removeItem('theme')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('renders the logo image with the brand alt text', () => {
        renderNavbar()
        expect(screen.getByRole('img', { name: 'VIERNULVIER logo' })).toBeInTheDocument()
    })

    it('renders the archive label in the header', () => {
        renderNavbar()
        expect(screen.getByText(/ARCHIEF/)).toBeInTheDocument()
    })

    it('renders the search toggle button with correct aria-label', () => {
        renderNavbar()
        const buttons = screen.getAllByRole('button', { name: 'Zoeken' })
        expect(buttons.length).toBeGreaterThan(0)
    })

    it('desktop search toggle starts with aria-expanded=false', () => {
        renderNavbar()
        const searchButtons = screen.getAllByRole('button', { name: 'Zoeken' })
        expect(searchButtons[0]).toHaveAttribute('aria-expanded', 'false')
    })

    it('desktop search toggle sets aria-expanded=true after click', () => {
        renderNavbar()
        const searchButtons = screen.getAllByRole('button', { name: 'Zoeken' })
        fireEvent.click(searchButtons[0])
        expect(searchButtons[0]).toHaveAttribute('aria-expanded', 'true')
    })

    it('calls onToggleLocale when locale toggle is clicked', () => {
        const handleToggleLocale = vi.fn()
        renderNavbar({ onToggleLocale: handleToggleLocale })
        const localeButtons = screen.getAllByTestId('locale-toggle')
        fireEvent.click(localeButtons[0])
        expect(handleToggleLocale).toHaveBeenCalledTimes(1)
    })

    it('applies dark theme to the document element when theme toggle is clicked', () => {
        renderNavbar()
        const themeButtons = screen.getAllByTestId('theme-toggle')
        fireEvent.click(themeButtons[0])
        expect(document.documentElement.dataset.theme).toBe('dark')
    })

    it('renders the mobile menu button', () => {
        renderNavbar()
        // Mobile menu button has aria-label from openMenuLabel / closeMenuLabel
        expect(screen.getByRole('button', { name: 'Menu openen' })).toBeInTheDocument()
    })

    it('toggles the mobile menu label when hamburger is clicked', () => {
        renderNavbar()
        const menuBtn = screen.getByRole('button', { name: 'Menu openen' })
        fireEvent.click(menuBtn)
        expect(screen.getByRole('button', { name: 'Menu sluiten' })).toBeInTheDocument()
    })
})
