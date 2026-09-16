import { useEffect, useRef } from 'react'

// Mobilny bottom sheet "Więcej".
// Pokazuje WYŁĄCZNIE akcje, które faktycznie istnieją w aplikacji:
//   - Eksport CSV (handleExportAll w App.jsx),
//   - Wylogowanie (supabase.auth.signOut()).
// Statystyki i Ustawienia nie istnieją w projekcie, więc nie tworzymy
// dla nich atrap widoków.

const TITLE_ID = 'more-sheet-title'

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  )
}

export default function MoreSheet({
  isOpen,
  onClose,
  onExport,
  isExporting = false,
  exportError = null,
  onLogout,
  triggerRef,
}) {
  const panelRef = useRef(null)

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current?.()
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const triggerNode = triggerRef?.current

    return () => {
      triggerNode?.focus?.()
    }
  }, [isOpen, triggerRef])

  if (!isOpen) return null

  const runAndClose = (handler) => {
    handler?.()
    onClose?.()
  }

  const actionClass =
    'flex min-h-[44px] w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:hidden"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-lg rounded-t-2xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl outline-none"
      >
        <div
          className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300"
          aria-hidden="true"
        />

        <h2 id={TITLE_ID} className="text-lg font-semibold text-gray-800">
          Więcej
        </h2>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => runAndClose(onExport)}
            disabled={isExporting}
            className={actionClass}
          >
            <DownloadIcon />
            {isExporting ? 'Eksportowanie…' : 'Eksport CSV'}
          </button>

          <button
            type="button"
            onClick={() => runAndClose(onLogout)}
            className={actionClass}
          >
            <LogoutIcon />
            Wyloguj
          </button>
        </div>

        {exportError && (
          <p className="mt-3 text-sm text-red-600">{exportError}</p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 min-h-[44px] w-full rounded-xl bg-gray-100 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
        >
          Anuluj
        </button>
      </div>
    </div>
  )
}
