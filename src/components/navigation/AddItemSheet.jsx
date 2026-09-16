import { useEffect, useRef } from 'react'

// Mobilny bottom sheet wyboru rodzaju przedmiotu.
// NIE tworzy drugiego formularza - po wyborze wywołuje przekazane
// callbacki (onAddCoin / onAddBanknote), które uruchamiają istniejący
// mechanizm dodawania (ItemForm + goToAdd + fixedType) z App.jsx.

const TITLE_ID = 'add-item-sheet-title'

function CoinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  )
}

function BanknoteIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-6 w-6"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  )
}

export default function AddItemSheet({
  isOpen,
  onClose,
  onAddCoin,
  onAddBanknote,
  triggerRef,
}) {
  const panelRef = useRef(null)

  // Aktualny onClose w ref, żeby efekt zależał tylko od isOpen.
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

    // Focus do panelu dopiero przy otwarciu.
    panelRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  // Po zamknięciu przywróć focus do przycisku "Dodaj" w dolnym menu.
  useEffect(() => {
    if (!isOpen) return

    const triggerNode = triggerRef?.current

    return () => {
      triggerNode?.focus?.()
    }
  }, [isOpen, triggerRef])

  if (!isOpen) return null

  const choose = (handler) => {
    handler?.()
    onClose?.()
  }

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
          Dodaj do kolekcji
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Wybierz rodzaj przedmiotu.
        </p>

        <div className="mt-4 space-y-3">
          <button
            type="button"
            onClick={() => choose(onAddCoin)}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <CoinIcon />
            </span>
            Moneta
          </button>

          <button
            type="button"
            onClick={() => choose(onAddBanknote)}
            className="flex min-h-[56px] w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-left font-medium text-gray-800 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <BanknoteIcon />
            </span>
            Banknot
          </button>
        </div>

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
