import { useEffect, useRef } from 'react'

/**
 * Modal filtrów (mobile). Overlay + dialog z:
 *  - zamykaniem klawiszem Escape,
 *  - zamykaniem kliknięciem w tło,
 *  - blokadą scrolla body,
 *  - focusem przenoszonym do dialogu przy otwarciu.
 *
 * `children` to zawartość (np. <ItemFilters onClose={...} />).
 */
export default function FilterModal({ isOpen, onClose, children }) {
  const dialogRef = useRef(null)

  // Escape zamyka + blokada scrolla tła.
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Przenieś focus do dialogu (dostępność).
    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Filtry i sortowanie"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl outline-none sm:rounded-2xl"
      >
        {children}
      </div>
    </div>
  )
}
