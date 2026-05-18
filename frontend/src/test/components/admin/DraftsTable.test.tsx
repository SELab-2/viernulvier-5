import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import DraftsTable from '../../../components/admin/drafts/DraftsTable'
import type { DraftItem } from '../../../components/admin/drafts/DraftsTable'

const apiDeleteMock = vi.hoisted(() => vi.fn())

vi.mock('../../../api/client', () => ({
    api: {
        delete: apiDeleteMock,
    },
}))

vi.mock('../../../components/admin/drafts/DeleteConfirmModal', () => ({
    default: ({
                  isOpen,
                  title,
                  message,
                  onCancel,
                  onConfirm,
              }: {
        isOpen: boolean
        title: string
        message: string
        onCancel: () => void
        onConfirm: () => void
    }) =>
        isOpen ? (
            <div>
                <p>{title}</p>
                <p>{message}</p>
                <button onClick={onCancel}>Cancel</button>
                <button onClick={onConfirm}>Confirm</button>
            </div>
        ) : null,
}))

const mockMessages = {
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
            emptyRecent: 'No recent archive drafts found.',
            loadingMessage: 'Loading drafts...',
            deleteTitle: 'Delete draft',
            deleteConfirm: (title: string) => `Are you sure you want to delete "${title}"?`,
        },
    },
}

const mockItem: DraftItem = {
    id: 'prod-1',
    title: { nl: 'Mijn Productie', en: 'My Production' },
    updated_at: '2026-05-13T12:00:00.000Z',
    editors: [{ id: 'user-1' }],
}

let onDeleted: ReturnType<typeof vi.fn>

const defaultProps = () => ({
    items: [mockItem],
    isLoading: false,
    tab: 'productions' as 'productions' | 'blogs',
    currentUserId: 'user-1',
    onDeleted,
})

const renderTable = (props = defaultProps()) =>
    render(
        <MemoryRouter>
            <AdminMessagesContext.Provider value={mockMessages as unknown as Messages}>
                <DraftsTable {...props} />
            </AdminMessagesContext.Provider>
        </MemoryRouter>
    )

describe('DraftsTable', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        onDeleted = vi.fn()
    })

    it('renders table column headings', () => {
        renderTable()
        expect(screen.getByText('Title')).toBeInTheDocument()
        expect(screen.getByText('Status')).toBeInTheDocument()
        expect(screen.getByText('Edited by me')).toBeInTheDocument()
        expect(screen.getByText('Date')).toBeInTheDocument()
        expect(screen.getByText('Actions')).toBeInTheDocument()
    })

    it('renders item title in the locale language', () => {
        renderTable()
        expect(screen.getByText('Mijn Productie')).toBeInTheDocument()
    })

    it('renders the avatar initials from the title', () => {
        renderTable()
        expect(screen.getByText('MI')).toBeInTheDocument()
    })

    it('renders status unavailable label', () => {
        renderTable()
        expect(screen.getByText('Not yet available in archive')).toBeInTheDocument()
    })

    it('renders checkmark when currentUserId is in editors', () => {
        renderTable()
        const paths = document.querySelectorAll('path[fill-rule="evenodd"]')
        expect(paths.length).toBeGreaterThan(0)
    })

    it('renders cross when currentUserId is not in editors', () => {
        renderTable({ ...defaultProps(), currentUserId: 'other-user' })
        const paths = document.querySelectorAll('path[fill-rule="evenodd"]')
        expect(paths.length).toBe(0)
    })

    it('renders View, Edit and Delete action buttons', () => {
        renderTable()
        expect(screen.getByText('View')).toBeInTheDocument()
        expect(screen.getByText('Edit')).toBeInTheDocument()
        expect(screen.getByText('Delete')).toBeInTheDocument()
    })

    it('renders empty state when items is empty', () => {
        renderTable({ ...defaultProps(), items: [] })
        expect(screen.getByText('No recent archive drafts found.')).toBeInTheDocument()
    })

    it('opens delete modal with correct title and message on Delete click', () => {
        renderTable()
        fireEvent.click(screen.getByText('Delete'))
        expect(screen.getByText('Delete draft')).toBeInTheDocument()
        expect(screen.getByText('Are you sure you want to delete "Mijn Productie"?')).toBeInTheDocument()
    })

    it('closes delete modal on cancel', () => {
        renderTable()
        fireEvent.click(screen.getByText('Delete'))
        expect(screen.getByText('Delete draft')).toBeInTheDocument()
        fireEvent.click(screen.getByText('Cancel'))
        expect(screen.queryByText('Delete draft')).not.toBeInTheDocument()
    })

    it('calls api.delete and onDeleted on confirm for productions', async () => {
        apiDeleteMock.mockResolvedValue({})
        renderTable()
        fireEvent.click(screen.getByText('Delete'))
        fireEvent.click(screen.getByText('Confirm'))
        await waitFor(() => {
            expect(apiDeleteMock).toHaveBeenCalledWith('/archive/productions/prod-1')
            expect(onDeleted).toHaveBeenCalled()
        })
    })

    it('calls api.delete with blogs route when tab is blogs', async () => {
        apiDeleteMock.mockResolvedValue({})
        renderTable({ ...defaultProps(), tab: 'blogs' })
        fireEvent.click(screen.getByText('Delete'))
        fireEvent.click(screen.getByText('Confirm'))
        await waitFor(() => {
            expect(apiDeleteMock).toHaveBeenCalledWith('/archive/blogs/prod-1')
        })
    })

    it('does not call onDeleted when api.delete fails', async () => {
        apiDeleteMock.mockRejectedValue(new Error('Server error'))
        renderTable()
        fireEvent.click(screen.getByText('Delete'))
        fireEvent.click(screen.getByText('Confirm'))
        await waitFor(() => {
            expect(onDeleted).not.toHaveBeenCalled()
        })
    })
})