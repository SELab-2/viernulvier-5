import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import SearchResultCard from '../../../components/public/search/SearchResultCard'

describe('SearchResultCard', () => {
    it('renders as a link to the detail page', () => {
        render(
            <MemoryRouter>
                <SearchResultCard
                    item={{
                        id: 'dab70000-0000-0000-0000-000000000001',
                        tag: 'theater',
                        date: '21.04.2026',
                        title: 'The Tender Ears',
                        excerpt: 'Kort stukje teaser',
                        venue: 'VIERNULVIER',
                        imageUrl: 'https://example.com/image.jpg',
                        detailHref: '/nl/archive/dab70000-0000-0000-0000-000000000001',
                    }}
                />
            </MemoryRouter>
        )

        const link = screen.getByRole('link', { name: /The Tender Ears/i })
        expect(link).toHaveAttribute('href', '/nl/archive/dab70000-0000-0000-0000-000000000001')
    })
})
