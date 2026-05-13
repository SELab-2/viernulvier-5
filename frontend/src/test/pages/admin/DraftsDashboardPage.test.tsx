import React from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import DraftsDashboardPage from "../../../pages/admin/DraftsDashboard.tsx";

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
            tableColTitle: 'Title',
            tableColType: 'Type',
            tableColStatus: 'Status',
            tableColLanguage: 'Language Status',
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

vi.mock('../../../components/admin/hooks/useBlogsDrafts', () => ({
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

        render(<DraftsDashboardPage />)

        // Assert Header layout mapping
        expect(screen.getByText('Concepten')).toBeInTheDocument()
        expect(screen.getByText('Overzicht van items die nog niet gepubliceerd zijn.')).toBeInTheDocument()

        // Assert active loading indicator state
        expect(screen.getByText('Concepten worden geladen...')).toBeInTheDocument()
    })

    it('renders resolved production items correctly inside the table payload', () => {
        useProductionDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'prod-1',
                    title: { nl: 'SNOBS: Concept Archief', en: 'SNOBS: Draft Archive' },
                    updatedAt: '2026-05-13T12:00:00.000Z',
                },
            ],
        })

        render(<DraftsDashboardPage />)

        // Assert item injection checks derived title rendering targets
        expect(screen.getByText('SNOBS: Concept Archief')).toBeInTheDocument()
        expect(screen.getByText('Nog niet beschikbaar in archief')).toBeInTheDocument()
    })

    it('renders explicit error banner alerts when data ingestion fails', () => {
        useProductionDraftsMock.mockReturnValue({
            items: [],
            isLoading: false,
            error: 'Netwerkverbinding met archief server verbroken.',
        })

        render(<DraftsDashboardPage />)

        expect(screen.getByText('Fout bij laden van concepten')).toBeInTheDocument()
        expect(screen.getByText('Netwerkverbinding met archief server verbroken.')).toBeInTheDocument()
    })

    it('renders clean fallback row when data arrays evaluate to empty sets', () => {
        useProductionDraftsMock.mockReturnValue({ items: [], isLoading: false, error: null })

        render(<DraftsDashboardPage />)

        expect(screen.getByText('Geen concepten gevonden.')).toBeInTheDocument()
    })

    it('switches safely to the Blog tab context and re-evaluates display outputs using the secondary hook', () => {
        // Stage Production Mock data
        useProductionDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'prod-1',
                    title: { nl: 'Productie Concept', en: 'Production Draft' },
                    updatedAt: '2026-05-13T12:00:00.000Z',
                },
            ],
        })

        // Stage Blog Mock data
        useBlogDraftsMock.mockReturnValue({
            isLoading: false,
            error: null,
            items: [
                {
                    id: 'blog-1',
                    title: { nl: 'Blog Concept Tekst', en: 'Blog Draft Text' },
                    updatedAt: '2026-05-14T12:00:00.000Z',
                },
            ],
        })

        render(<DraftsDashboardPage />)

        // Assert Default rendering baseline tracks Productions
        expect(screen.getByText('Productie Concept')).toBeInTheDocument()
        expect(screen.queryByText('Blog Concept Tekst')).not.toBeInTheDocument()

        // Query tab triggers using label associations or explicit accessible roles
        const blogTabButton = screen.getByRole('button', { name: 'Blogs' })
        fireEvent.click(blogTabButton)

        // Assert DOM reconciles against Blog state structures
        expect(screen.queryByText('Productie Concept')).not.toBeInTheDocument()
        expect(screen.getByText('Blog Concept Tekst')).toBeInTheDocument()

        // Ensure underlying hook calls matched constraints
        expect(useBlogDraftsMock).toHaveBeenCalledWith(expect.objectContaining({ page: 1, limit: 10 }))
    })
})