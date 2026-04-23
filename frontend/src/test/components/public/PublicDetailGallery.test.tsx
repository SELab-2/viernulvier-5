import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import ArchiveDetailGallery from '../../../components/public/detail/PublicDetailGallery'
import { PublicMessagesContext } from '../../../components/public/PublicMessagesContext'

const mockMessages = {
    detail: {
        previousImage: 'Previous image',
        nextImage: 'Next image',
    },
} as any

describe('ArchiveDetailGallery', () => {
    const images = [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
    ]

    it('renders the first image on mount', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/1.jpg')
        expect(screen.getByRole('img')).toHaveAttribute('alt', 'Gallery image 1')
    })

    it('does not render navigation buttons for a single image', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={['https://example.com/1.jpg']} />
            </PublicMessagesContext.Provider>
        )

        expect(screen.queryByText('›')).not.toBeInTheDocument()
        expect(screen.queryByText('‹')).not.toBeInTheDocument()
    })

    it('renders navigation buttons when there are multiple images', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        expect(screen.getByText('›')).toBeInTheDocument()
        expect(screen.getByText('‹')).toBeInTheDocument()
    })

    it('shows the counter when there are multiple images', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('advances to the next image when the next button is clicked', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        fireEvent.click(screen.getByText('›'))

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/2.jpg')
        expect(screen.getByText('2 / 3')).toBeInTheDocument()
    })

    it('goes back to the previous image when the previous button is clicked', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('‹'))

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/1.jpg')
        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('wraps around to the last image when previous is clicked on the first image', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        fireEvent.click(screen.getByText('‹'))

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/3.jpg')
        expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })

    it('wraps around to the first image when next is clicked on the last image', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={images} />
            </PublicMessagesContext.Provider>
        )

        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('›'))

        expect(screen.getByRole('img')).toHaveAttribute('src', 'https://example.com/1.jpg')
        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('does not render an image when the current image is null', () => {
        render(
            <PublicMessagesContext.Provider value={mockMessages}>
                <ArchiveDetailGallery images={[null, 'https://example.com/2.jpg']} />
            </PublicMessagesContext.Provider>
        )

        expect(screen.queryByRole('img')).not.toBeInTheDocument()
    })
})