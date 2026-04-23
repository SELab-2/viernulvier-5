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
        search: { shareLabel: 'Deel', shareCopiedLabel: 'Gekopieerd naar klembord' },
        detail: {
            navBack: 'Terug',
            dates: 'Speeldata',
            events: 'Speeldata',
            date: 'Datum',
            time: 'Uur',
            location: 'Locatie',
            remark: 'Opmerking',
            noEvents: 'Geen voorstellingen gevonden.',
            loadError: 'Kon de productie niet laden.',
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

vi.mock('../../../components/public/PublicPillButton', () => ({
    default: ({ label, onClick }: { label: string; onClick: () => void }) => (
        <button type="button" onClick={onClick}>{label}</button>
    ),
}))

const getProductionByIdMock = vi.hoisted(() => vi.fn())
const getEventsByProductionIdMock = vi.hoisted(() => vi.fn())
const getGenresByProductionIdMock = vi.hoisted(() => vi.fn())
const getTagsByProductionIdMock = vi.hoisted(() => vi.fn())
const getGalleryItemsMock = vi.hoisted(() => vi.fn())
const getItemCropsMock = vi.hoisted(() => vi.fn())
const getHallByIdMock = vi.hoisted(() => vi.fn())
const getSpaceByIdMock = vi.hoisted(() => vi.fn())
const getLocationByIdMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/productions', () => ({ getProductionById: getProductionByIdMock }))
vi.mock('../../../api/events', () => ({ getEventsByProductionId: getEventsByProductionIdMock }))
vi.mock('../../../api/genres', () => ({ getGenresByProductionId: getGenresByProductionIdMock}))
vi.mock('../../../api/tags', () => ({ getTagsByProductionId: getTagsByProductionIdMock}))
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
        getGenresByProductionIdMock.mockResolvedValue({
            data: [
                {
                    id: '1',
                    type: 'theater',
                    name: { nl: 'Concert', en: 'Concert' },
                    slug: { nl: 'muziek', en: 'music' },
                },
            ],
        })

        getTagsByProductionIdMock.mockResolvedValue({
            data: [
                {
                    id: '2',
                    type: 'theater',
                    name: { nl: 'in De Vooruit', en: 'at De Vooruit' },
                    slug: { nl: 'invooruit', en: 'invooruit' },
                },
            ],
        })
        getGalleryItemsMock.mockResolvedValue({ data: [] })
        getItemCropsMock.mockResolvedValue({ data: [] })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('renders the back button', async () => {
        renderPage()

        expect(await screen.findByText('Terug')).toBeInTheDocument()
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

    it('renders genre pills in the hero when a gallery image is available', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: {
                ...baseProduction,
            },
        })
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

        expect((await screen.findAllByText('Concert')).length).toBeGreaterThan(0)
        expect((await screen.findAllByText('in De Vooruit')).length).toBeGreaterThan(0)
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

        const backButton = await screen.findByText('Terug')
        fireEvent.click(backButton)

        expect(navigate).toHaveBeenCalledWith(-1)
    })

    it('navigates to home when there is no history', async () => {
        vi.stubGlobal('history', { ...window.history, length: 1 })

        renderPage()

        const backButton = await screen.findByText('Terug')
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

    it('shows only past events', async () => {
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

        await waitFor(() => {
            expect(screen.getByText(/2020/)).toBeInTheDocument()
        })

        expect(screen.queryByText(/2099/)).not.toBeInTheDocument()
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

    // ---- location chain catch ----
    it('renders remaining events when one location chain fetch fails', async () => {
        const event1 = {
            id: 'evt-0000-0000-0000-000000000001',
            starts_at: new Date('2020-01-01T13:00:00.000Z'),
            ends_at: null,
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: 'hall-000-0000-0000-000000000001',
        }

        getEventsByProductionIdMock.mockResolvedValue({ data: [event1] })
        getHallByIdMock.mockRejectedValue(new Error('Network error'))

        renderPage()

        // Page should not crash, events section should still render
        expect(await screen.findByText('Speeldata')).toBeInTheDocument()
    })

    it('resolves location when hall has no space_id', async () => {
        const event = {
            id: 'evt-0000-0000-0000-000000000001',
            starts_at: new Date('2020-01-01T13:00:00.000Z'),
            ends_at: null,
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: 'hall-000-0000-0000-000000000001',
        }

        getEventsByProductionIdMock.mockResolvedValue({ data: [event] })
        getHallByIdMock.mockResolvedValue({ data: { id: 'hall-000-0000-0000-000000000001', name: null, space_id: null } })

        renderPage()

        // Should not crash, and location chain stops at hall — dash shown
        await waitFor(() => {
            expect(screen.getAllByText('—').length).toBeGreaterThan(0)
        })
    })

    it('resolves location when space has no location_id', async () => {
        const event = {
            id: 'evt-0000-0000-0000-000000000001',
            starts_at: new Date('2020-01-01T13:00:00.000Z'),
            ends_at: null,
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: 'hall-000-0000-0000-000000000001',
        }

        getEventsByProductionIdMock.mockResolvedValue({ data: [event] })
        getHallByIdMock.mockResolvedValue({ data: { id: 'hall-000-0000-0000-000000000001', name: null, space_id: 'space-00-0000-0000-000000000001' } })
        getSpaceByIdMock.mockResolvedValue({ data: { id: 'space-00-0000-0000-000000000001', location_id: null } })

        renderPage()

        await waitFor(() => {
            expect(screen.getAllByText('—').length).toBeGreaterThan(0)
        })
    })

    it('renders the location city when the full chain resolves', async () => {
        const event = {
            id: 'evt-0000-0000-0000-000000000001',
            starts_at: new Date('2020-01-01T13:00:00.000Z'),
            ends_at: null,
            doors_at: null,
            info: null,
            production_id: baseProduction.id,
            hall_id: 'hall-000-0000-0000-000000000001',
        }

        getEventsByProductionIdMock.mockResolvedValue({ data: [event] })
        getHallByIdMock.mockResolvedValue({ data: { id: 'hall-000-0000-0000-000000000001', name: null, space_id: 'space-00-0000-0000-000000000001' } })
        getSpaceByIdMock.mockResolvedValue({ data: { id: 'space-00-0000-0000-000000000001', location_id: 'loc-0000-0000-0000-000000000001' } })
        getLocationByIdMock.mockResolvedValue({ data: { id: 'loc-0000-0000-0000-000000000001', name: null, street: 'Kerkstraat', number: '1', postal_code: '9000', city: 'Gent', country: 'BE' } })

        renderPage()

        expect(await screen.findByText('Kerkstraat 1, 9000 Gent')).toBeInTheDocument()
    })

    // ---- videos ----
    it('renders a single video in a wide container', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, video_1: { nl: 'https://www.youtube.com/watch?v=abc123' }, video_2: null },
        })

        renderPage()

        await waitFor(() => {
            const iframe = document.querySelector('iframe')
            expect(iframe).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123')
            expect(iframe).toHaveAttribute('title', 'Video 1')
            // single video gets the wide container
            const container = iframe?.closest('.max-w-3xl')
            expect(container).toBeInTheDocument()
        })
    })

    it('renders two videos in a two-column grid', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: {
                ...baseProduction,
                video_1: { nl: 'https://www.youtube.com/watch?v=abc123' },
                video_2: { nl: 'https://youtu.be/def456' },
            },
        })

        renderPage()

        await waitFor(() => {
            const iframes = document.querySelectorAll('iframe')
            expect(iframes).toHaveLength(2)
            expect(iframes[0]).toHaveAttribute('src', 'https://www.youtube.com/embed/abc123')
            expect(iframes[1]).toHaveAttribute('src', 'https://www.youtube.com/embed/def456')
            const container = iframes[0]?.closest('.max-w-5xl')
            expect(container).toBeInTheDocument()
        })
    })

    it('does not render any iframes when there are no valid video urls', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, video_1: null, video_2: null },
        })

        renderPage()

        await waitFor(() => {
            expect(document.querySelector('iframe')).not.toBeInTheDocument()
        })
    })

    it('does not render an iframe for an unrecognised video url', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, video_1: { nl: 'https://vimeo.com/123456' }, video_2: null },
        })

        renderPage()

        await waitFor(() => {
            expect(document.querySelector('iframe')).not.toBeInTheDocument()
        })
    })

    // ---- quote ----
    it('renders the quote and its source', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: {
                ...baseProduction,
                quote: { nl: 'Een prachtige voorstelling.' },
                quote_source: { nl: 'De Standaard' },
            },
        })

        renderPage()

        expect(await screen.findByText('Een prachtige voorstelling.')).toBeInTheDocument()
        expect(await screen.findByText('— De Standaard')).toBeInTheDocument()
    })

    it('renders a quote without a source', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: {
                ...baseProduction,
                quote: { nl: 'Een prachtige voorstelling.' },
                quote_source: null,
            },
        })

        renderPage()

        expect(await screen.findByText('Een prachtige voorstelling.')).toBeInTheDocument()
        expect(screen.queryByText(/^—/)).not.toBeInTheDocument()
    })

    // ---- description2 ----
    it('renders description_2 when present', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, description_2: { nl: 'Extra beschrijving.' } },
        })

        renderPage()

        expect(await screen.findByText('Extra beschrijving.')).toBeInTheDocument()
    })

    // ---- info / credits ----
    it('renders the credits section with the info content', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, info: { nl: 'Regie: Jan Janssen' } },
        })

        renderPage()

        expect(await screen.findByText('Speeldata')).toBeInTheDocument() // wait for load
        expect(screen.getByText('Credits')).toBeInTheDocument()
        expect(screen.getByText('Regie: Jan Janssen')).toBeInTheDocument()
    })

    it('does not render the credits section when info is null', async () => {
        getProductionByIdMock.mockResolvedValue({
            data: { ...baseProduction, info: null },
        })

        renderPage()

        await waitFor(() => {
            expect(screen.queryByText('Credits')).not.toBeInTheDocument()
        })
    })
})