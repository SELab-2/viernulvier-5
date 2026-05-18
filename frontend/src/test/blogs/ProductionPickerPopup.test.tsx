import { useState } from 'react'
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
  it('calls the popup actions and adds multiple selected productions at once', () => {
    const onClose = vi.fn()
    const onSearchQueryChange = vi.fn()
    const onAdd = vi.fn()

    function TestHarness() {
      const [selectedProductionIds, setSelectedProductionIds] = useState(['production-1'])

      return (
        <ProductionPickerPopup
          isOpen
          productions={[baseProduction({ id: 'production-1' }), baseProduction({ id: 'production-2', title: { nl: 'Tweede productie', en: 'Second production' } })]}
          selectedProductionIds={selectedProductionIds}
          searchQuery=""
          isLoading={false}
          onClose={onClose}
          onSelectedProductionIdsChange={setSelectedProductionIds}
          onSearchQueryChange={onSearchQueryChange}
          onAdd={onAdd}
        />
      )
    }

    render(<TestHarness />)

    expect(screen.getByText('Kies een productie')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Zoek productie'), {
      target: { value: 'tweede' },
    })
    expect(onSearchQueryChange).toHaveBeenCalledWith('tweede')

    fireEvent.click(screen.getAllByRole('button', { name: 'Sluiten' })[0])
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: /Tweede productie/i }))

    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))
    expect(onAdd).toHaveBeenCalledWith(['production-1', 'production-2'])
  })

  it('shows loading feedback before the empty state while searching', () => {
    const { rerender } = render(
      <ProductionPickerPopup
        isOpen
        productions={[]}
        selectedProductionIds={[]}
        searchQuery=""
        isLoading
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Producties zoeken...')).toHaveLength(2)
    expect(screen.queryByText('Geen producties beschikbaar')).not.toBeInTheDocument()

    rerender(
      <ProductionPickerPopup
        isOpen
        productions={[]}
        selectedProductionIds={[]}
        searchQuery=""
        isLoading={false}
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getByText('Geen producties beschikbaar')).toBeInTheDocument()
  })
})
