import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Messages } from '../../../i18n/types'
import { AdminMessagesContext } from '../../../components/admin/AdminMessagesContext'
import { ProductionsTable, type ProductionRow } from '../../../components/admin/ProductionsTable'

vi.mock('../../../components/admin/hooks/useDashboardFormatters', () => ({
    useDashboardFormatters: () => ({
        formatDate: (value: string) => `formatted:${value}`,
    }),
}))

const testMessages = {
    admin: {
        dashboard: {
            tableColTitle: 'Titel',
            tableColLanguage: 'Taal',
            tableColDate: 'Datum',
            tableColActions: 'Acties',
            languageStatusComplete: 'Volledig',
            languageStatusAttention: 'Aandacht vereist',
            languageStatusMissing: 'Ontbreekt',
            actionEdit: 'Bewerk',
            actionDelete: 'Verwijder',
            actionView: 'Bekijk',
            emptyRecent: 'Geen producties gevonden.',
        },
        productions: {
            untitledLabel: '(Zonder titel)',
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

const baseItem: ProductionRow = {
    id: 'prod-1',
    title: 'De Grote Voorstelling',
    detailHref: '/archive/prod-1',
    languageStatus: { nl: 'complete', en: 'attention' },
    updated_at: '2024-03-15T10:00:00Z',
}

const secondItem: ProductionRow = {
    id: 'prod-2',
    title: 'Kleine Voorstelling',
    detailHref: '/archive/prod-2',
    languageStatus: { nl: 'missing', en: 'complete' },
    updated_at: '2024-04-01T08:00:00Z',
}


describe('ProductionsTable', () => {

    // Rendering: kolomhoofden
    it('renders all column headings', () => {
        renderTable(
            <ProductionsTable items={[]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Titel')).toBeInTheDocument()
        expect(screen.getByText('Taal')).toBeInTheDocument()
        expect(screen.getByText('Datum')).toBeInTheDocument()
        expect(screen.getByText('Acties')).toBeInTheDocument()
    })

    // Rendering: rij-inhoud
    it('renders title and formatted date for each item', () => {
        renderTable(
            <ProductionsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('De Grote Voorstelling')).toBeInTheDocument()
        expect(screen.getByText('formatted:2024-03-15T10:00:00Z')).toBeInTheDocument()
    })

    it('renders the title initials avatar correctly', () => {
        renderTable(
            <ProductionsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        // "De Grote Voorstelling" → eerste 2 tekens = "DE"
        expect(screen.getByText('DE')).toBeInTheDocument()
    })

    it('renders multiple rows when multiple items are passed', () => {
        renderTable(
            <ProductionsTable items={[baseItem, secondItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('De Grote Voorstelling')).toBeInTheDocument()
        expect(screen.getByText('Kleine Voorstelling')).toBeInTheDocument()
    })

    // Lege staat
    it('shows the empty message when items is empty and not loading', () => {
        renderTable(
            <ProductionsTable items={[]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByText('Geen producties gevonden.')).toBeInTheDocument()
    })

    it('does not show the empty message while loading', () => {
        renderTable(
            <ProductionsTable items={[]} isLoading={true} pageSize={10} />,
        )

        expect(screen.queryByText('Geen producties gevonden.')).not.toBeInTheDocument()
    })

    // Plaatshouder-rijen
    it('renders placeholder rows to fill up to pageSize when fewer items are shown', () => {
        const { container } = renderTable(
            <ProductionsTable items={[baseItem]} isLoading={false} pageSize={3} />,
        )

        // 1 echte rij + 2 placeholders + 1 thead-rij = 4 <tr> elementen
        const rows = container.querySelectorAll('tr')
        expect(rows).toHaveLength(4)
    })

    it('does not render placeholder rows when items fill the page exactly', () => {
        const { container } = renderTable(
            <ProductionsTable items={[baseItem, secondItem]} isLoading={false} pageSize={2} />,
        )

        // 2 echte rijen + 1 thead-rij, geen placeholders
        const rows = container.querySelectorAll('tr')
        expect(rows).toHaveLength(3)
    })

    // Taalstatus
    it('renders NL and EN language indicators for each row', () => {
        renderTable(
            <ProductionsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        expect(screen.getByLabelText('NL: Volledig')).toBeInTheDocument()
        expect(screen.getByLabelText('EN: Aandacht vereist')).toBeInTheDocument()
    })

    it('applies opacity-40 class to a language badge with state "missing"', () => {
        renderTable(
            <ProductionsTable items={[secondItem]} isLoading={false} pageSize={10} />,
        )

        // secondItem heeft nl: 'missing'
        const nlBadge = screen.getByLabelText('NL: Ontbreekt')
        expect(nlBadge).toHaveClass('opacity-40')
    })

    it('does not apply opacity-40 to a language badge with state "complete"', () => {
        renderTable(
            <ProductionsTable items={[baseItem]} isLoading={false} pageSize={10} />,
        )

        const nlBadge = screen.getByLabelText('NL: Volledig')
        expect(nlBadge).not.toHaveClass('opacity-40')
    })

    // Actie-knoppen: renderen
    it('renders edit and delete buttons when callbacks are provided', () => {
        renderTable(
            <ProductionsTable
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
            <ProductionsTable
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
            <ProductionsTable
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
            <ProductionsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={onEdit}
                onDelete={vi.fn()}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Bewerk' }))
        expect(onEdit).toHaveBeenCalledOnce()
        expect(onEdit).toHaveBeenCalledWith('prod-1')
    })

    it('calls onDelete with the correct id when the delete button is clicked', () => {
        const onDelete = vi.fn()

        renderTable(
            <ProductionsTable
                items={[baseItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={onDelete}
            />,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Verwijder' }))
        expect(onDelete).toHaveBeenCalledOnce()
        expect(onDelete).toHaveBeenCalledWith('prod-1')
    })

    it('calls onEdit with the correct id for each row independently', () => {
        const onEdit = vi.fn()

        renderTable(
            <ProductionsTable
                items={[baseItem, secondItem]}
                isLoading={false}
                pageSize={10}
                onEdit={onEdit}
                onDelete={vi.fn()}
            />,
        )

        const editButtons = screen.getAllByRole('button', { name: 'Bewerk' })
        fireEvent.click(editButtons[1])
        expect(onEdit).toHaveBeenCalledWith('prod-2')
    })

    // Verwijder-bezig staat
    it('disables the delete button for the item currently being deleted', () => {
        renderTable(
            <ProductionsTable
                items={[baseItem, secondItem]}
                isLoading={false}
                pageSize={10}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                deletingId="prod-1"
            />,
        )

        const deleteButtons = screen.getAllByRole('button', { name: 'Verwijder' })
        expect(deleteButtons[0]).toBeDisabled()
        expect(deleteButtons[1]).not.toBeDisabled()
    })

    it('does not disable any delete button when deletingId is null', () => {
        renderTable(
            <ProductionsTable
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