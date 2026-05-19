import type { LocalizedText } from "./production"

/**
 * Event type 
 */
export type Event = {
    key: string // always required: local UUID for new / real id for existing
    id?: string 
    starts_at?: string
    ends_at?: string
    info?: string
    production_id?: string
    hall_id?: string
    hall_name?: LocalizedText // This is only for display, not for API
}

export type EventPayload = {
    data: {
        id: string
        starts_at?: string
        ends_at?: string
        info?: string
        production_id?: string
        hall_id?: string
        hall_name?: LocalizedText // This is only for display, not for API
    }
}

export type EventPayloadResponse = {
    key: string // always required: local UUID for new / real id for existing
    id?: string 
    starts_at?: string
    ends_at?: string
    info?: LocalizedText
    production_id?: string
    hall_id?: string
    hall_name?: LocalizedText // This is only for display, not for API
}
