import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArchiveDetailHero from '../../../components/public/detail/PublicDetailHeroBanner'

vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicLocale: () => 'nl',
}))

describe('ArchiveDetailHero', () => {
    it('renders the hero image with the title as alt text', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
            />
        )

        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg')
        expect(img).toHaveAttribute('alt', 'Kapiteinsavond')
    })

    it('falls back to a generic alt text when title is not provided', () => {
        render(<ArchiveDetailHero imageUrl="https://example.com/hero.jpg" locale="nl" />)

        expect(screen.getByRole('img')).toHaveAttribute('alt', 'Production image')
    })

    it('renders the title when provided', () => {
        render(
            <ArchiveDetailHero imageUrl="https://example.com/hero.jpg" title="Kapiteinsavond" locale="nl" />
        )

        expect(screen.getByRole('heading', { name: 'Kapiteinsavond' })).toBeInTheDocument()
    })

    it('does not render a heading when title is null', () => {
        render(
            <ArchiveDetailHero imageUrl="https://example.com/hero.jpg" title={null} locale="nl" />
        )

        expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('renders the super title when provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                superTitle="KAP"
                title="Kapiteinsavond"
                locale="nl"
            />
        )

        expect(screen.getByText('KAP')).toBeInTheDocument()
    })

    it('does not render the super title when it is null', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                superTitle={null}
                title="Kapiteinsavond"
                locale="nl"
            />
        )

        expect(screen.queryByText('KAP')).not.toBeInTheDocument()
    })

    it('renders the artist when provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                artist="Ensemble X"
                locale="nl"
            />
        )

        expect(screen.getByText('Ensemble X')).toBeInTheDocument()
    })

    it('does not render the artist when it is null', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                artist={null}
                locale="nl"
            />
        )

        expect(screen.queryByText('Ensemble X')).not.toBeInTheDocument()
    })

    it('renders all fields together correctly', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                superTitle="KAP"
                title="Kapiteinsavond"
                artist="Ensemble X"
                locale="nl"
            />
        )

        expect(screen.getByText('KAP')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Kapiteinsavond' })).toBeInTheDocument()
        expect(screen.getByText('Ensemble X')).toBeInTheDocument()
    })

    it('renders genre pills when genres are provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[
                    {
                        id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: { nl: 'Concert', en: 'Concert' },
                        slug: { nl: 'muziek', en: 'music' },
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                ]}
            />
        )

        expect(screen.getByText('Concert')).toBeInTheDocument()
    })

    it('does not render non-genre labels in hero pills', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[
                    {
                        id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: { nl: 'Concert', en: 'Concert' },
                        slug: { nl: 'muziek', en: 'music' },
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                ]}
            />
        )

        expect(screen.getByText('Concert')).toBeInTheDocument()
        expect(screen.queryByText('in De Vooruit')).not.toBeInTheDocument()
    })

    it('renders only genre pills when multiple genres are provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[
                    {
                        id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: { nl: 'Concert', en: 'Concert' },
                        slug: { nl: 'muziek', en: 'music' },
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                    {
                        id: '8edda54e-a1c4-486d-9fd4-c2e43cb2fe2f',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: { nl: 'Performance', en: 'Performance' },
                        slug: { nl: 'performance', en: 'performance' },
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                ]}
            />
        )

        expect(screen.getByText('Concert')).toBeInTheDocument()
        expect(screen.getByText('Performance')).toBeInTheDocument()
        expect(screen.queryByText('in De Vooruit')).not.toBeInTheDocument()
    })

    it('does not render the pill container when genres are empty', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[]}
            />
        )

        expect(screen.queryByText('Concert')).not.toBeInTheDocument()
        expect(screen.queryByText('in De Vooruit')).not.toBeInTheDocument()
    })

    it('skips a genre pill when its name is null', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[
                    {
                        id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: null,
                        slug: null,
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                ]}
            />
        )

        expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })

    it('uses the correct locale for genre names', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="en"
                genres={[
                    {
                        id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4',
                        apiId: null,
                        vendor_id: null,
                        type: 'theater',
                        name: { nl: 'Concert', en: 'Concert EN' },
                        slug: null,
                        description: null,
                        created_at: new Date('2026-04-01T10:00:00.000Z'),
                        updated_at: new Date('2026-04-01T10:00:00.000Z'),
                    },
                ]}
            />
        )

        expect(screen.getByText('Concert EN')).toBeInTheDocument()
        expect(screen.queryByText('at De Vooruit')).not.toBeInTheDocument()
    })
})