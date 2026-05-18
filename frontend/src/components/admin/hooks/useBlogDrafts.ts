import { useEffect, useReducer } from 'react'
import { api } from '../../../api/client'
import type { DraftItem, EditorItem } from '../drafts/DraftsTable'
type State = {
    items: DraftItem[]
    isLoading: boolean
    error: string | null
}

type Action =
    | { type: 'fetch' }
    | { type: 'success'; items: DraftItem[] }
    | { type: 'error'; message: string }
    | { type: 'disabled' }

function reducer(_state: State, action: Action): State {
    switch (action.type) {
        case 'fetch': return { items: [], isLoading: true, error: null }
        case 'success': return { items: action.items, isLoading: false, error: null }
        case 'error': return { items: [], isLoading: false, error: action.message }
        case 'disabled': return { items: [], isLoading: false, error: null }
    }
}

type Args = { page: number; limit: number; enabled?: boolean; editorId?: string }

export function useBlogDrafts({ page, limit, enabled = true, editorId }: Args): State {
    const [state, dispatch] = useReducer(reducer, { items: [], isLoading: enabled, error: null })

    useEffect(() => {
        if (!enabled) {
            dispatch({ type: 'disabled' })
            return
        }

        dispatch({ type: 'fetch' })
        let isActive = true

        const editorParam = editorId ? `&editorId=${editorId}` : ''

        api.get<{ data: DraftItem[] }>(`/archive/blogs?draft=true&page=${page}&limit=${limit}${editorParam}`)
            .then((response) => {
                if (!isActive) return
                const items = response.data


                // no need to fetch the list of editors of the blogs if we already know the editor edited it
                if (editorId) {
                    dispatch({ type: 'success', items: items.map((item) => ({ ...item, editors: [{ id: editorId }] })) })
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
                    dispatch({ type: 'success', items })
                })
            })
            .catch((error: unknown) => {
                if (!isActive) return
                const message = error instanceof Error ? error.message : 'Blogs konden niet geladen worden.'
                dispatch({ type: 'error', message })
            })

        return () => { isActive = false }
    }, [page, limit, enabled, editorId])

    return state
}