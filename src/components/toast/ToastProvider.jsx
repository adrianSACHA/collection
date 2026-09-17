import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ToastContext } from './toastContext'

let toastIdCounter = 0

function nextId() {
  toastIdCounter += 1
  return toastIdCounter
}

const TOAST_STYLES = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
}

const TOAST_ICONS = {
  success: '✓',
  error: '⚠',
  info: 'ℹ',
}

/**
 * Provider powiadomień + widok (viewport) toastów.
 * Renderujemy go raz w main.jsx - kolejka żyje ponad zmianami widoków,
 * więc komunikat zostaje widoczny nawet po przejściu do innej strony (np.
 * po zapisie wracamy do listy, a toast "Dodano!" wciąż wisi).
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id))

    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message, options = {}) => {
      const { type = 'info', duration = 4000 } = options
      const id = nextId()

      setToasts((previous) => [...previous, { id, message, type }])

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss]
  )

  // Sprzątamy niedokończone timery przy odmontowaniu providera.
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  const value = useMemo(
    () => ({
      show,
      success: (message, options) =>
        show(message, { ...options, type: 'success' }),
      error: (message, options) =>
        show(message, { ...options, type: 'error' }),
      info: (message, options) =>
        show(message, { ...options, type: 'info' }),
    }),
    [show]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Container nie blokuje kliknięć (pointer-events-none); klikalne są
          same toasty. Na mobile trzymamy je nad dolnym menu (bottom-20). */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 lg:bottom-4 lg:items-end lg:px-6"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg ${
              TOAST_STYLES[toast.type] || TOAST_STYLES.info
            }`}
          >
            <span aria-hidden="true" className="mt-0.5 flex-shrink-0">
              {TOAST_ICONS[toast.type] || TOAST_ICONS.info}
            </span>

            <span className="flex-1">{toast.message}</span>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Zamknij powiadomienie"
              className="ml-1 flex-shrink-0 rounded p-0.5 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
