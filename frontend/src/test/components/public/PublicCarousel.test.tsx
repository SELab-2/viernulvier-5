import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import PublicCarousel from '../../../components/public/PublicCarousel'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const apiFetchMock = vi.hoisted(() => vi.fn())
const getActiveLocaleMock = vi.hoisted(() => vi.fn<() => 'nl' | 'en'>())

vi.mock('../../../api/client', () => ({
    apiFetch: apiFetchMock,
    normalizeApiAssetUrl: (url: string | null | undefined) => url ?? null,
}))

vi.mock('../../../i18n', () => ({
    getActiveLocale: getActiveLocaleMock,
    withLocalePath: (path: string) => path,
    setActiveLocale: vi.fn(),
}))

vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicMessages: () => ({
        common: { loading: 'Laden...', brandName: 'VIERNULVIER', brandLogoAlt: 'VIERNULVIER logo' },
        home: {
            onThisDayHeading: 'Op deze dag',
            onThisDaySubheading: 'Van dit jaar in het archief',
            onThisDayViewAll: 'Bekijk alles',
            onThisDayFallbackHeading: 'Recent uit het archief',
            onThisDayFallbackSubheading: 'Geen matches voor deze datum.',
            onThisDayEmpty: 'Geen resultaten',
        },
        search: {
            fallbackUntitled: 'Zonder titel',
            fallbackTag: 'productie',
            fallbackVenue: 'Locatie niet bekend',
            genres: ['theater', 'dans', 'concert', 'nightlife', 'talks', 'comedy', 'monument', 'circus', 'performance', 'spoken word', 'listening session'],
        },
    }),
}))

vi.mock('../../../components/public/SectionTitle', () => ({
    default: ({ title }: { title: string }) => <h2 data-testid="section-title">{title}</h2>,
}))

vi.mock('../../../components/public/search/SearchResultCard', () => ({
    default: ({ item }: { item: { id: string; title: string } }) => (
        <div data-testid={`carousel-card-${item.id}`}>{item.title}</div>
    ),
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const makeProductionItem = (id: string, title: string) => ({
    id,
    title: { nl: title, en: null, fr: null },
    teaser: null,
    description_short: null,
    description: null,
    created_at: '2024-03-15T12:00:00.000Z',
    performer_type: null,
    attendance_mode: null,
    image_url: null,
    links: null,
})

const otdResponse = {
    data: [makeProductionItem('prod-1', 'Nacht van de Kunst'), makeProductionItem('prod-2', 'Jazz in de Zaal')],
    meta: { total: 2, page: 1, limit: 12, totalPages: 1 },
}

const emptyResponse = { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } }

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderCarousel() {
    return render(
        <MemoryRouter initialEntries={['/nl']}>
            <PublicCarousel />
        </MemoryRouter>
    )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PublicCarousel', () => {
    beforeEach(() => {
        getActiveLocaleMock.mockReturnValue('nl')
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('renders the "on this day" section heading when OTD results are found', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        expect(await screen.findByTestId('section-title')).toHaveTextContent('Op deze dag')
    })

    it('renders a carousel card for each returned production', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        expect(await screen.findByTestId('carousel-card-prod-1')).toBeInTheDocument()
        expect(screen.getByTestId('carousel-card-prod-2')).toBeInTheDocument()
    })

    it('renders the production title in each card', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        expect(await screen.findByText('Nacht van de Kunst')).toBeInTheDocument()
        expect(screen.getByText('Jazz in de Zaal')).toBeInTheDocument()
    })

    it('switches to fallback-recent heading when OTD returns empty results', async () => {
        apiFetchMock
            .mockResolvedValueOnce(emptyResponse)          // OTD call → empty
            .mockResolvedValue(otdResponse)                 // fallback call → items

        renderCarousel()
        expect(await screen.findByTestId('section-title')).toHaveTextContent('Recent uit het archief')
    })

    it('renders scroll left and right buttons', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        // Wait for items to render, then check scroll buttons
        await screen.findByTestId('carousel-card-prod-1')
        const buttons = screen.getAllByRole('button')
        // Scroll buttons render with ‹ and › characters
        const scrollButtons = buttons.filter((btn) => ['‹', '›'].includes(btn.textContent ?? ''))
        expect(scrollButtons).toHaveLength(2)
    })

    it('renders the "view all" link', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        await screen.findByTestId('section-title')
        expect(screen.getByRole('link', { name: /Bekijk alles/i })).toBeInTheDocument()
    })

    it('shows no cards when the API fails', async () => {
        apiFetchMock.mockRejectedValue(new Error('network error'))
        renderCarousel()
        await waitFor(() => {
            expect(screen.queryByTestId('carousel-card-prod-1')).not.toBeInTheDocument()
        })
    })

    it('shows no cards when both OTD and fallback return empty', async () => {
        apiFetchMock.mockResolvedValue(emptyResponse)
        renderCarousel()
        await waitFor(() => {
            expect(screen.queryByTestId(/^carousel-card-/)).not.toBeInTheDocument()
        })
    })

    it('calls apiFetch with the correct locale', async () => {
        apiFetchMock.mockResolvedValue(otdResponse)
        renderCarousel()
        await screen.findByTestId('carousel-card-prod-1')
        const [firstCallUrl] = apiFetchMock.mock.calls[0] as [string, ...unknown[]]
        expect(firstCallUrl).toContain('lang=nl')
    })
})
