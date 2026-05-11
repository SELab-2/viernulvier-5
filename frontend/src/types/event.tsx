/**
 * Event type 
 */
export type EventLinks = {
    production?: string
    hall?: string
}

export type Event = {
    key: string
    info?: string
    production_id?: string
    hall_id?: string
    starts_at?: string
    ends_at?: string
    links?: EventLinks
}
export type EventPayload = Omit<Event, 'key'>
