import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PublicRecentDigitized from '../../../components/public/PublicRecentDigitized'

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('../../../i18n', () => ({
    getMessages: () => ({
        home: {
            recentDigitizedHeading: 'Recent gedigitaliseerd',
            recentDigitizedViewItem: 'bekijk item',
            recentDigitizedViewAll: 'doorzoek het volledige archief >',
        },
    }),
}))

vi.mock('../../../components/public/SectionTitle', () => ({
    default: ({ title }: { title: string }) => <h2>{title}</h2>,
}))

vi.mock('../../../components/public/PublicPillButton', () => ({
    default: ({ label, onClick }: { label: string; onClick?: () => void }) => (
        <button type="button" onClick={onClick}>
            {label}
        </button>
    ),
}))

// ─── Test data ────────────────────────────────────────────────────────────────

const baseItems = [
    {
        id: 'item-1',
        dateLabel: '15 MRZ 2024',
        archiveLabel: '#8554',
        title: 'Kapiteinsavond',
        description: 'Een stuk over het leven op zee.',
    },
    {
        id: 'item-2',
        dateLabel: '02 JAN 2023',
        archiveLabel: undefined,
        title: 'Nacht van de Kunst',
        description: 'Een nacht vol verrassingen.',
    },
]

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('PublicRecentDigitized', () => {
    it('renders the section heading', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByText('Recent gedigitaliseerd')).toBeInTheDocument()
    })

    it('renders a list item for each provided item', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByText('Kapiteinsavond')).toBeInTheDocument()
        expect(screen.getByText('Nacht van de Kunst')).toBeInTheDocument()
    })

    it('renders the date label for each item', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByText('15 MRZ 2024')).toBeInTheDocument()
        expect(screen.getByText('02 JAN 2023')).toBeInTheDocument()
    })

    it('renders the archive label when provided', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByText('#8554')).toBeInTheDocument()
    })

    it('does not render an archive label when it is undefined', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        // Only item-1 has an archiveLabel; item-2 should not produce any label element
        const labels = screen.queryAllByText(/^#/)
        expect(labels).toHaveLength(1)
    })

    it('renders the description for each item', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByText('Een stuk over het leven op zee.')).toBeInTheDocument()
        expect(screen.getByText('Een nacht vol verrassingen.')).toBeInTheDocument()
    })

    it('calls onViewItem with the correct id when the mobile chevron button is clicked', () => {
        const handleViewItem = vi.fn()
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={handleViewItem} onViewAll={vi.fn()} />
        )
        // Mobile button has aria-label "bekijk item: <title>"
        fireEvent.click(screen.getByRole('button', { name: 'bekijk item: Kapiteinsavond' }))
        expect(handleViewItem).toHaveBeenCalledWith('item-1')
    })

    it('calls onViewItem with the correct id when the desktop pill button is clicked', () => {
        const handleViewItem = vi.fn()
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={handleViewItem} onViewAll={vi.fn()} />
        )
        // Desktop pill buttons have label "bekijk item"
        const pillButtons = screen.getAllByRole('button', { name: 'bekijk item' })
        fireEvent.click(pillButtons[0])
        expect(handleViewItem).toHaveBeenCalledWith('item-1')
    })

    it('calls onViewAll when the "view all" button is clicked', () => {
        const handleViewAll = vi.fn()
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={handleViewAll} />
        )
        fireEvent.click(screen.getByRole('button', { name: 'doorzoek het volledige archief >' }))
        expect(handleViewAll).toHaveBeenCalledTimes(1)
    })

    it('renders no articles when items is an empty array', () => {
        render(
            <PublicRecentDigitized items={[]} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.queryByRole('article')).not.toBeInTheDocument()
    })

    it('still renders the "view all" button when items is empty', () => {
        render(
            <PublicRecentDigitized items={[]} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getByRole('button', { name: 'doorzoek het volledige archief >' })).toBeInTheDocument()
    })

    it('renders the correct number of articles', () => {
        render(
            <PublicRecentDigitized items={baseItems} onViewItem={vi.fn()} onViewAll={vi.fn()} />
        )
        expect(screen.getAllByRole('article')).toHaveLength(2)
    })
})
