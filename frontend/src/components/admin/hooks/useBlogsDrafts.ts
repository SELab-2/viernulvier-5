import { useEffect, useState } from 'react'
import { api } from '../../../api/client'
import type {DraftItem} from '../drafts/DraftsTable'

type DraftState = {
    items: DraftItem[]
    isLoading: boolean
    error: string | null
}

type Args = {
    page: number
    limit: number
    enabled?: boolean
}

export function useBlogDrafts({ page, limit, enabled = true }: Args): DraftState {
    const [state, setState] = useState<DraftState>({
        items: [],
        isLoading: enabled,
        error: null,
    })

    useEffect(() => {
        if (!enabled) return;
        let isActive = true


        api.get<{ data: DraftItem[] }>(`/archive/blogs?draft=true&page=${page}&limit=${limit}`)
            .then((response) => {
                if (!isActive) return
                setState({ items: response.data, isLoading: false, error: null })
            })
            .catch((error: unknown) => {
                if (!isActive) return
                const message = error instanceof Error ? error.message : 'Blogs konden niet geladen worden.'
                setState({ items: [], isLoading: false, error: message })
            })

        return () => { isActive = false }
    }, [page, limit, enabled])

    return state
}