import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArchiveDetailGallery from '../../../components/public/detail/PublicDetailGallery'

vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicMessages: () => ({
        detail: {
            previousImage: 'Previous image',
        nextImage: 'Next image',
        },
    }),
}))

describe('ArchiveDetailGallery', () => {
    const images = [
        'https://example.com/1.jpg',
        'https://example.com/2.jpg',
        'https://example.com/3.jpg',
    ]

    it('renders the first image on mount', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        const [img] = screen.getAllByAltText('Gallery image 1')
        expect(img).toHaveAttribute('src', 'https://example.com/1.jpg')
    })

    it('does not render navigation buttons for a single image', () => {
        render(
            <ArchiveDetailGallery images={['https://example.com/1.jpg']} />
        )

        expect(screen.queryByText('›')).not.toBeInTheDocument()
        expect(screen.queryByText('‹')).not.toBeInTheDocument()
    })

    it('renders navigation buttons when there are multiple images', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        expect(screen.getByText('›')).toBeInTheDocument()
        expect(screen.getByText('‹')).toBeInTheDocument()
    })

    it('shows the counter when there are multiple images', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('advances to the next image when the next button is clicked', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        fireEvent.click(screen.getByText('›'))

        const [img] = screen.getAllByAltText('Gallery image 2')
        expect(img).toHaveAttribute('src', 'https://example.com/2.jpg')
    })

    it('goes back to the previous image when the previous button is clicked', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('‹'))

        const [img] = screen.getAllByAltText('Gallery image 1')
        expect(img).toHaveAttribute('src', 'https://example.com/1.jpg')
        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('wraps around to the last image when previous is clicked on the first image', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        fireEvent.click(screen.getByText('‹'))

        const [img] = screen.getAllByAltText('Gallery image 3')
        expect(img).toHaveAttribute('src', 'https://example.com/3.jpg')
        expect(screen.getByText('3 / 3')).toBeInTheDocument()
    })

    it('wraps around to the first image when next is clicked on the last image', () => {
        render(
            <ArchiveDetailGallery images={images} />
        )

        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('›'))
        fireEvent.click(screen.getByText('›'))

        const [img] = screen.getAllByAltText('Gallery image 1')
        expect(img).toHaveAttribute('src', 'https://example.com/1.jpg')
        expect(screen.getByText('1 / 3')).toBeInTheDocument()
    })

    it('does not render an image when the current image is null', () => {
        render(
            <ArchiveDetailGallery images={[null, 'https://example.com/2.jpg']} />
        )

    
        expect(screen.queryByAltText(/Gallery Image/)).not.toBeInTheDocument()
    })
})