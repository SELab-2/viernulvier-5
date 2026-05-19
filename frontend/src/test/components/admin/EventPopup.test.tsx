import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EventPopup from '../../../components/admin/EventPopup'

// Mock useLocale
vi.mock('../../../components/admin/useLocale', () => ({
  useLocale: () => ({ locale: 'nl' }),
}))

// Mock FuzzyTagInput to keep test focused
vi.mock('../../../components/admin/FuzzyTagInput', () => ({
  default: (props: any) => <div data-testid="fuzzy" data-placeholder={props.placeholder} />
}))

const baseFields = {
  key: 'k1',
  starts_at: '',
  ends_at: '',
  production_id: '',
  hall_id: '',
  hall_name: {},
  info: ''
}

describe('EventPopup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders and calls onClose when clicking overlay or cancel, and onSave on save', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    const onChange = vi.fn()

    const hall = {
      input: '',
      items: [],
      add: vi.fn(),
      remove: vi.fn(),
      setInput: vi.fn(),
      clear: vi.fn()
    }

    const { container } = render(
      <EventPopup
        fields={baseFields as any}
        isEdit={false}
        hall={hall as any}
        onClose={onClose}
        onSave={onSave}
        onChange={onChange}
        saveButtonLabel="Save event"
        editLabel="Edit"
        addLabel="Add"
        timeLabel="Time"
        locationLabel="Location"
        commentLabel="Comment"
      />
    )

    // click overlay (outermost container)
    fireEvent.click(container.firstChild as Element)
    expect(onClose).toHaveBeenCalledTimes(1)

    // click Cancel button
    const cancel = screen.getByText('Cancel')
    fireEvent.click(cancel)
    expect(onClose).toHaveBeenCalledTimes(2)

    // click Save event button
    const save = screen.getByText('Save event')
    fireEvent.click(save)
    expect(onSave).toHaveBeenCalledTimes(1)
  })

  it('calls onChange when typing info', () => {
    const onClose = vi.fn()
    const onSave = vi.fn()
    const onChange = vi.fn()

    const hall = {
      input: '',
      items: [],
      add: vi.fn(),
      remove: vi.fn(),
      setInput: vi.fn(),
      clear: vi.fn()
    }

    render(
      <EventPopup
        fields={{ ...baseFields, info: '' } as any}
        isEdit={false}
        hall={hall as any}
        onClose={onClose}
        onSave={onSave}
        onChange={onChange}
        saveButtonLabel="Save event"
        editLabel="Edit"
        addLabel="Add"
        timeLabel="Time"
        locationLabel="Location"
        commentLabel="Comment"
      />
    )

    const input = screen.getByPlaceholderText('type here ...')
    fireEvent.change(input, { target: { value: 'note' } })
    expect(onChange).toHaveBeenCalledWith('info', 'note')
  })
})