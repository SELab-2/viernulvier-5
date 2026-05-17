import { useEffect, useState } from 'react'
import { api } from '../../../api/client'

type Delta = {
    changePct: number | null
    direction: 'up' | 'down' | 'flat'
}

export type DashboardSummary = {
    counts: {
        productions: number
        events: number
        blogs: number
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
        updated_at: string
    }>
    totalRecentItems: number
    lastScrapedAt: string | null
    deltas: {
        productions: Delta
        blogs: Delta
    }
}

type DashboardSummaryResponse = {
    data: DashboardSummary
}

type DashboardSummaryState = {
    summary: DashboardSummary | null
    isLoading: boolean
    error: string | null
}

type DashboardSummaryArgs = {
    page: number
    limit: number
}

export function useDashboardSummary({ page, limit }: DashboardSummaryArgs): DashboardSummaryState {
    const [state, setState] = useState<DashboardSummaryState>({
        summary: null,
        isLoading: true,
        error: null,
    })

    useEffect(() => {
        let isActive = true

        api.get<DashboardSummaryResponse>(`/dashboard/summary?page=${page}&limit=${limit}`)
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
    }, [page, limit])

    return state
}
