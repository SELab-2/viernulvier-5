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
                    { id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4', type: 'theater', name: { nl: 'Concert', en: 'Concert' }, slug: { nl: 'muziek', en: 'music' } },
                ]}
            />
        )

        expect(screen.getByText('Concert')).toBeInTheDocument()
    })

    it('renders tag pills when tags are provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                tags={[
                    { id: 'bfb14b61-f916-4368-a89b-20ab9fa63f8d', type: 'theater', name: { nl: 'in De Vooruit', en: 'at De Vooruit' }, slug: { nl: 'invooruit', en: 'invooruit' } },
                ]}
            />
        )

        expect(screen.getByText('in De Vooruit')).toBeInTheDocument()
    })

    it('renders both genre and tag pills together', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[
                    { id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4', type: 'theater', name: { nl: 'Concert', en: 'Concert' }, slug: { nl: 'muziek', en: 'music' } },
                ]}
                tags={[
                    { id: 'bfb14b61-f916-4368-a89b-20ab9fa63f8d', type: 'theater', name: { nl: 'in De Vooruit', en: 'at De Vooruit' }, slug: { nl: 'invooruit', en: 'invooruit' } },
                ]}
            />
        )

        expect(screen.getByText('Concert')).toBeInTheDocument()
        expect(screen.getByText('in De Vooruit')).toBeInTheDocument()
    })

    it('does not render the pill container when genres and tags are both empty', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="nl"
                genres={[]}
                tags={[]}
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
                    { id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4', type: 'theater', name: null, slug: null },
                ]}
            />
        )

        expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
    })

    it('uses the correct locale for genre and tag names', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
                locale="en"
                genres={[
                    { id: '35dbb2ad-e32a-4779-b7eb-93085531dbc4', type: 'theater', name: { nl: 'Concert', en: 'Concert EN' }, slug: null },
                ]}
                tags={[
                    { id: 'bfb14b61-f916-4368-a89b-20ab9fa63f8d', type: 'theater', name: { nl: 'in De Vooruit', en: 'at De Vooruit' }, slug: null },
                ]}
            />
        )

        expect(screen.getByText('Concert EN')).toBeInTheDocument()
        expect(screen.getByText('at De Vooruit')).toBeInTheDocument()
        expect(screen.queryByText('in De Vooruit')).not.toBeInTheDocument()
    })
})