import { useEffect, useReducer } from 'react'
import { api } from '../../../api/client'
import type { DraftItem, EditorItem } from '../drafts/DraftsTable'
type State = {
    items: DraftItem[]
    total: number
    isLoading: boolean
    error: string | null
}

type Action =
    | { type: 'fetch' }
    | { type: 'success'; items: DraftItem[], total: number }
    | { type: 'error'; message: string }
    | { type: 'disabled' }

function reducer(_state: State, action: Action): State {
    switch (action.type) {
        case 'fetch': return { items: [], total: 0, isLoading: true, error: null }
        case 'success': return { items: action.items,total: action.total, isLoading: false, error: null }
        case 'error': return { items: [], total: 0, isLoading: false, error: action.message }
        case 'disabled': return { items: [], total: 0, isLoading: false, error: null }
    }
}

type Args = { page: number; limit: number; enabled?: boolean; editorId?: string, refetch?: boolean }

export function useBlogDrafts({ page, limit, enabled = true, editorId, refetch }: Args): State {
    const [state, dispatch] = useReducer(reducer, { items: [], total: 0, isLoading: enabled, error: null })

    useEffect(() => {
        if (!enabled) {
            dispatch({ type: 'disabled' })
            return
        }

        dispatch({ type: 'fetch' })
        let isActive = true

        const editorParam = editorId ? `&editorId=${editorId}` : ''

        api.get<{  data: DraftItem[]; meta: { total: number }}>(`/archive/blogs?draft=true&page=${page}&limit=${limit}${editorParam}`)
            .then((response) => {
                if (!isActive) return
                const items = response.data
                const total = response.meta.total


                // no need to fetch the list of editors of the blogs if we already know the editor edited it
                if (editorId) {
                    dispatch({ type: 'success', items: items.map((item) => ({ ...item, editors: [{ id: editorId }] })), total})
                    return
                }

                return Promise.all(
                    items.map((item) =>
                        api
                            .get<{ data: EditorItem[] }>(`/cms-users/?blogId=${item.id}`)
                            .then((res) => ({ ...item, editors: res.data ?? [] }))
                    )
                ).then((items) => {
                    if (!isActive) return
                    dispatch({ type: 'success', items, total})
                })
            })
            .catch((error: unknown) => {
                if (!isActive) return
                const message = error instanceof Error ? error.message : 'Blogs konden niet geladen worden.'
                dispatch({ type: 'error', message })
            })

        return () => { isActive = false }
    }, [page, limit, enabled, editorId, refetch])

    return state
}