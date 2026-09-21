import { useEffect } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getClientRects().length > 0
  )
}

/**
 * Utrzymuje focus wewnątrz kontenera dialogu (pułapka na Tab) i - opcjonalnie -
 * przenosi focus do dialogu po otwarciu oraz przywraca go na element, który był
 * aktywny przed otwarciem.
 *
 * Świadomie NIE ustawia `inert` na tle - pilnuje tylko cyklu focusu; obsługę
 * Escape i blokadę scrolla zostawiamy poszczególnym dialogom.
 *
 * @param {import('react').RefObject<HTMLElement>} containerRef - element dialogu
 * @param {boolean} active - czy pułapka jest aktywna
 * @param {{ initialFocus?: boolean, restoreFocus?: boolean, initialFocusRef?: import('react').RefObject<HTMLElement> }} [options]
 */
export function useFocusTrap(containerRef, active, options = {}) {
  const {
    initialFocus = true,
    restoreFocus = true,
    initialFocusRef,
  } = options

  useEffect(() => {
    if (!active) return undefined

    const container = containerRef.current
    if (!container) return undefined

    const previouslyFocused = document.activeElement

    if (initialFocus) {
      const target =
        initialFocusRef?.current ||
        focusableElements(container)[0] ||
        container

      target?.focus?.()
    }

    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return

      const items = focusableElements(container)

      if (items.length === 0) {
        event.preventDefault()
        container.focus?.()
        return
      }

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    return () => {
      container.removeEventListener('keydown', handleKeyDown)

      if (restoreFocus) {
        previouslyFocused?.focus?.()
      }
    }
  }, [active, containerRef, initialFocus, restoreFocus, initialFocusRef])
}
