import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import PublicLatestBlogPreview from '../../../components/public/PublicLatestBlogPreview'

vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicMessages: () => ({
        home: {
            latestBlogHeading: 'Recente blog post',
            latestBlogSubheading: 'verhalen, context en updates',
            latestBlogReadMore: 'lees meer',
            latestBlogViewAll: 'Bekijk alle blog posts',
        },
    }),
}))

vi.mock('../../../components/public/SectionTitle', () => ({
    default: ({ title, subtitle }: { title: string; subtitle?: string }) => (
        <div>
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
        </div>
    ),
}))

vi.mock('../../../components/public/PublicPillButton', () => ({
    default: ({ label, onClick }: { label: string; onClick?: () => void }) => (
        <button type="button" onClick={onClick}>
            {label}
        </button>
    ),
}))

describe('PublicLatestBlogPreview', () => {
    it('renders nothing when no blog is available', () => {
        const { container } = render(<PublicLatestBlogPreview blog={null} onReadMore={vi.fn()} onViewAll={vi.fn()} />)

        expect(container).toBeEmptyDOMElement()
    })

    it('renders the blog content and actions when a blog is available', () => {
        const onReadMore = vi.fn()
        const onViewAll = vi.fn()

        render(
            <PublicLatestBlogPreview
                blog={{ id: 'blog-1', title: 'Test Blog', excerpt: 'Samenvatting' }}
                onReadMore={onReadMore}
                onViewAll={onViewAll}
            />
        )

        expect(screen.getByText('Recente blog post')).toBeInTheDocument()
        expect(screen.getByText('Test Blog')).toBeInTheDocument()
        expect(screen.getByText('Samenvatting')).toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'lees meer' }))
        expect(onReadMore).toHaveBeenCalledWith('blog-1')

        fireEvent.click(screen.getByRole('button', { name: 'Bekijk alle blog posts' }))
        expect(onViewAll).toHaveBeenCalledTimes(1)
    })
})
