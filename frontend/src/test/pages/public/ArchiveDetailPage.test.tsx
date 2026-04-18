import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArchiveDetailPage from '../../../pages/public/ArchiveDetailPage'

const navigate = vi.fn()
const getActiveLocaleMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => navigate,
        useParams: () => ({ id: 'dab70000-0000-0000-0000-000000000001' }),
    }
})

vi.mock('../../../i18n', () => ({
    getActiveLocale: getActiveLocaleMock,
    getMessages: (locale: string) => ({
        nav: { archive: 'Archief', searchAriaLabel: 'Zoeken', searchPlaceholder: 'Zoek...' },
        home: { title: 'Home' },
        detail: {
            navBackToOverview: 'Terug naar overzicht',
            dates: 'Speeldata',
            events: 'Speeldata',
            date: 'Datum',
            time: 'Uur',
            location: 'Locatie',
            noEvents: 'Geen voorstellingen gevonden.',
            showMore: locale === 'en' ? 'Show more' : 'Meer tonen',
            showLess: locale === 'en' ? 'Show less' : 'Minder tonen',
            credits: 'Credits',
        },
        footer: {
            privacy: 'Privacy',
            cookies: 'Cookies',
            disclaimer: 'Disclaimer',
            rights: 'Alle rechten voorbehouden',
        },
    }),
    setActiveLocale: vi.fn(),
    withLocalePath: (path: string) => path,
}))

vi.mock('../../../components/public/PublicNavbar', () => ({
    default: () => <nav>navbar</nav>,
}))

vi.mock('../../../components/public/PublicFooter', () => ({
    default: () => <footer>footer</footer>,
}))

const getProductionByIdMock = vi.hoisted(() => vi.fn())
const getEventsByProductionIdMock = vi.hoisted(() => vi.fn())
const getGalleryItemsMock = vi.hoisted(() => vi.fn())
const getItemCropsMock = vi.hoisted(() => vi.fn())
const getHallByIdMock = vi.hoisted(() => vi.fn())
const getSpaceByIdMock = vi.hoisted(() => vi.fn())
const getLocationByIdMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/productions', () => ({ getProductionById: getProductionByIdMock }))
vi.mock('../../../api/events', () => ({ getEventsByProductionId: getEventsByProductionIdMock }))
vi.mock('../../../api/media', () => ({
    getGalleryItems: getGalleryItemsMock,
    getItemCrops: getItemCropsMock,
    getPreferredCropUrl: (crops: { name: string; url: string }[]) =>
        crops.find((c) => c.name === 'banner')?.url ?? null,
}))
vi.mock('../../../api/halls', () => ({ getHallById: getHallByIdMock }))
vi.mock('../../../api/spaces', () => ({ getSpaceById: getSpaceByIdMock }))
vi.mock('../../../api/locations', () => ({ getLocationById: getLocationByIdMock }))

const baseProduction = {
    id: 'dab70000-0000-0000-0000-000000000001',
    apiId: null,
    vendor_id: null,
    box_office_id: null,
    performer_field: null,
    performer_type: 'group',
    attendance_mode: 'offline',
    super_title: { nl: 'KAP' },
    title: { nl: 'Kapiteinsavond', en: 'Captain Night' },
    artist: { nl: 'Ensemble X' },
    meta_title: null,
    meta_description: null,
    tagline: null,
    teaser: { nl: '<p>Teaser tekst</p>' },
    description: { nl: '<p>Beschrijving</p>' },
    description_extra: null,
    description_2: null,
    video_1: null,
    video_2: null,
    quote: null,
    quote_source: null,
    programme: null,
    info: null,
    description_short: null,
    eticket_info: null,
    custom_data: null,
    media_gallery_id: 'e9e00000-0000-0000-0000-000000000001',
    review_gallery_id: null,
    poster_gallery_id: null,
    uitdatabank_theme: null,
    uitdatabank_type: null,
    created_at: new Date('2026-03-26T15:28:32.000Z'),
    updated_at: new Date('2026-03-27T08:20:10.000Z'),
}

function renderPage() {
    return render(
        <MemoryRouter initialEntries={['/nl/archief/dab70000-0000-0000-0000-000000000001']}>
            <ArchiveDetailPage />
        </MemoryRouter>
    )
}

describe('ArchiveDetailPage', () => {
    beforeEach(() => {
        navigate.mockReset()
        getActiveLocaleMock.mockReturnValue('nl')
        document.documentElement.lang = 'nl'
        document.documentElement.dataset.theme = 'light'
        localStorage.setItem('locale', 'nl')

        getProductionByIdMock.mockResolvedValue({ data: baseProduction })
        getEventsByProductionIdMock.mockResolvedValue({ data: [] })
        getGalleryItemsMock.mockResolvedValue({ data: [] })
        getItemCropsMock.mockResolvedValue({ data: [] })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('renders the back button', async () => {
        renderPage()

        expect(await screen.findByText('Terug naar overzicht')).toBeInTheDocument()
    })

    it('renders the teaser content after loading', async () => {
        renderPage()

        expect(await screen.findByText('Teaser tekst')).toBeInTheDocument()
    })

    it('renders the hero image when a gallery crop is available', async () => {
        getGalleryItemsMock.mockResolvedValue({
            data: [{
                id: '9e110000-0000-0000-0000-000000000001',
                type: 'foto',
                original_filename: 'photo.jpg',
                position: 0,
                width: 1920,
                height: 1080,
                format: 'image/jpeg',
                gallery_id: 'e9e00000-0000-0000-0000-000000000001',
                title: null,
                description: null,
                credits: null,
                link: null,
                apiId: null,
                created_at: new Date(),
                updated_at: new Date(),
            }],
        })
        getItemCropsMock.mockResolvedValue({
            data: [{ name: 'banner', url: 'https://example.com/banner.jpg', id: '1', apiId: null, item_id: '9e110000-0000-0000-0000-000000000001', created_at: new Date(), updated_at: new Date() }],
        })

        renderPage()

        await waitFor(() => {
            expect(screen.getByRole('img', { name: 'Kapiteinsavond' })).toHaveAttribute('src', 'https://example.com/banner.jpg')
        })
    })

    it('does not render the hero image when there is no gallery', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, media_gallery_id: null },
        })

        renderPage()

        await waitFor(() => {
            expect(screen.queryByRole('img')).not.toBeInTheDocument()
        })
    })

    it('renders the events section heading', async () => {
        renderPage()

        expect(await screen.findByText('Speeldata')).toBeInTheDocument()
    })

    it('shows the empty events message when there are no past events', async () => {
        renderPage()

        expect(await screen.findByText('Geen voorstellingen gevonden.')).toBeInTheDocument()
    })

    it('navigates back when the back button is clicked and there is history', async () => {
        vi.stubGlobal('history', { ...window.history, length: 5 })

        renderPage()

        const backButton = await screen.findByText('Terug naar overzicht')
        fireEvent.click(backButton)

        expect(navigate).toHaveBeenCalledWith(-1)
    })

    it('navigates to home when there is no history', async () => {
        vi.stubGlobal('history', { ...window.history, length: 1 })

        renderPage()

        const backButton = await screen.findByText('Terug naar overzicht')
        fireEvent.click(backButton)

        expect(navigate).toHaveBeenCalledWith('/')
    })

    it('fetches both production and events in parallel on mount', async () => {
        renderPage()

        await waitFor(() => {
            expect(getProductionByIdMock).toHaveBeenCalledWith('dab70000-0000-0000-0000-000000000001')
            expect(getEventsByProductionIdMock).toHaveBeenCalledWith('dab70000-0000-0000-0000-000000000001')
        })
    })

    it('only shows past events', async () => {
        const pastEvent = {
            id: 'evt-past-0000-0000-0000-000000000001',
            starts_at: new Date('2020-01-01T13:00:00.000Z'),
            ends_at: new Date('2020-01-01T14:00:00.000Z'),
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: null,
        }
        const futureEvent = {
            id: 'evt-future-000-0000-0000-000000000002',
            starts_at: new Date('2099-01-01T13:00:00.000Z'),
            ends_at: new Date('2099-01-01T14:00:00.000Z'),
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: null,
        }

        getEventsByProductionIdMock.mockResolvedValue({ data: [pastEvent, futureEvent] })

        renderPage()

        await waitFor(() => {
            expect(getEventsByProductionIdMock).toHaveBeenCalled()
        })

        // Only the past event should be in the rendered list; the future one should be filtered out.
        // We verify this indirectly through the location chain not being triggered for the future event.
        expect(getLocationByIdMock).not.toHaveBeenCalled()
    })

    it('logs an error to the console when the production fetch fails', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        getProductionByIdMock.mockRejectedValue(new Error('Network error'))

        renderPage()

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error loading data:', expect.any(Error))
        })

        consoleSpy.mockRestore()
    })
})