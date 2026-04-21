import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductionPickerPopup from '../../components/admin/blogs/ProductionPickerPopup'
import type { ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'

const baseProduction = (overrides: Partial<ProductionItem>): ProductionItem => ({
  id: 'production-1',
  title: { nl: 'Eerste productie', en: 'First production' },
  description_short: { nl: 'Korte beschrijving', en: 'Short description' },
  description: { nl: 'Volledige beschrijving', en: 'Full description' },
  teaser: { nl: 'Teaser', en: 'Teaser' },
  image_url: 'https://example.com/image.jpg',
  created_at: '2026-04-21T00:00:00.000Z',
  venue_name: 'Theaterzaal',
  venue_names: ['Theaterzaal'],
  attendance_mode: 'offline',
  ...overrides,
})

describe('ProductionPickerPopup', () => {
  it('calls the popup actions and allows selecting a production', () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    const onSearchQueryChange = vi.fn()
    const onAdd = vi.fn()

    render(
      <ProductionPickerPopup
        isOpen
        productions={[baseProduction({ id: 'production-1' }), baseProduction({ id: 'production-2', title: { nl: 'Tweede productie', en: 'Second production' } })]}
        selectedProductionId="production-1"
        searchQuery=""
        isLoading={false}
        onClose={onClose}
        onSelect={onSelect}
        onSearchQueryChange={onSearchQueryChange}
        onAdd={onAdd}
      />,
    )

    expect(screen.getByText('Kies een production')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Zoek productie'), {
      target: { value: 'tweede' },
    })
    expect(onSearchQueryChange).toHaveBeenCalledWith('tweede')

    fireEvent.click(screen.getAllByRole('button', { name: 'Sluiten' })[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Tweede productie/i }))
    expect(onSelect).toHaveBeenCalledWith('production-2')

    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('shows the empty state when there are no productions', () => {
    render(
      <ProductionPickerPopup
        isOpen
        productions={[]}
        selectedProductionId=""
        searchQuery=""
        isLoading={false}
        onClose={vi.fn()}
        onSelect={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getByText('Geen producties beschikbaar')).toBeInTheDocument()
  })
})
