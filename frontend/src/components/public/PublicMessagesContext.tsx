import { createContext, useContext } from 'react'
import type { Messages } from '../../i18n/types'

export const PublicMessagesContext = createContext<Messages | null>(null)

export function usePublicMessages() {
    const messages = useContext(PublicMessagesContext)

    if (!messages) {
        throw new Error('usePublicMessages must be used within PublicLayout')
    }

    return messages
}