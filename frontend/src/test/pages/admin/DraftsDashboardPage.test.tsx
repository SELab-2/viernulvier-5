import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import DraftsDashboardPage from "../../../pages/admin/DraftsDashboard.tsx"

const useProductionDraftsMock = vi.hoisted(() => vi.fn())
const useBlogDraftsMock = vi.hoisted(() => vi.fn())
const adminLayoutMock = vi.hoisted(() => vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>))

const mockMessages = vi.hoisted(() => ({
    admin: {
        drafts: {
            pageTitle: 'Drafts',
            pageSubtitle: 'View all drafts here',
            productions: 'Productions',
            blogs: 'Blogs',
            filterOnlyCurrent: 'Show my drafts',
            tableColTitle: 'Title',
            tableColType: 'Type',
            tableColStatus: 'Status',
            tableColEditor: 'Edited by me',
            tableColDate: 'Date',
            tableColActions: 'Actions',
            statusUnavailable: 'Not yet available in archive',
            actionView: 'View',
            actionEdit: 'Edit',
            actionDelete: 'Delete',
            languageStatusComplete: 'Translation complete',
            languageStatusAttention: 'Translation needs attention',
            languageStatusMissing: 'Translation missing',
            emptyRecent: 'No recent archive drafts found.',
            loadingMessage: 'Loading drafts...',
            deleteTitle: 'Delete draft',
            deleteConfirm: (title: string) => `Are you sure you want to delete "${title}"?`
        }
    },
}))

vi.mock('../../../components/admin/AdminLayout', () => ({
    default: (props: { children: React.ReactNode }) => {
        adminLayoutMock(props)
        return (
            <AdminMessagesContext.Provider value={mockMessages as unknown as Messages}>
                {props.children}
            </AdminMessagesContext.Provider>
        )
    },
}))

vi.mock('../../../components/admin/hooks/useProductionDrafts', () => ({
    useProductionDrafts: (args: { page: number; limit: number }) => useProductionDraftsMock(args),
}))

vi.mock('../../../components/admin/hooks/useBlogDrafts', () => ({
    useBlogDrafts: (args: { page: number; limit: number }) => useBlogDraftsMock(args),
}))

const renderPage = () => render(
    <MemoryRouter>
        <DraftsDashboardPage />
    </MemoryRouter>
)

describe('DraftsDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        useProductionDraftsMock.mockReturnValue({ items: [], isLoading: false, error: null })
        useBlogDraftsMock.mockReturnValue({ items: [], isLoading: false, error: null })
    })

    it('renders initial screen chrome: page titles and default Production view loading state', () => {
        useProductionDraftsMock.mockReturnValue({ items: [], isLoading: true, error: null })
        renderPage()
        expect(screen.getByText('Drafts')).toBeInTheDocument()
        expect(screen.getByText('View all drafts here')).toBeInTheDocument()
        expect(screen.getByText('Loading drafts...')).toBeInTheDocument()
    })

    it('renders resolved production items correctly inside the table payload', () => {
        useProductionDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'prod-1',
                    title: { nl: 'SNOBS: Concept Archief', en: 'SNOBS: Draft Archive' },
                    updated_at: '2026-05-13T12:00:00.000Z',
                    editors: [],
                },
            ],
        })
        renderPage()
        expect(screen.getByText('SNOBS: Concept Archief')).toBeInTheDocument()
        expect(screen.getByText('Not yet available in archive')).toBeInTheDocument()
    })

    it('renders explicit error banner alerts when data ingestion fails', () => {
        useProductionDraftsMock.mockReturnValue({
            items: [],
            isLoading: false,
            error: 'Network connection failed.',
        })
        renderPage()
        expect(screen.getByText('Network connection failed.')).toBeInTheDocument()
    })

    it('renders clean fallback row when data arrays evaluate to empty sets', () => {
        useProductionDraftsMock.mockReturnValue({ items: [], isLoading: false, error: null })
        renderPage()
        expect(screen.getByText('No recent archive drafts found.')).toBeInTheDocument()
    })

    it('switches safely to the Blog tab context and re-evaluates display outputs using the secondary hook', () => {
        useProductionDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'prod-1',
                    title: { nl: 'Productie Concept', en: 'Production Draft' },
                    updated_at: '2026-05-13T12:00:00.000Z',
                    editors: [],
                },
            ],
        })
        useBlogDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'blog-1',
                    title: { nl: 'Blog Concept Tekst', en: 'Blog Draft Text' },
                    updated_at: '2026-05-14T12:00:00.000Z',
                    editors: [],
                },
            ],
        })
        renderPage()
        expect(screen.getByText('Productie Concept')).toBeInTheDocument()
        expect(screen.queryByText('Blog Concept Tekst')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Blogs' }))

        expect(screen.queryByText('Productie Concept')).not.toBeInTheDocument()
        expect(screen.getByText('Blog Concept Tekst')).toBeInTheDocument()
        expect(useBlogDraftsMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))
    })
})