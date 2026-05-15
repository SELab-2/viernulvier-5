import type { LocalizedText } from "./production"

/**
 * Event type 
 */
export type EventLinks = {
    production?: string
    hall?: string
}

export type Event = {
    key: string
    starts_at?: string
    ends_at?: string
    info?: string
    production_id?: string
    hall_id?: string
    hall_name?: LocalizedText // This is only for display, not for API
    links?: EventLinks
}
export type EventPayload = Omit<Event, 'key'>
