import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import DraftsDashboardPage from "../../../pages/admin/DraftsDashboard.tsx";
import {MemoryRouter} from "react-router-dom";

// 1. Hoist Mock Functions so vi.mock can consume them securely
const useProductionDraftsMock = vi.hoisted(() => vi.fn())
const useBlogDraftsMock = vi.hoisted(() => vi.fn())
const adminLayoutMock = vi.hoisted(() => vi.fn(({ children }: { children: React.ReactNode }) => <div>{children}</div>))

// 2. Setup standard translated string mocks matching AdminMessagesContext expectations
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
            deleteConfirm: (title: string) => `Are you sure you want to delete "${title}"?`,
        },
    },
}))

// 3. Mock Module Dependencies
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

describe('DraftsDashboardPage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // Default safe initial values for non-active hooks to prevent component runtime exceptions
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
            items: [{ id: 'prod-1', title: { nl: 'SNOBS: Concept Archief', en: 'SNOBS: Draft Archive' }, updated_at: '2026-05-13T12:00:00.000Z', editors: [] }],
        })
        renderPage()
        expect(screen.getByText('SNOBS: Draft Archive')).toBeInTheDocument()
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
            isLoading: false, error: null,
            items: [{ id: 'prod-1', title: { nl: 'Productie Concept', en: 'Production Draft' }, updated_at: '2026-05-13T12:00:00.000Z', editors: [] }],
        })
        useBlogDraftsMock.mockReturnValue({
            isLoading: false, error: null,
            items: [{ id: 'blog-1', title: { nl: 'Blog Concept Tekst', en: 'Blog Draft Text' }, updated_at: '2026-05-14T12:00:00.000Z', editors: [] }],
        })
        renderPage()
        expect(screen.getByText('Production Draft')).toBeInTheDocument()
        expect(screen.queryByText('Blog Draft Text')).not.toBeInTheDocument()

        fireEvent.click(screen.getByRole('button', { name: 'Blogs' }))

        expect(screen.queryByText('Production Draft')).not.toBeInTheDocument()
        expect(screen.getByText('Blog Draft Text')).toBeInTheDocument()
        expect(useBlogDraftsMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))
    })
})

const renderPage = () => render(
    <MemoryRouter>
        <DraftsDashboardPage />
    </MemoryRouter>
)