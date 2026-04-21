import { useCallback, useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type UseFocusTrapOptions = {
  containerRef: RefObject<HTMLElement | null>
  active: boolean
  onDeactivate: () => void
}

export function useFocusTrap({ containerRef, active, onDeactivate }: UseFocusTrapOptions): void {
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) {
      return []
    }

    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
  }, [containerRef])

  useEffect(() => {
    if (!active) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDeactivate()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusableElements()
      if (focusable.length === 0) {
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault()
          last.focus()
        }
        return
      }

      if (document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [active, onDeactivate, getFocusableElements])

  useEffect(() => {
    if (!active || !containerRef.current) {
      return
    }

    const focusable = containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
    focusable?.focus()
  }, [active, containerRef])
}
