import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ArchiveDetailPage from '../../../pages/public/ArchiveDetailPage'

const navigate = vi.fn()
const getActiveLocaleMock = vi.hoisted(() => vi.fn())

/**
 * -----------------------------
 * Router mocks
 * -----------------------------
 */
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => navigate,
        useParams: () => ({ id: 'dab70000-0000-0000-0000-000000000001' }),
    }
})

/**
 * -----------------------------
 * i18n mock
 * -----------------------------
 */
vi.mock('../../../i18n', () => ({
    getActiveLocale: getActiveLocaleMock,
    setActiveLocale: vi.fn(),
    withLocalePath: (path: string) => path,
}))

/**
 * -----------------------------
 * Public messages mock (IMPORTANT FIX)
 * -----------------------------
 */
vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicMessages: () => ({
        search: {
            shareLabel: 'Deel',
            shareCopiedLabel: 'Gekopieerd naar klembord',
        },
        detail: {
            navBack: 'Terug',
            events: 'Speeldata',
            credits: 'Credits',
            loadError: 'Kon de productie niet laden.',
        },
    }),
}))

/**
 * -----------------------------
 * UI component mocks
 * -----------------------------
 */
vi.mock('../../../components/public/PublicPillButton', () => ({
    default: ({ label, onClick }: { label: string; onClick: () => void }) => (
        <button type="button" onClick={onClick}>{label}</button>
    ),
}))

/**
 * -----------------------------
 * API mocks
 * -----------------------------
 */
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
vi.mock('../../../api/genres', () => ({ getGenresByProductionId: getGenresByProductionIdMock }))
vi.mock('../../../api/tags', () => ({ getTagsByProductionId: getTagsByProductionIdMock }))
vi.mock('../../../api/media', () => ({
    getGalleryItems: getGalleryItemsMock,
    getItemCrops: getItemCropsMock,
    getPreferredCropUrl: (crops: { name: string; url: string }[]) =>
        crops.find((c) => c.name === 'banner')?.url ?? null,
}))
vi.mock('../../../api/halls', () => ({ getHallById: getHallByIdMock }))
vi.mock('../../../api/spaces', () => ({ getSpaceById: getSpaceByIdMock }))
vi.mock('../../../api/locations', () => ({ getLocationById: getLocationByIdMock }))

/**
 * -----------------------------
 * Base data
 * -----------------------------
 */
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
    teaser: { nl: '<p>Teaser tekst</p>' },
    description: { nl: '<p>Beschrijving</p>' },
    video_1: null,
    video_2: null,
    quote: null,
    quote_source: null,
    info: null,
    media_gallery_id: 'e9e00000-0000-0000-0000-000000000001',
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

/**
 * -----------------------------
 * Tests
 * -----------------------------
 */
describe('ArchiveDetailPage', () => {
    beforeEach(() => {
        navigate.mockReset()
        getActiveLocaleMock.mockReturnValue('nl')

        getProductionByIdMock.mockResolvedValue({ data: baseProduction })
        getEventsByProductionIdMock.mockResolvedValue({ data: [] })
        getGenresByProductionIdMock.mockResolvedValue({ data: [] })
        getTagsByProductionIdMock.mockResolvedValue({ data: [] })
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

    it('renders the events section heading', async () => {
        renderPage()
        expect(await screen.findByText('Speeldata')).toBeInTheDocument()
    })

    it('navigates back when history exists', async () => {
        vi.stubGlobal('history', { ...window.history, length: 5 })

        renderPage()
        fireEvent.click(await screen.findByText('Terug'))

        expect(navigate).toHaveBeenCalledWith(-1)
    })

    it('navigates home when no history', async () => {
        vi.stubGlobal('history', { ...window.history, length: 1 })

        renderPage()
        fireEvent.click(await screen.findByText('Terug'))

        expect(navigate).toHaveBeenCalledWith('/')
    })

    it('fetches production and events', async () => {
        renderPage()

        await waitFor(() => {
            expect(getProductionByIdMock).toHaveBeenCalled()
            expect(getEventsByProductionIdMock).toHaveBeenCalled()
        })
    })

    it('logs error on failure', async () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
        getProductionByIdMock.mockRejectedValue(new Error('fail'))

        renderPage()

        await waitFor(() => {
            expect(spy).toHaveBeenCalled()
        })

        spy.mockRestore()
    })
})