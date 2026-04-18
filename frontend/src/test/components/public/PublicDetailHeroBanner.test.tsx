import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ArchiveDetailHero from '../../../components/public/detail/PublicDetailHeroBanner'

describe('ArchiveDetailHero', () => {
    it('renders the hero image with the title as alt text', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                title="Kapiteinsavond"
            />
        )

        const img = screen.getByRole('img')
        expect(img).toHaveAttribute('src', 'https://example.com/hero.jpg')
        expect(img).toHaveAttribute('alt', 'Kapiteinsavond')
    })

    it('falls back to a generic alt text when title is not provided', () => {
        render(<ArchiveDetailHero imageUrl="https://example.com/hero.jpg" />)

        expect(screen.getByRole('img')).toHaveAttribute('alt', 'Production image')
    })

    it('renders the title when provided', () => {
        render(
            <ArchiveDetailHero imageUrl="https://example.com/hero.jpg" title="Kapiteinsavond" />
        )

        expect(screen.getByRole('heading', { name: 'Kapiteinsavond' })).toBeInTheDocument()
    })

    it('does not render a heading when title is null', () => {
        render(
            <ArchiveDetailHero imageUrl="https://example.com/hero.jpg" title={null} />
        )

        expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    })

    it('renders the super title when provided', () => {
        render(
            <ArchiveDetailHero
                imageUrl="https://example.com/hero.jpg"
                superTitle="KAP"
                title="Kapiteinsavond"
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
            />
        )

        expect(screen.getByText('KAP')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: 'Kapiteinsavond' })).toBeInTheDocument()
        expect(screen.getByText('Ensemble X')).toBeInTheDocument()
    })
})
