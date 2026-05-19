import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BlogsPage from '../../../pages/public/BlogsPage.tsx'

const apiFetchMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/client', () => ({
    apiFetch: apiFetchMock,
    normalizeApiAssetUrl: (value: string | null | undefined) => value ?? undefined,
}))

Object.defineProperty(window, 'scrollTo', {
    value: vi.fn(),
    writable: true,
})

function buildPaginatedEmpty() {
    return {
        data: [],
        meta: {
            total: 0,
            page: 1,
            limit: 12,
            totalPages: 1,
        },
    }
}

function renderPage(path: string) {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="*" element={<BlogsPage />} />
            </Routes>
        </MemoryRouter>,
    )
}

describe('BlogsPage', () => {
    beforeEach(() => {
        apiFetchMock.mockReset()
        apiFetchMock.mockResolvedValue(buildPaginatedEmpty())
    })

    it('fetches blogs from blogs endpoint', async () => {
        renderPage('/nl/blogs?q=test')

        await waitFor(() => {
            expect(
                apiFetchMock.mock.calls.some(([endpoint]) =>
                    typeof endpoint === 'string' &&
                    endpoint.startsWith('/archive/blogs?') &&
                    endpoint.includes('search=test'),
                ),
            ).toBe(true)
        })
    })

    it('renders a blog card from search results', async () => {
        apiFetchMock.mockResolvedValue({
            data: [
                {
                    id: '11111111-1111-1111-1111-111111111111',
                    title: { nl: 'Nieuwe Blogtitel' },
                    content: { nl: '<p>Dit is een korte blogbeschrijving.</p>' },
                    images: ['/api/v1/images/test-image'],
                    thumbnail_index: 0,
                    created_at: '2026-05-18T00:00:00.000Z',
                },
            ],
            meta: {
                total: 1,
                page: 1,
                limit: 12,
                totalPages: 1,
            },
        })

        renderPage('/nl/blogs')

        expect(await screen.findByRole('link', { name: /Nieuwe Blogtitel/i })).toBeInTheDocument()
        expect(screen.getByText(/Dit is een korte blogbeschrijving\./i)).toBeInTheDocument()
    })

    it('shows no-results state', async () => {
        renderPage('/nl/blogs')

        expect(await screen.findByText('Geen resultaten gevonden.')).toBeInTheDocument()
    })

    it('submitting search triggers a new request with search param', async () => {
        renderPage('/nl/blogs')
        await screen.findByText('Geen resultaten gevonden.')

        const input = screen.getByPlaceholderText('Zoek blogs...')
        fireEvent.change(input, { target: { value: 'banner' } })
        fireEvent.submit(input.closest('form') as HTMLFormElement)

        await waitFor(() => {
            expect(
                apiFetchMock.mock.calls.some(([endpoint]) =>
                    typeof endpoint === 'string' &&
                    endpoint.startsWith('/archive/blogs?') &&
                    endpoint.includes('search=banner'),
                ),
            ).toBe(true)
        })
    })
})
