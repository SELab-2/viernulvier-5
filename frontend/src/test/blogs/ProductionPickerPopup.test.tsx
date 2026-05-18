import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ProductionPickerPopup, { type ProductionPickerFilters } from '../../components/admin/blogs/ProductionPickerPopup'
import type { ProductionItem } from '../../components/admin/blogs/ProductionManagementSection'

const defaultFilters: ProductionPickerFilters = {
  yearFrom: 1982,
  yearTo: new Date().getFullYear(),
  location: '',
}

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
          filters={defaultFilters}
          isLoading={false}
          hasMoreProductions={false}
          onLoadMoreProductions={vi.fn()}
          onClose={onClose}
          onSelectedProductionIdsChange={setSelectedProductionIds}
          onSearchQueryChange={onSearchQueryChange}
          onFiltersChange={vi.fn()}
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

  it('sends period and location filter changes while preserving result order', () => {
    const onAdd = vi.fn()
    const onFiltersChange = vi.fn()

    render(
      <ProductionPickerPopup
        isOpen
        productions={[
          baseProduction({ id: 'production-1', title: { nl: 'Binnen periode', en: 'Inside period' }, created_at: '2024-04-21T00:00:00.000Z', venue_names: ['Theaterzaal'] }),
          baseProduction({ id: 'production-2', title: { nl: 'Verkeerde locatie', en: 'Wrong location' }, created_at: '2024-04-21T00:00:00.000Z', venue_name: 'Balzaal', venue_names: ['Balzaal'] }),
          baseProduction({ id: 'production-3', title: { nl: 'Te oud', en: 'Too old' }, created_at: '2018-04-21T00:00:00.000Z', venue_names: ['Theaterzaal'] }),
        ]}
        selectedProductionIds={['production-2']}
        searchQuery=""
        filters={defaultFilters}
        isLoading={false}
        hasMoreProductions={false}
        onLoadMoreProductions={vi.fn()}
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onFiltersChange={onFiltersChange}
        onAdd={onAdd}
      />,
    )

    expect(screen.queryByLabelText('Start year')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Filters' }))
    fireEvent.change(screen.getByLabelText('Start year'), { target: { value: '2020' } })
    fireEvent.change(screen.getByPlaceholderText('Zoek locatie'), { target: { value: 'theater zaal' } })
    fireEvent.click(screen.getByRole('button', { name: 'Theaterzaal' }))

    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ yearFrom: 2020 }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ location: 'theater zaal' }))
    expect(onFiltersChange).toHaveBeenCalledWith(expect.objectContaining({ location: 'Theaterzaal' }))
    expect(screen.getByText('Geselecteerde producties')).toBeInTheDocument()
    expect(screen.getAllByText('Verkeerde locatie')).toHaveLength(2)

    const resultTitles = screen.getAllByRole('heading', { level: 4 }).map((heading) => heading.textContent)
    expect(resultTitles).toEqual(['Binnen periode', 'Verkeerde locatie', 'Te oud'])

    fireEvent.click(screen.getByRole('button', { name: 'Toevoegen' }))
    expect(onAdd).toHaveBeenCalledWith(['production-2'])
  })

  it('loads more productions when scrolling near the bottom', () => {
    const onLoadMoreProductions = vi.fn()

    render(
      <ProductionPickerPopup
        isOpen
        productions={[baseProduction({ id: 'production-1' })]}
        selectedProductionIds={[]}
        searchQuery=""
        filters={defaultFilters}
        isLoading={false}
        hasMoreProductions
        onLoadMoreProductions={onLoadMoreProductions}
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onFiltersChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    const resultsRegion = screen.getByText('Eerste productie').closest('.overflow-y-auto')
    expect(resultsRegion).not.toBeNull()

    Object.defineProperties(resultsRegion, {
      scrollHeight: { configurable: true, value: 1000 },
      scrollTop: { configurable: true, value: 850 },
      clientHeight: { configurable: true, value: 100 },
    })

    fireEvent.scroll(resultsRegion as Element)

    expect(onLoadMoreProductions).toHaveBeenCalledTimes(1)
  })

  it('shows loading feedback before the empty state while searching', () => {
    const { rerender } = render(
      <ProductionPickerPopup
        isOpen
        productions={[]}
        selectedProductionIds={[]}
        searchQuery=""
        filters={defaultFilters}
        isLoading
        hasMoreProductions={false}
        onLoadMoreProductions={vi.fn()}
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onFiltersChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getByText('Producties zoeken...')).toBeInTheDocument()
    expect(screen.queryByText('Geen producties beschikbaar')).not.toBeInTheDocument()

    rerender(
      <ProductionPickerPopup
        isOpen
        productions={[]}
        selectedProductionIds={[]}
        searchQuery=""
        filters={defaultFilters}
        isLoading={false}
        hasMoreProductions={false}
        onLoadMoreProductions={vi.fn()}
        onClose={vi.fn()}
        onSelectedProductionIdsChange={vi.fn()}
        onSearchQueryChange={vi.fn()}
        onFiltersChange={vi.fn()}
        onAdd={vi.fn()}
      />,
    )

    expect(screen.getByText('Geen producties beschikbaar')).toBeInTheDocument()
  })
})
