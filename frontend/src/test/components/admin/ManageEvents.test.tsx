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
    ]

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

    // header row + two data rows
    const rows = screen.getAllByRole('row')
    expect(rows.length).toBeGreaterThanOrEqual(3)

    // find first data row by date cell content
    const firstRow = rows.find(r => within(r).queryByText('2023-06-01'))!
    expect(within(firstRow).getByText('18:30 - 20:00')).toBeInTheDocument()
    expect(within(firstRow).getByText('Hall A')).toBeInTheDocument()
    expect(within(firstRow).getByText('note A')).toBeInTheDocument()

    // click the edit and delete buttons on first row
    const buttons = within(firstRow).getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(edit).toHaveBeenCalledWith('e1')
    fireEvent.click(buttons[1])
    expect(del).toHaveBeenCalledWith('e1')

    // click makeEvent button
    const makeBtn = screen.getByText('Add event')
    fireEvent.click(makeBtn)
    expect(make).toHaveBeenCalledTimes(1)
  })

  it('does not render info badge when info is empty', () => {
    const make = vi.fn()
    const edit = vi.fn()
    const del = vi.fn()

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
    ]

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

    const rows = screen.getAllByRole('row')
    const secondRow = rows.find(r => within(r).queryByText('2023-06-02'))!
    // Hall B present, but no info badge in second row
    expect(within(secondRow).getByText('Hall B')).toBeInTheDocument()
    expect(within(secondRow).queryByText('note A')).toBeNull()
  })

  it('renders empty end time gracefully', () => {
    const make = vi.fn()
    const edit = vi.fn()
    const del = vi.fn()

    const events = [
      {
        key: 'e1',
        starts_at: '2023-06-01T18:30:00',
        ends_at: undefined,
        hall_id: '',
        hall_name: { nl: 'Hall A' },
        info: ''
      }
    ]

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

    const rows = screen.getAllByRole('row')
    const dataRow = rows.find(r => within(r).queryByText('2023-06-01'))!
    // formatTime returns empty string for undefined end -> "18:30 - "
    expect(
      within(dataRow).getByText((content) => content.trim().startsWith('18:30'))
    ).toBeInTheDocument()
  })

  it('falls back to english hall name when locale key is missing', () => {
    const make = vi.fn()
    const edit = vi.fn()
    const del = vi.fn()

    const events = [
      {
        key: 'e1',
        starts_at: '2023-06-01T18:30:00',
        ends_at: '2023-06-01T20:00:00',
        hall_id: '',
        hall_name: { en: 'Hall EN' },
        info: ''
      }
    ]

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

    const rows = screen.getAllByRole('row')
    const dataRow = rows.find(r => within(r).queryByText('2023-06-01'))!
    expect(within(dataRow).getByText('Hall EN')).toBeInTheDocument()
  })
})
