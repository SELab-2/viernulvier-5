import { useEffect, useState } from 'react'
import { api } from '../../api/client'

export type DashboardSummary = {
    counts: {
        productions: number
        events: number
        mediaItems: number
        editors: number
    }
    recentItems: Array<{
        id: string
        title: string
        type: string
        status: 'available'
        languageStatus: {
            nl: 'complete' | 'attention'
            en: 'complete' | 'attention' | 'missing'
        }
        updatedAt: string
    }>
    lastScrapedAt: string | null
}

type DashboardSummaryResponse = {
    data: DashboardSummary
}

type DashboardSummaryState = {
    summary: DashboardSummary | null
    isLoading: boolean
    error: string | null
}

export function useDashboardSummary(): DashboardSummaryState {
    const [state, setState] = useState<DashboardSummaryState>({
        summary: null,
        isLoading: true,
        error: null,
    })

    useEffect(() => {
        let isActive = true

        api.get<DashboardSummaryResponse>('/dashboard/summary')
            .then((response) => {
                if (!isActive) {
                    return
                }

                setState({
                    summary: response.data,
                    isLoading: false,
                    error: null,
                })
            })
            .catch((error: unknown) => {
                if (!isActive) {
                    return
                }

                const message = error instanceof Error ? error.message : 'Dashboard kon niet geladen worden.'
                setState({
                    summary: null,
                    isLoading: false,
                    error: message,
                })
            })

        return () => {
            isActive = false
        }
    }, [])

    return state
}
