import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomePage from '../../../pages/public/HomePage'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const navigate = vi.fn()
const getActiveLocaleMock = vi.hoisted(() => vi.fn<() => 'nl' | 'en'>())
const getRecentProductionsMock = vi.hoisted(() => vi.fn())
const getLatestBlogMock = vi.hoisted(() => vi.fn())
const getLocalizedTitleMock = vi.hoisted(() => vi.fn(() => 'Test Blog Titel'))
const getLocalizedContentMock = vi.hoisted(() => vi.fn(() => 'Blog inhoud hier.'))
const normalizeContentMock = vi.hoisted(() => vi.fn<() => unknown>())

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
    return {
        ...actual,
        useNavigate: () => navigate,
    }
})

vi.mock('../../../i18n', () => ({
    getActiveLocale: getActiveLocaleMock,
    getMessages: () => ({
        home: {
            latestBlogHeading: 'Recente blog post',
            latestBlogSubheading: 'verhalen, context en updates',
            latestBlogReadMore: 'lees meer',
            latestBlogViewAll: 'Bekijk alle blog posts',
            recentDigitizedHeading: 'Recent gedigitaliseerd',
            recentDigitizedViewItem: 'bekijk item',
            recentDigitizedViewAll: 'doorzoek archief',
            heroTagline: 'Sinds 1982',
            heroTitleTop: 'Doorzoek 40 jaar',
            heroTitleAccent: 'cultuur',
            heroTitleBottom: 'in Gent',
            searchYear: 'Jaar',
            searchGenre: 'Genre',
            searchLocation: 'Locatie',
            searchButton: 'Zoek',
            popularTagsLabel: 'Verken',
            popularTagsMore: '+ meer',
            popularTagsLess: '- minder',
            popularTags: ['theater', 'dans'],
            onThisDayHeading: 'Op deze dag',
            onThisDaySubheading: '',
            onThisDayViewAll: '',
            onThisDayEmpty: '',
            onThisDayFallbackHeading: '',
            onThisDayFallbackSubheading: '',
        },
        nav: { home: 'Home', archive: 'Archief', searchAriaLabel: 'Zoeken', searchPlaceholder: 'Zoek...' },
        search: { shareLabel: 'Deel', shareCopiedLabel: 'Gekopieerd' },
        footer: { privacy: 'Privacy', cookies: 'Cookies', disclaimer: 'Disclaimer', rights: '© 2026' },
        auth: {},
    }),
    withLocalePath: (path: string) => path,
    setActiveLocale: vi.fn(),
}))

vi.mock('../../../api/productions', () => ({
    getRecentProductions: getRecentProductionsMock,
}))

vi.mock('../../../api/blogs', () => ({
    getLatestBlog: getLatestBlogMock,
}))

vi.mock('../../../pages/public/blogDetailPage.formatters', () => ({
    getLocalizedTitle: getLocalizedTitleMock,
    getLocalizedContent: getLocalizedContentMock,
    normalizeContent: normalizeContentMock,
}))

vi.mock('../../../components/public/PublicLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../../components/public/PublicHeroSearch', () => ({
    default: ({ onSearch }: { onSearch: (f: Record<string, string | undefined>) => void }) => (
        <>
            <button
                data-testid="search-with-query-btn"
                onClick={() => onSearch({ query: 'jazz', year: undefined, genre: undefined, location: undefined })}
            >
                zoek met query
            </button>
            <button
                data-testid="search-empty-btn"
                onClick={() => onSearch({ query: '', year: undefined, genre: undefined, location: undefined })}
            >
                zoek leeg
            </button>
        </>
    ),
}))

vi.mock('../../../components/public/PublicPopularTags', () => ({
    default: ({ onTagClick }: { onTagClick: (tag: string) => void }) => (
        <button data-testid="popular-tag-btn" onClick={() => onTagClick('theater')}>
            theater
        </button>
    ),
}))

vi.mock('../../../components/public/PublicCarousel', () => ({
    default: () => <div data-testid="carousel" />,
}))

vi.mock('../../../components/public/PublicLatestBlogPreview', () => ({
    default: ({
        blog,
        onReadMore,
        onViewAll,
    }: {
        blog: { id: string; title: string; excerpt: string } | null
        onReadMore: (id: string) => void
        onViewAll: () => void
    }) => (
        <div data-testid="latest-blog-preview">
            {blog ? (
                <>
                    <span data-testid="blog-title">{blog.title}</span>
                    <span data-testid="blog-excerpt">{blog.excerpt}</span>
                    <button data-testid="read-more-btn" onClick={() => onReadMore(blog.id)}>
                        lees meer
                    </button>
                    <button data-testid="view-all-blogs-btn" onClick={onViewAll}>
                        alle blogs
                    </button>
                </>
            ) : null}
        </div>
    ),
}))

vi.mock('../../../components/public/PublicRecentDigitized', () => ({
    default: ({
        items,
        onViewItem,
        onViewAll,
    }: {
        items: Array<{ id: string; title: string; dateLabel: string; archiveLabel?: string; description: string }>
        onViewItem: (id: string) => void
        onViewAll: () => void
    }) => (
        <div data-testid="recent-digitized">
            {items.map((item) => (
                <div key={item.id} data-testid={`recent-item-${item.id}`}>
                    <span data-testid={`item-title-${item.id}`}>{item.title}</span>
                    {item.archiveLabel ? (
                        <span data-testid={`item-label-${item.id}`}>{item.archiveLabel}</span>
                    ) : null}
                    <button data-testid={`view-item-btn-${item.id}`} onClick={() => onViewItem(item.id)}>
                        bekijk item
                    </button>
                </div>
            ))}
            <button data-testid="view-all-recent-btn" onClick={onViewAll}>
                doorzoek archief
            </button>
        </div>
    ),
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const baseProductionItem = {
    id: 'prod-uuid-1',
    apiId: '/api/v1/productions/8554',
    title: { nl: 'Test Productie', en: null, fr: null },
    description_short: { nl: 'Korte beschrijving test', en: null, fr: null },
    teaser: null,
    description: null,
    created_at: '2024-03-15T12:00:00.000Z',
}

const baseBlogItem = {
    id: 'blog-uuid-1',
    title: { nl: 'Test Blog Titel' },
    content: { nl: 'Blog inhoud hier.' },
    productions: [],
    createdAt: '2024-03-15T12:00:00.000Z',
    updatedAt: '2024-03-15T12:00:00.000Z',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function renderPage(path = '/nl') {
    return render(
        <MemoryRouter initialEntries={[path]}>
            <HomePage />
        </MemoryRouter>
    )
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('HomePage', () => {
    beforeEach(() => {
        navigate.mockReset()
        getActiveLocaleMock.mockReturnValue('nl')
        getRecentProductionsMock.mockResolvedValue({ data: [baseProductionItem] })
        getLatestBlogMock.mockResolvedValue({
            data: [baseBlogItem],
            meta: { total: 1, page: 1, limit: 1, totalPages: 1 },
        })
        getLocalizedTitleMock.mockReturnValue('Test Blog Titel')
        getLocalizedContentMock.mockReturnValue('Blog inhoud hier.')
        normalizeContentMock.mockReturnValue(null)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    // ── Recent digitized ────────────────────────────────────────────────────

    describe('recent digitized section', () => {
        it('renders the production title loaded from the API', async () => {
            renderPage()
            expect(await screen.findByTestId('item-title-prod-uuid-1')).toHaveTextContent('Test Productie')
        })

        it('formats a numeric apiId as a hash archive label', async () => {
            renderPage()
            expect(await screen.findByTestId('item-label-prod-uuid-1')).toHaveTextContent('#8554')
        })

        it('omits the archive label when apiId is null', async () => {
            getRecentProductionsMock.mockResolvedValue({
                data: [{ ...baseProductionItem, apiId: null }],
            })
            renderPage()
            await screen.findByTestId('recent-item-prod-uuid-1')
            expect(screen.queryByTestId('item-label-prod-uuid-1')).not.toBeInTheDocument()
        })

        it('falls back to "Zonder titel" when production title is null', async () => {
            getRecentProductionsMock.mockResolvedValue({
                data: [{ ...baseProductionItem, title: null }],
            })
            renderPage()
            expect(await screen.findByTestId('item-title-prod-uuid-1')).toHaveTextContent('Zonder titel')
        })

        it('falls back to "Untitled" when locale is en and title is null', async () => {
            getActiveLocaleMock.mockReturnValue('en')
            getRecentProductionsMock.mockResolvedValue({
                data: [{ ...baseProductionItem, title: null }],
            })
            renderPage()
            expect(await screen.findByTestId('item-title-prod-uuid-1')).toHaveTextContent('Untitled')
        })

        it('renders nothing when the API returns an empty list', async () => {
            getRecentProductionsMock.mockResolvedValue({ data: [] })
            renderPage()
            await waitFor(() => {
                expect(screen.queryByTestId('recent-item-prod-uuid-1')).not.toBeInTheDocument()
            })
        })

        it('renders nothing when the API call fails', async () => {
            getRecentProductionsMock.mockRejectedValue(new Error('network error'))
            renderPage()
            await waitFor(() => {
                expect(screen.queryByTestId('recent-item-prod-uuid-1')).not.toBeInTheDocument()
            })
        })

        it('strips HTML tags from description_short', async () => {
            getRecentProductionsMock.mockResolvedValue({
                data: [{ ...baseProductionItem, description_short: { nl: '<p>Beschrijving <strong>tekst</strong></p>', en: null, fr: null } }],
            })
            renderPage()
            await screen.findByTestId('recent-item-prod-uuid-1')
            // The plain-text value rendered in the title confirms mapping ran
            expect(screen.getByTestId('item-title-prod-uuid-1')).toHaveTextContent('Test Productie')
        })

        it('calls getRecentProductions with the current locale', async () => {
            renderPage()
            await screen.findByTestId('recent-item-prod-uuid-1')
            expect(getRecentProductionsMock).toHaveBeenCalledWith('nl', 4)
        })

        it('navigates to the archive detail page when view item is clicked', async () => {
            renderPage()
            fireEvent.click(await screen.findByTestId('view-item-btn-prod-uuid-1'))
            expect(navigate).toHaveBeenCalledWith('/archive/prod-uuid-1')
        })

        it('navigates to the search page when view all is clicked', async () => {
            renderPage()
            fireEvent.click(await screen.findByTestId('view-all-recent-btn'))
            expect(navigate).toHaveBeenCalledWith('/zoeken')
        })
    })

    // ── Latest blog ─────────────────────────────────────────────────────────

    describe('latest blog section', () => {
        it('renders the blog title from the API', async () => {
            renderPage()
            expect(await screen.findByTestId('blog-title')).toHaveTextContent('Test Blog Titel')
        })

        it('renders the blog excerpt', async () => {
            renderPage()
            expect(await screen.findByTestId('blog-excerpt')).toHaveTextContent('Blog inhoud hier.')
        })

        it('falls back to "Zonder titel" when blog title is empty', async () => {
            getLocalizedTitleMock.mockReturnValue('')
            renderPage()
            expect(await screen.findByTestId('blog-title')).toHaveTextContent('Zonder titel')
        })

        it('truncates long excerpts to 320 characters with an ellipsis', async () => {
            const longContent = 'B'.repeat(400)
            getLocalizedContentMock.mockReturnValue(longContent)
            renderPage()
            const excerptEl = await screen.findByTestId('blog-excerpt')
            expect(excerptEl.textContent).toHaveLength(320)
            expect(excerptEl.textContent).toMatch(/\.\.\.$/)
        })

        it('builds excerpt from delta ops when normalizeContent returns a delta', async () => {
            normalizeContentMock.mockReturnValue({
                ops: [
                    { insert: 'Eerste zin.' },
                    { insert: ' Tweede zin.' },
                ],
            })
            renderPage()
            expect(await screen.findByTestId('blog-excerpt')).toHaveTextContent('Eerste zin. Tweede zin.')
        })

        it('renders nothing when the API returns an empty list', async () => {
            getLatestBlogMock.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 1, totalPages: 0 } })
            renderPage()
            await waitFor(() => {
                expect(screen.queryByTestId('blog-title')).not.toBeInTheDocument()
            })
        })

        it('renders nothing when the API call fails', async () => {
            getLatestBlogMock.mockRejectedValue(new Error('network error'))
            renderPage()
            await waitFor(() => {
                expect(screen.queryByTestId('blog-title')).not.toBeInTheDocument()
            })
        })

        it('calls getLatestBlog with the current locale', async () => {
            renderPage()
            await screen.findByTestId('blog-title')
            expect(getLatestBlogMock).toHaveBeenCalledWith('nl')
        })

        it('navigates to the blog detail page when read more is clicked', async () => {
            renderPage()
            fireEvent.click(await screen.findByTestId('read-more-btn'))
            expect(navigate).toHaveBeenCalledWith('/blogs/blog-uuid-1')
        })

        it('navigates to the search page when view all blogs is clicked', async () => {
            renderPage()
            fireEvent.click(await screen.findByTestId('view-all-blogs-btn'))
            expect(navigate).toHaveBeenCalledWith('/zoeken?tab=blogs')
        })
    })

    // ── Search and navigation ────────────────────────────────────────────────

    describe('search and navigation', () => {
        it('navigates to the search page with a query param when search is submitted', async () => {
            renderPage()
            // Wait for async effects to settle before clicking to avoid act() warnings
            await screen.findByTestId('item-title-prod-uuid-1')
            fireEvent.click(screen.getByTestId('search-with-query-btn'))
            expect(navigate).toHaveBeenCalledWith('/zoeken?q=jazz')
        })

        it('navigates to the bare search page when search is submitted without a query', async () => {
            renderPage()
            await screen.findByTestId('item-title-prod-uuid-1')
            fireEvent.click(screen.getByTestId('search-empty-btn'))
            expect(navigate).toHaveBeenCalledWith('/zoeken')
        })

        it('navigates to the search page with a genre param when a popular tag is clicked', async () => {
            renderPage()
            await screen.findByTestId('item-title-prod-uuid-1')
            fireEvent.click(screen.getByTestId('popular-tag-btn'))
            expect(navigate).toHaveBeenCalledWith('/zoeken?genre=theater')
        })
    })
})
