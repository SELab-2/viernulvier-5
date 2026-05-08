import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import PublicPopularTags from '../../../components/public/PublicPopularTags'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const CANONICAL_TAGS = [
    'theater', 'dans', 'concert', 'nightlife', 'talks', 'comedy',
    'monument', 'circus', 'performance', 'spoken word', 'listening session',
]

const homeMessagesState = vi.hoisted(() => ({
    current: {
        popularTagsLabel: 'Verken op categorie:',
        popularTagsMore: '+ meer',
        popularTagsLess: '- minder',
        popularTags: [
            'theater', 'dans', 'concert', 'nightlife', 'talks', 'comedy',
            'monument', 'circus', 'performance', 'spoken word', 'listening session',
        ],
    },
}))

vi.mock('../../../i18n', () => ({
    getMessages: () => ({
        home: homeMessagesState.current,
    }),
}))

// ─── ResizeObserver stub (triggers recalculate synchronously on observe) ─────

type ResizeCallback = (entries: ResizeObserverEntry[], observer: ResizeObserver) => void
let resizeCallback: ResizeCallback | null = null

class MockResizeObserver {
    constructor(cb: ResizeCallback) { resizeCallback = cb }
    observe() { resizeCallback?.([{} as ResizeObserverEntry], this) }
    unobserve() {}
    disconnect() { resizeCallback = null }
}

// ─── offsetWidth helpers ─────────────────────────────────────────────────────

/** 80px everywhere → row (80) too narrow for all tags + more button → needsMore = true */
function mockNarrowOffsetWidth() {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() { return 80 },
    })
}

function restoreOffsetWidth() {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() { return 0 },
    })
}

function mockTextAwareOffsetWidth(rowWidth = 240) {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', {
        configurable: true,
        get() {
            const element = this as HTMLElement
            if (element.className.includes('min-w-0 flex-1')) {
                return rowWidth
            }

            const text = element.textContent?.trim() ?? ''
            return text.length * 10 + 20
        },
    })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PublicPopularTags', () => {
    // ResizeObserver must be available for all tests since the component uses it
    beforeEach(() => {
        vi.stubGlobal('ResizeObserver', MockResizeObserver)
        homeMessagesState.current = {
            popularTagsLabel: 'Verken op categorie:',
            popularTagsMore: '+ meer',
            popularTagsLess: '- minder',
            popularTags: CANONICAL_TAGS,
        }
    })
    afterEach(() => {
        vi.unstubAllGlobals()
        restoreOffsetWidth()
    })

    describe('basic rendering (jsdom — all tags visible, row too narrow to measure)', () => {
        it('renders the section label', () => {
            render(<PublicPopularTags onTagClick={vi.fn()} />)
            expect(screen.getByText('Verken op categorie:')).toBeInTheDocument()
        })

        it('renders all canonical tags in the visible row by default', () => {
            render(<PublicPopularTags onTagClick={vi.fn()} />)
            for (const tag of CANONICAL_TAGS) {
                const btns = screen.queryAllByRole('button', { name: tag })
                expect(btns.length).toBeGreaterThan(0)
            }
        })

        it('calls onTagClick with the correct tag value when clicked', () => {
            const handleTagClick = vi.fn()
            render(<PublicPopularTags onTagClick={handleTagClick} />)
            fireEvent.click(screen.getAllByRole('button', { name: 'theater' })[0])
            expect(handleTagClick).toHaveBeenCalledWith('theater')
        })

        it('calls onTagClick for each tag independently', () => {
            const handleTagClick = vi.fn()
            render(<PublicPopularTags onTagClick={handleTagClick} />)
            fireEvent.click(screen.getAllByRole('button', { name: 'concert' })[0])
            expect(handleTagClick).toHaveBeenCalledWith('concert')
            fireEvent.click(screen.getAllByRole('button', { name: 'spoken word' })[0])
            expect(handleTagClick).toHaveBeenCalledWith('spoken word')
        })
    })

    describe('expand / collapse (with offsetWidth mocked to force truncation)', () => {
        beforeEach(() => {
            mockNarrowOffsetWidth()
        })

        it('shows the "+ meer" button when not all tags fit', async () => {
            await act(async () => {
                render(<PublicPopularTags onTagClick={vi.fn()} />)
            })
            expect(screen.getByRole('button', { name: '+ meer' })).toBeInTheDocument()
        })

        it('does not show "- minder" before expanding', async () => {
            await act(async () => {
                render(<PublicPopularTags onTagClick={vi.fn()} />)
            })
            expect(screen.queryByRole('button', { name: '- minder' })).not.toBeInTheDocument()
        })

        it('switches to "- minder" after clicking "+ meer"', async () => {
            await act(async () => {
                render(<PublicPopularTags onTagClick={vi.fn()} />)
            })
            fireEvent.click(screen.getByRole('button', { name: '+ meer' }))
            expect(screen.getByRole('button', { name: '- minder' })).toBeInTheDocument()
        })

        it('collapses back to "+ meer" after clicking "- minder"', async () => {
            await act(async () => {
                render(<PublicPopularTags onTagClick={vi.fn()} />)
            })
            fireEvent.click(screen.getByRole('button', { name: '+ meer' }))
            fireEvent.click(screen.getByRole('button', { name: '- minder' }))
            expect(screen.getByRole('button', { name: '+ meer' })).toBeInTheDocument()
        })

        it('shows all tags after expanding', async () => {
            await act(async () => {
                render(<PublicPopularTags onTagClick={vi.fn()} />)
            })
            fireEvent.click(screen.getByRole('button', { name: '+ meer' }))
            for (const tag of CANONICAL_TAGS) {
                const btns = screen.queryAllByRole('button', { name: tag })
                expect(btns.length).toBeGreaterThan(0)
            }
        })

        it('recalculates visibility and shows the expand button when localized tags change without a resize', async () => {
            mockTextAwareOffsetWidth()
            homeMessagesState.current = {
                popularTagsLabel: 'Verken op categorie:',
                popularTagsMore: '+ meer',
                popularTagsLess: '- minder',
                popularTags: ['a', 'b', 'c'],
            }

            const { rerender } = render(<PublicPopularTags onTagClick={vi.fn()} />)

            expect(screen.queryByRole('button', { name: '+ meer' })).not.toBeInTheDocument()

            homeMessagesState.current = {
                popularTagsLabel: 'Explore by category:',
                popularTagsMore: '+ more options',
                popularTagsLess: '- less options',
                popularTags: ['long-tag-one', 'long-tag-two', 'long-tag-three'],
            }

            await act(async () => {
                rerender(<PublicPopularTags onTagClick={vi.fn()} />)
            })

            await waitFor(() => {
                expect(screen.getByRole('button', { name: '+ more options' })).toBeInTheDocument()
            })
            expect(screen.queryByRole('button', { name: '- less options' })).not.toBeInTheDocument()
        })
    })
})
