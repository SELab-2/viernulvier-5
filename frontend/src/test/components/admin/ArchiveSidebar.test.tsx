import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ArchiveSidebar from '../../../components/admin/ArchiveSidebar'

// Mock useLocale
vi.mock('../../../components/admin/useLocale', () => {
  const useLocale = () => ({ locale: 'nl' })
  return { useLocale, default: useLocale }
})

// Mock FuzzyTagInput to avoid testing its internals here
vi.mock('../../../components/admin/FuzzyTagInput', () => {
  const React = require('react')
  return {
    default: (props: any) =>
      React.createElement('div', {
        'data-testid': 'fuzzy',
        'data-placeholder': props.placeholder,
      }),
  }
})

describe('ArchiveSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const makeTagState = (placeholder = '') => ({
    input: '',
    items: [],
    add: vi.fn(),
    remove: vi.fn(),
    setInput: vi.fn(),
    placeholder,
  })

  it('renders labels and passes placeholders to FuzzyTagInput and FileUploadRow', () => {
    const genre = makeTagState()
    const tag = makeTagState()

    render(
      <ArchiveSidebar
        genre={genre as any}
        tag={tag as any}
        bannerSlot={null}
        extraSlots={[]}
        onBannerChange={vi.fn()}
        onExtraSlotsChange={vi.fn()}
        productionSettingsLabel="Production settings"
        genreLabel="Genres"
        tagLabel="Tags"
        bannerLabel="Banner"
        extraPicturesLabel="Extra pictures"
        addGenrePlaceholder="Add genre..."
        addTagPlaceholder="Add tag..."
        chooseFilePlaceholder="Choose file"
      />
    )

    expect(screen.getByText('Production settings')).toBeInTheDocument()
    expect(screen.getByText('Genres')).toBeInTheDocument()
    expect(screen.getByText('Tags')).toBeInTheDocument()
    expect(screen.getByText('Banner')).toBeInTheDocument()
    expect(screen.getByText('Extra pictures')).toBeInTheDocument()

    const fuzzy = screen.getAllByTestId('fuzzy')
    // two fuzzy inputs: genre & tag
    expect(fuzzy.length).toBeGreaterThanOrEqual(2)
    const placeholders = fuzzy.map(n => n.getAttribute('data-placeholder'))
    expect(placeholders).toContain('Add genre...')
    expect(placeholders).toContain('Add tag...')
  })

  it('calls onBannerChange when a banner file is selected', () => {
    const genre = makeTagState()
    const tag = makeTagState()
    const onBannerChange = vi.fn()

    const { container } = render(
      <ArchiveSidebar
        genre={genre as any}
        tag={tag as any}
        bannerSlot={null}
        extraSlots={[]}
        onBannerChange={onBannerChange}
        onExtraSlotsChange={vi.fn()}
        productionSettingsLabel="Production settings"
        genreLabel="Genres"
        tagLabel="Tags"
        bannerLabel="Banner"
        extraPicturesLabel="Extra pictures"
        addGenrePlaceholder="Add genre..."
        addTagPlaceholder="Add tag..."
        chooseFilePlaceholder="Choose file"
      />
    )

    // find the hidden file input and simulate a change
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['x'], 'banner.png', { type: 'image/png' })
    fireEvent.change(fileInput, { target: { files: [file] } })

    expect(onBannerChange).toHaveBeenCalled()
    // ensure the argument is a pending ImageSlot containing the file
    const arg = onBannerChange.mock.calls[0][0]
    expect(arg).toHaveProperty('kind', 'pending')
    expect(arg).toHaveProperty('file')
  })
})