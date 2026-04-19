import { createContext, useContext } from 'react'
import type { Messages } from '../../i18n/types'

export const AdminMessagesContext = createContext<Messages | null>(null)

export function useAdminMessages() {
    const messages = useContext(AdminMessagesContext)

    if (!messages) {
        throw new Error('useAdminMessages must be used within AdminLayout')
    }

    return messages
}
