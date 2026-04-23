import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ArchiveDetailEventsList from '../../../components/public/detail/PublicDetailEventsList'
import type { Event } from '../../../api/events'
import type { Location } from '../../../api/locations'

vi.mock('../../../components/public/PublicMessagesContext', () => ({
    usePublicMessages: () => ({
        detail: {
            noEvents: 'No upcoming events.',
            date: 'Date',
            time: 'Time',
            location: 'Location',
            remark: 'Remark',
            showMore: 'Show more',
            showLess: 'Show less',
        },
    }),
}))

function makeEvent(overrides: Partial<Event> = {}): Event {
    return {
        id: crypto.randomUUID(),
        starts_at: new Date('2027-03-06T13:00:00.000Z'),
        ends_at: new Date('2027-03-06T14:15:00.000Z'),
        doors_at: null,
        info: null,
        production_id: 'dab70000-0000-0000-0000-000000000001',
        hall_id: '214a0000-0000-0000-0000-000000000001',
        ...overrides,
    }
}

function makeLocation(overrides: Partial<Location> = {}): Location {
    return {
        id: 'bca70000-0000-0000-0000-000000000001',
        name: null,
        street: 'Kerkstraat',
        number: '1',
        postal_code: '9000',
        city: 'Gent',
        country: 'BE',
        ...overrides,
    }
}

describe('ArchiveDetailEventsList', () => {
    it('shows the empty state message when there are no events', () => {
        render(
            <ArchiveDetailEventsList
                events={[]}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.getByText('No upcoming events.')).toBeInTheDocument()
    })

    it('renders the column headers', () => {
        render(
            <ArchiveDetailEventsList
                events={[makeEvent()]}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.getAllByText('Date').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Time').length).toBeGreaterThan(0)
        expect(screen.getAllByText('Location').length).toBeGreaterThan(0)
    })

    it('renders a dash when starts_at is null', () => {
        const event = makeEvent({ starts_at: null, ends_at: null })

        render(
            <ArchiveDetailEventsList
                events={[event]}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('renders the location city when available', () => {
        const event = makeEvent()
        const location = makeLocation({ city: 'Gent', postal_code: '9000' })

        render(
            <ArchiveDetailEventsList
                events={[event]}
                locationsByEvent={{ [event.id]: location }}
                locale="nl"
            />
        )

        expect(screen.getByText('Kerkstraat 1, 9000 Gent')).toBeInTheDocument()
    })

    it('renders the location name directly when it is set', () => {
        const event = makeEvent()
        const location = makeLocation({ name: { nl: 'Stadsschouwburg', fr: 'Théâtre de la Ville', en: 'City Theatre' } })

        render(
            <ArchiveDetailEventsList
                events={[event]}
                locationsByEvent={{ [event.id]: location }}
                locale="nl"
            />
        )

        expect(screen.getByText('Stadsschouwburg')).toBeInTheDocument()
    })

    it('renders a dash when no location is available for an event', () => {
        const event = makeEvent()

        render(
            <ArchiveDetailEventsList
                events={[event]}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.getAllByText('—').length).toBeGreaterThan(0)
    })

    it('only shows the first 5 events initially', () => {
        const events = Array.from({ length: 7 }, () => makeEvent())

        render(
            <ArchiveDetailEventsList
                events={events}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.getByText('Show more')).toBeInTheDocument()
    })

    it('does not show the show more button when there are 5 or fewer events', () => {
        const events = Array.from({ length: 5 }, () => makeEvent())

        render(
            <ArchiveDetailEventsList
                events={events}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    })

    it('shows all events after clicking show more', () => {
        const events = Array.from({ length: 7 }, (_, i) => makeEvent({
            id: `event-id-${i}`,
            starts_at: new Date(`2027-03-0${i + 1}T13:00:00.000Z`),
        }))

        render(
            <ArchiveDetailEventsList
                events={events}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        fireEvent.click(screen.getByText('Show more'))

        expect(screen.getByText('Show less')).toBeInTheDocument()
        expect(screen.queryByText('Show more')).not.toBeInTheDocument()
    })

    it('collapses back to 5 events after clicking show less', () => {
        const events = Array.from({ length: 7 }, () => makeEvent())

        render(
            <ArchiveDetailEventsList
                events={events}
                locationsByEvent={{}}
                locale="nl"
            />
        )

        fireEvent.click(screen.getByText('Show more'))
        fireEvent.click(screen.getByText('Show less'))

        expect(screen.getByText('Show more')).toBeInTheDocument()
    })
})