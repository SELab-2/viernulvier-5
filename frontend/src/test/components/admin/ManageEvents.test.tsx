import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EventsEdit from '../../../components/admin/ManageEvents'

// Mock useLocale
vi.mock('../../../components/admin/useLocale', () => ({
  useLocale: () => ({ locale: 'nl' }),
}))

describe('EventsEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders rows and calls edit/delete handlers', () => {
    const edit = vi.fn()
    const del = vi.fn()
    const make = vi.fn()

    const events = [
      {
        key: 'e1',
        starts_at: '2023-06-01T18:30:00',
        ends_at: '2023-06-01T20:00:00',
        hall_id: '',
        hall_name: { nl: 'Hall A' },
        info: 'note A'
      },
      {
        key: 'e2',
        starts_at: '2023-06-02T19:00:00',
        ends_at: '2023-06-02T21:00:00',
        hall_id: '',
        hall_name: { nl: 'Hall B' },
        info: ''
      }
    ] as any

    render(
      <EventsEdit
        events={events}
        makeEvent={make}
        editEvent={edit}
        deleteEvent={del}
        makeLabel="Add event"
        dateLabel="Date"
        timeLabel="Time"
        locationLabel="Location"
        commentLabel="Comment"
        actionsLabel="Actions"
      />
    )

    // two rows present
    const rows = screen.getAllByRole('row')
    // header row + two data rows
    expect(rows.length).toBeGreaterThanOrEqual(3)

    // verify content for first event row
    const tbody = document.querySelector('tbody')!
    const firstRow = within(tbody).getByText('2023-06-01').closest('tr')!
    expect(within(firstRow).getByText('18:30 - 20:00')).toBeInTheDocument()
    expect(within(firstRow).getByText('Hall A')).toBeInTheDocument()
    expect(within(firstRow).getByText('note A')).toBeInTheDocument()

    // click the edit and delete buttons on first row
    const buttons = within(firstRow).getAllByRole('button')
    // first is edit, second is delete
    fireEvent.click(buttons[0])
    expect(edit).toHaveBeenCalledWith('e1')
    fireEvent.click(buttons[1])
    expect(del).toHaveBeenCalledWith('e1')

    // click makeEvent button
    const makeBtn = screen.getByText('Add event')
    fireEvent.click(makeBtn)
    expect(make).toHaveBeenCalledTimes(1)
  })
})