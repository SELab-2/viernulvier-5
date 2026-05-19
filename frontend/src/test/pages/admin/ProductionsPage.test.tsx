import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import ProductionsPage from '../../../pages/admin/ProductionsPage'


const navigate = vi.fn()
const apiFetchMock = vi.hoisted(() => vi.fn())
const getAdminRouteConfigMock = vi.hoisted(() => vi.fn())
const confirmMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return { ...actual, useNavigate: () => navigate }
})

vi.mock('../../../api/client', () => ({
    apiFetch: apiFetchMock,
}))

vi.mock('../../../admin/paths', async () => {
    const actual = await vi.importActual<typeof import('../../../admin/paths')>('../../../admin/paths')
    return { ...actual, getAdminRouteConfig: getAdminRouteConfigMock }
})

const mockMessages = {
    admin: {
        dashboard: {
            tableColTitle: 'Titel',
            tableColType: 'Type',
            tableColStatus: 'Status',
            tableColLanguage: 'Taal',
            tableColDate: 'Datum',
            tableColActions: 'Acties',
            statusAvailable: 'Beschikbaar',
            actionEdit: 'Bewerk',
            actionDelete: 'Verwijder',
            emptyRecent: 'Geen producties gevonden.',
            languageStatusComplete: 'Volledig',
            languageStatusAttention: 'Aandacht vereist',
            languageStatusMissing: 'Ontbreekt',
            paginationPrev: 'Vorige pagina',
            paginationNext: 'Volgende pagina',
        },
        productions: {
            pageTitle: 'Producties',
            pageSubtitle: 'Overzicht van alle gearchiveerde en actuele voorstellingen.',
            searchPlaceholder: 'Zoek op titel, artiest of genre...',
            newButton: 'Nieuwe Productie',
            deleteConfirm: 'Weet je zeker dat je deze productie wilt verwijderen?',
            deleteError: 'Verwijderen mislukt. Probeer opnieuw.',
            paginationShowing: (from: number, to: number, total: number) => `Toont ${from}–${to} van ${total} resultaten`,
            paginationPageLabel: (page: number) => `Pagina ${page}`,
            loadError: 'Kon producties niet laden.',
        },
    },
} as unknown as Messages

vi.mock('../../../components/admin/AdminLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => (
        <AdminMessagesContext.Provider value={mockMessages}>
            {children}
        </AdminMessagesContext.Provider>
    ),
}))

vi.mock('../../../components/admin/hooks/useDashboardFormatters', () => ({
    useDashboardFormatters: () => ({
        formatDate: (value: string) => `formatted:${value}`,
    }),
}))


function makePaginatedResponse(items: object[], total = items.length, totalPages = 1) {
    return {
        data: items,
        meta: { total, page: 1, limit: 10, totalPages },
    }
}

const productionA = {
    id: 'prod-1',
    title: { nl: 'De Grote Voorstelling', en: null, fr: null },
    production_genres: ['Theater'],
    performer_type: null,
    status: 'published',
    language_status: { nl: 'complete', en: 'attention' },
    updated_at: '2024-03-15T10:00:00Z',
}

const productionB = {
    id: 'prod-2',
    title: { nl: 'Kleine Voorstelling', en: null, fr: null },
    production_genres: ['Dans'],
    performer_type: null,
    status: 'concept',
    language_status: { nl: 'missing', en: 'complete' },
    updated_at: '2024-04-01T08:00:00Z',
}

function renderPage() {
    return render(
        <MemoryRouter>
            <ProductionsPage />
        </MemoryRouter>,
    )
}


beforeEach(() => {
    navigate.mockReset()
    apiFetchMock.mockReset()
    getAdminRouteConfigMock.mockReset()
    getAdminRouteConfigMock.mockReturnValue({
        archiveEditPath: '/admin/archive/:id/edit',
        productionCreatePath: '/admin/archive/create',
    })
    vi.stubGlobal('confirm', confirmMock)
    confirmMock.mockReturnValue(true)
    window.history.replaceState(window.history.state, '', '/admin/productions')
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})


describe('ProductionsPage', () => {

    // Basisrendering
    it('renders the page heading and description', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        expect(screen.getByRole('heading', { name: 'Producties' })).toBeInTheDocument()
        expect(screen.getByText('Overzicht van alle gearchiveerde en actuele voorstellingen.')).toBeInTheDocument()
    })

    it('renders the search input and new-production button', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        expect(screen.getByPlaceholderText('Zoek op titel, artiest of genre...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Nieuwe Productie/i })).toBeInTheDocument()
    })

    // Data ophalen
    it('fetches productions on mount and renders them in the table', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([productionA, productionB]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('De Grote Voorstelling')).toBeInTheDocument()
            expect(screen.getByText('Kleine Voorstelling')).toBeInTheDocument()
        })
    })

    it('calls the correct API endpoint on mount', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/archive/productions'),
                expect.any(Object),
            )
        })
    })

    it('sends draft=false to exclude draft items', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('draft=false'),
                expect.any(Object),
            )
        })
    })

    it('shows empty state when API returns no items', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Geen producties gevonden.')).toBeInTheDocument()
        })
    })

    it('shows an error message when the API call fails', async () => {
        apiFetchMock.mockRejectedValue(new Error('Serverfout'))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Serverfout')).toBeInTheDocument()
        })
    })

    it('shows a fallback error message when the error has no message', async () => {
        apiFetchMock.mockRejectedValue('oops')

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Kon producties niet laden.')).toBeInTheDocument()
        })
    })

    // Zoekbalk
    it('does not include search param when the query is empty', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.not.stringContaining('search='),
                expect.any(Object),
            )
        })
    })

    it('includes search param after debounce when user types a query', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())
        apiFetchMock.mockClear()
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        fireEvent.change(screen.getByPlaceholderText('Zoek op titel, artiest of genre...'), {
            target: { value: 'snobs' },
        })

        await new Promise((resolve) => setTimeout(resolve, 320))

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('search=snobs'),
                expect.any(Object),
            )
        })
    })

    // Paginering
    it('renders pagination controls', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([], 25, 3))

        renderPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Vorige pagina' })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: 'Volgende pagina' })).toBeInTheDocument()
        })
    })

    it('"Vorige pagina" is disabled on page 1', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([], 25, 3))

        renderPage()

        await waitFor(() => {
            expect(screen.getByRole('button', { name: 'Vorige pagina' })).toBeDisabled()
        })
    })

    it('shows results count text when items are loaded', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([productionA, productionB], 2, 1))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText(/Toont 1–2 van 2 resultaten/)).toBeInTheDocument()
        })
    })

    it('does not show results count text when there are no items', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(screen.queryByText(/Toont/)).not.toBeInTheDocument()
        })
    })

    // Navigatie: bewerk
    it('navigates to the edit path when the edit button is clicked', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([productionA]))

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Bewerk' }))
        fireEvent.click(screen.getByRole('button', { name: 'Bewerk' }))

        expect(navigate).toHaveBeenCalledWith('/admin/archive/prod-1/edit')
    })

    it('navigates to the create path when "Nieuwe Productie" is clicked', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        fireEvent.click(screen.getByRole('button', { name: /Nieuwe Productie/i }))

        expect(navigate).toHaveBeenCalledWith('/admin/archive/create')
    })

    // Verwijderen
    it('asks for confirmation before deleting', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([productionA]))
        confirmMock.mockReturnValue(false)

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        expect(confirmMock).toHaveBeenCalledWith('Weet je zeker dat je deze productie wilt verwijderen?')
        expect(apiFetchMock).toHaveBeenCalledTimes(1) // alleen de initiële fetch, geen DELETE
    })

    it('calls the delete endpoint and reloads when confirmed', async () => {
        apiFetchMock
            .mockResolvedValueOnce(makePaginatedResponse([productionA])) // initiële fetch
            .mockResolvedValueOnce(undefined)                             // DELETE
            .mockResolvedValueOnce(makePaginatedResponse([]))             // herlaad

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/archive/productions/prod-1',
                expect.objectContaining({ method: 'DELETE' }),
            )
        })
    })

    it('shows an error when the delete request fails', async () => {
        apiFetchMock
            .mockResolvedValueOnce(makePaginatedResponse([productionA]))
            .mockRejectedValueOnce(new Error('Verwijderen mislukt'))

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        await waitFor(() => {
            expect(screen.getByText('Verwijderen mislukt. Probeer opnieuw.')).toBeInTheDocument()
        })
    })
})