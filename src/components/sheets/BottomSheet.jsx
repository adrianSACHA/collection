import { useEffect, useRef, useState } from 'react'

// Reużywalny modalny bottom sheet (mobile). Ujednolica dla wszystkich sheetów:
//  - overlay (jeden styl, jeden z-index),
//  - promień górnych narożników i padding panelu,
//  - drag handle + swipe-down (obszar oznaczony `data-sheet-drag`),
//  - zamykanie: tap w overlay, Escape, przycisk systemowy Back (Android),
//  - blokadę scrolla tła, focus na panelu i przywrócenie focusu na triggerze.
export default function BottomSheet({
  isOpen,
  onClose,
  triggerRef,
  ariaLabel,
  ariaLabelledby,
  children,
}) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Escape + blokada scrolla + focus.
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

  // Przycisk systemowy "wstecz" (Android): dodaj sentinel do historii; popstate
  // zamyka sheet zamiast opuszczać aplikację. Zamknięcie programowe zdejmuje wpis.
  useEffect(() => {
    if (!isOpen) return

    window.history.pushState({ __bottomSheet: true }, '')

    const handlePop = () => onCloseRef.current?.()

    window.addEventListener('popstate', handlePop)

    return () => {
      window.removeEventListener('popstate', handlePop)

      if (window.history.state?.__bottomSheet) {
        window.history.back()
      }
    }
  }, [isOpen])

  // Po zamknięciu wróć focusem na przycisk otwierający.
  useEffect(() => {
    if (!isOpen) return

    const trigger = triggerRef?.current

    return () => {
      trigger?.focus?.()
    }
  }, [isOpen, triggerRef])

  // Swipe-down: przeciąganie zaczynamy tylko za drag handle / nagłówek.
  const [dragY, setDragY] = useState(0)
  const dragRef = useRef({ startY: 0, active: false })

  const handleTouchStart = (event) => {
    const target = event.target
    if (!(target instanceof Element) || !target.closest('[data-sheet-drag]')) {
      return
    }

    dragRef.current = { startY: event.touches[0].clientY, active: true }
  }

  const handleTouchMove = (event) => {
    if (!dragRef.current.active) return

    const delta = event.touches[0].clientY - dragRef.current.startY
    if (delta > 0) setDragY(delta)
  }

  const endDrag = () => {
    if (!dragRef.current.active) return

    dragRef.current.active = false

    if (dragY > 90) onCloseRef.current?.()
    setDragY(0)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:hidden"
      onClick={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
        onTouchCancel={endDrag}
        style={
          dragY
            ? { transform: `translateY(${dragY}px)`, transition: 'none' }
            : undefined
        }
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-xl outline-none"
      >
        {children}
      </div>
    </div>
  )
}
