import { useEffect, useReducer } from 'react'
import { api } from '../../../api/client'
import type { DraftItem } from '../drafts/DraftsTable'

type DraftState = {
  items: DraftItem[]
  isLoading: boolean
  error: string | null
}

type Action =
    | { type: 'fetch' }
    | { type: 'success'; items: DraftItem[] }
    | { type: 'error'; message: string }
    | { type: 'disabled' }

function reducer(_state: DraftState, action: Action): DraftState {
  switch (action.type) {
    case 'fetch': return { items: [], isLoading: true, error: null }
    case 'success': return { items: action.items, isLoading: false, error: null }
    case 'error': return { items: [], isLoading: false, error: action.message }
    case 'disabled': return { items: [], isLoading: false, error: null }
  }
}

type Args = { page: number; limit: number; enabled?: boolean }

export function useProductionDrafts({ page, limit, enabled = true }: Args): DraftState {
  const [state, dispatch] = useReducer(reducer, { items: [], isLoading: enabled, error: null })

  useEffect(() => {
    if (!enabled) {
      dispatch({ type: 'disabled' })
      return
    }

    dispatch({ type: 'fetch' })
    let isActive = true

    api.get<{ data: DraftItem[] }>(`/archive/productions?draft=true&page=${page}&limit=${limit}`)
        .then((response) => { if (isActive) dispatch({ type: 'success', items: response.data }) })
        .catch((error: unknown) => {
          if (!isActive) return
          const message = error instanceof Error ? error.message : 'Productions konden niet geladen worden.'
          dispatch({ type: 'error', message })
        })

    return () => { isActive = false }
  }, [page, limit, enabled])

  return state
}