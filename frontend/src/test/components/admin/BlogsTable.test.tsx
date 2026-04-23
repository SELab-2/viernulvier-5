import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import { BlogsTable, type BlogRow } from '../../../components/admin/BlogsTable'

vi.mock('../../../components/admin/hooks/useDashboardFormatters', () => ({
    useDashboardFormatters: () => ({
        formatDate: (value: string) => `formatted:${value}`,
    }),
}))

const testMessages = {
    admin: {
        dashboard: {
            tableColTitle: 'Titel',
            tableColDate: 'Datum',
            tableColActions: 'Acties',
            actionEdit: 'Bewerk',
            actionDelete: 'Verwijder',
            emptyRecent: 'Geen blogs gevonden.',
        },
    },
} as unknown as Messages

function renderTable(ui: React.ReactElement) {
    return render(
        <AdminMessagesContext.Provider value={testMessages}>
            {ui}
        </AdminMessagesContext.Provider>,
    )
}


const baseItem: BlogRow = {
    id: 'blog-1',
    title: 'Een Interessante Blog',
    productionCount: 3,
    createdAt: '2024-03-01T09:00:00Z',
    updatedAt: '2024-03-15T10:00:00Z',
}

const secondItem: BlogRow = {
    id: 'blog-2',
    title: 'Nog Een Blog',
    productionCount: 1,
    createdAt: '2024-04-01T08:00:00Z',
    updatedAt: '2024-04-02T08:00:00Z',
}

const itemWithNoProductions: BlogRow = {
    id: 'blog-3',
    title: 'Blog Zonder Producties',
    productionCount: 0,
    createdAt: '2024-05-01T00:00:00Z',
    updatedAt: '2024-05-01T00:00:00Z',
}


describe('BlogsTable', () => {

    // Rendering: kolomhoofden
    it('renders all column headings', () => {
        renderTable(
            <BlogsTable items={[]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Titel')).toBeInTheDocument()
        expect(screen.getByText('Gekoppelde producties')).toBeInTheDocument()
        expect(screen.getByText('Datum')).toBeInTheDocument()
        expect(screen.getByText('Acties')).toBeInTheDocument()
    })

    it('does not render status or language columns', () => {
        renderTable(
            <BlogsTable items={[]} isLoading={false} pageSize={10} />,
        )

        expect(screen.queryByText('Status')).not.toBeInTheDocument()
        expect(screen.queryByText('Taal')).not.toBeInTheDocument()
    })

    // Rendering: rij-inhoud
    it('renders title and formatted date for each item', () => {
        renderTable(
            <BlogsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Een Interessante Blog')).toBeInTheDocument()
        expect(screen.getByText('formatted:2024-03-15T10:00:00Z')).toBeInTheDocument()
    })

    it('renders the title initials avatar correctly', () => {
        renderTable(
            <BlogsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        // "Een Interessante Blog" → eerste 2 tekens = "EE"
        expect(screen.getByText('EE')).toBeInTheDocument()
    })

    it('renders multiple rows when multiple items are passed', () => {
        renderTable(
            <BlogsTable items={[baseItem, secondItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Een Interessante Blog')).toBeInTheDocument()
        expect(screen.getByText('Nog Een Blog')).toBeInTheDocument()
    })

    // Productiecount
    it('shows singular "1 productie" when productionCount is 1', () => {
        renderTable(
            <BlogsTable items={[secondItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('1 productie')).toBeInTheDocument()
    })

    it('shows plural "X producties" when productionCount is greater than 1', () => {
        renderTable(
            <BlogsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('3 producties')).toBeInTheDocument()
    })

    it('shows "0 producties" when productionCount is 0', () => {
        renderTable(
            <BlogsTable items={[itemWithNoProductions]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('0 producties')).toBeInTheDocument()
    })

    // Lege staat
    it('shows the empty message when items is empty and not loading', () => {
        renderTable(
            <BlogsTable items={[]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Geen blogs gevonden.')).toBeInTheDocument()
    })

    it('does not show the empty message while loading', () => {
        renderTable(
            <BlogsTable items={[]} isLoading={true} pageSize={10} />,
        )

        expect(screen.queryByText('Geen blogs gevonden.')).not.toBeInTheDocument()
    })

    // Plaatshouder-rijen
    it('renders placeholder rows to fill up to pageSize when fewer items are shown', () => {
        const { container } = renderTable(
            <BlogsTable items={[baseItem]} isLoading={false} pageSize={3} />,
        )

        // 1 echte rij + 2 placeholders + 1 thead-rij = 4 <tr> elementen
        const rows = container.querySelectorAll('tr')
        expect(rows).toHaveLength(4)
    })

    it('does not render placeholder rows when items fill the page exactly', () => {
        const { container } = renderTable(
            <BlogsTable items={[baseItem, secondItem]} isLoading={false} pageSize={2} />,
        )

        // 2 echte rijen + 1 thead-rij, geen placeholders
        const rows = container.querySelectorAll('tr')
        expect(rows).toHaveLength(3)
    })

    // Actie-knoppen: renderen
    it('renders edit and delete buttons when callbacks are provided', () => {
        renderTable(
            <BlogsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
            />,
        )

        expect(screen.getByRole('button', { name: 'Bewerk' })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Verwijder' })).toBeInTheDocument()
    })

    it('does not render edit button when onEdit is not provided', () => {
        renderTable(
            <BlogsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onDelete={vi.fn()}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Bewerk' })).not.toBeInTheDocument()
    })

    it('does not render delete button when onDelete is not provided', () => {
        renderTable(
            <BlogsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
            />,
        )

        expect(screen.queryByRole('button', { name: 'Verwijder' })).not.toBeInTheDocument()
    })

    // Actie-knoppen: klikgedrag
    it('calls onEdit with the correct id when the edit button is clicked', () => {
        const onEdit = vi.fn()

        renderTable(
            <BlogsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={onEdit}
                onDelete={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Bewerk' }))
        expect(onEdit).toHaveBeenCalledOnce()
        expect(onEdit).toHaveBeenCalledWith('blog-1')
    })

    it('calls onDelete with the correct id when the delete button is clicked', () => {
        const onDelete = vi.fn()

        renderTable(
            <BlogsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={onDelete}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))
        expect(onDelete).toHaveBeenCalledOnce()
        expect(onDelete).toHaveBeenCalledWith('blog-1')
    })

    it('calls onEdit with the correct id for each row independently', () => {
        const onEdit = vi.fn()

        renderTable(
            <BlogsTable
                items={[baseItem, secondItem]}
                isLoading={false}
                pageSize={10}
                onEdit={onEdit}
                onDelete={vi.fn()}
            />,
        )

        const editButtons = screen.getAllByRole('button', { name: 'Bewerk' })
        fireEvent.click(editButtons[1])
        expect(onEdit).toHaveBeenCalledWith('blog-2')
    })

    // Verwijder-bezig staat
    it('disables the delete button for the item currently being deleted', () => {
        renderTable(
            <BlogsTable
                items={[baseItem, secondItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                deletingId="blog-1"
            />,
        )

        const deleteButtons = screen.getAllByRole('button', { name: 'Verwijder' })
        expect(deleteButtons[0]).toBeDisabled()
        expect(deleteButtons[1]).not.toBeDisabled()
    })

    it('does not disable any delete button when deletingId is null', () => {
        renderTable(
            <BlogsTable
                items={[baseItem, secondItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                deletingId={null}
            />,
        )

        screen.getAllByRole('button', { name: 'Verwijder' }).forEach((btn) => {
            expect(btn).not.toBeDisabled()
        })
    })
})