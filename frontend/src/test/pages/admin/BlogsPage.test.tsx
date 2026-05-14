import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import BlogsPage from '../../../pages/admin/BlogsPage'


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
            tableColDate: 'Datum',
            tableColActions: 'Acties',
            actionEdit: 'Bewerk',
            actionDelete: 'Verwijder',
            emptyRecent: 'Geen blogs gevonden.',
        },
        blogsPage: {
            pageTitle: 'Blogs',
            pageSubtitle: 'Overzicht van alle blogberichten.',
            searchPlaceholder: 'Zoek op titel...',
            newButton: 'Nieuwe Blog',
            deleteError: 'Verwijderen mislukt. Probeer opnieuw.',
            loadError: 'Kon blogs niet laden.',
            paginationShowing: (from: number, to: number, total: number) => `Toont ${from}–${to} van ${total} resultaten`,
            paginationPageLabel: (page: number) => `Pagina ${page}`,
            tableColLinkedProductions: 'Gekoppelde producties'
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

const blogA = {
    id: 'blog-1',
    title: { nl: 'Eerste Blog', en: null, fr: null },
    productions: ['prod-1', 'prod-2'],
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
}

const blogB = {
    id: 'blog-2',
    title: { nl: null, en: 'Second Blog', fr: null },
    productions: [],
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2024-04-02T08:00:00Z',
}

const blogWithoutTitle = {
    id: 'blog-3',
    title: null,
    productions: ['prod-1'],
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
}

function renderPage() {
    return render(
        <MemoryRouter>
            <BlogsPage />
        </MemoryRouter>,
    )
}


beforeEach(() => {
    navigate.mockReset()
    apiFetchMock.mockReset()
    getAdminRouteConfigMock.mockReset()
    getAdminRouteConfigMock.mockReturnValue({
        blogCreatePath: '/admin/blogs/new',
        blogEditPath: '/admin/blogs/:id/edit',
    })
    vi.stubGlobal('confirm', confirmMock)
    confirmMock.mockReturnValue(true)
    window.history.replaceState(window.history.state, '', '/admin/blogs')
})

afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
})


describe('BlogsPage', () => {

    // Basisrendering
    it('renders the page heading and description', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        expect(screen.getByRole('heading', { name: 'Blogs' })).toBeInTheDocument()
        expect(screen.getByText('Overzicht van alle blogberichten.')).toBeInTheDocument()
    })

    it('renders the search input and new-blog button', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        expect(screen.getByPlaceholderText('Zoek op titel...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Nieuwe Blog/i })).toBeInTheDocument()
    })

    it('does not render a tab bar (blogs have no status filter)', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        expect(screen.queryByRole('tab')).not.toBeInTheDocument()
        expect(screen.queryByText('Gepubliceerd')).not.toBeInTheDocument()
        expect(screen.queryByText('Concepten')).not.toBeInTheDocument()
    })

    // Data ophalen
    it('fetches blogs on mount and renders them in the table', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogA, blogB]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Eerste Blog')).toBeInTheDocument()
            expect(screen.getByText('Second Blog')).toBeInTheDocument()
        })
    })

    it('calls the correct API endpoint on mount', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('/archive/blogs'),
                expect.any(Object),
            )
        })
    })

    it('falls back to NL title when EN title is present but NL is null', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogB]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Second Blog')).toBeInTheDocument()
        })
    })

    it('shows "(Zonder titel)" when title is null', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogWithoutTitle]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('(Zonder titel)')).toBeInTheDocument()
        })
    })

    it('shows empty state when API returns no items', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        await waitFor(() => {
            expect(screen.getByText('Geen blogs gevonden.')).toBeInTheDocument()
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
            expect(screen.getByText('Onbekende fout')).toBeInTheDocument()
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

        fireEvent.change(screen.getByPlaceholderText('Zoek op titel...'), {
            target: { value: 'festival' },
        })

        await new Promise((resolve) => setTimeout(resolve, 320))

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('search=festival'),
                expect.any(Object),
            )
        })
    })

    it('resets to page 1 when the search query changes', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([], 25, 3))

        renderPage()

        await waitFor(() => expect(apiFetchMock).toHaveBeenCalled())

        fireEvent.click(await screen.findByRole('button', { name: 'Pagina 2' }))
        await waitFor(() =>
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('page=2'),
                expect.any(Object),
            ),
        )

        apiFetchMock.mockClear()
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        fireEvent.change(screen.getByPlaceholderText('Zoek op titel...'), {
            target: { value: 'nieuw' },
        })
        await new Promise((resolve) => setTimeout(resolve, 320))

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                expect.stringContaining('page=1'),
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
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogA, blogB], 2, 1))

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

    // Navigatie
    it('navigates to the edit path when the edit button is clicked', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogA]))

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Bewerk' }))
        fireEvent.click(screen.getByRole('button', { name: 'Bewerk' }))

        expect(navigate).toHaveBeenCalledWith('/admin/blogs/blog-1/edit')
    })

    it('navigates to the create path when "Nieuwe Blog" is clicked', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([]))

        renderPage()

        fireEvent.click(screen.getByRole('button', { name: /Nieuwe Blog/i }))

        expect(navigate).toHaveBeenCalledWith('/admin/blogs/new')
    })

    // Verwijderen
    it('asks for confirmation before deleting', async () => {
        apiFetchMock.mockResolvedValue(makePaginatedResponse([blogA]))
        confirmMock.mockReturnValue(false)

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        expect(confirmMock).toHaveBeenCalledWith('Weet je zeker dat je deze blog wilt verwijderen?')
        expect(apiFetchMock).toHaveBeenCalledTimes(1) // alleen de initiële fetch, geen DELETE
    })

    it('calls the delete endpoint and reloads when confirmed', async () => {
        apiFetchMock
            .mockResolvedValueOnce(makePaginatedResponse([blogA])) // initiële fetch
            .mockResolvedValueOnce(undefined)                       // DELETE
            .mockResolvedValueOnce(makePaginatedResponse([]))       // herlaad

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        await waitFor(() => {
            expect(apiFetchMock).toHaveBeenCalledWith(
                '/archive/blogs/blog-1',
                expect.objectContaining({ method: 'DELETE' }),
            )
        })
    })

    it('shows an error when the delete request fails', async () => {
        apiFetchMock
            .mockResolvedValueOnce(makePaginatedResponse([blogA]))
            .mockRejectedValueOnce(new Error('DELETE mislukt'))

        renderPage()

        await waitFor(() => screen.getByRole('button', { name: 'Verwijder' }))
        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))

        await waitFor(() => {
            expect(screen.getByText('Verwijderen mislukt. Probeer opnieuw.')).toBeInTheDocument()
        })
    })
})