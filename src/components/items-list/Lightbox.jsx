import { useEffect, useRef } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

export default function Lightbox({ url, label, onClose }) {
  const dialogRef = useRef(null)
  const closeRef = useRef(null)
  const isOpen = Boolean(url)

  // Pułapka focusu + focus na przycisku zamykania; po zamknięciu focus wraca
  // tam, skąd otwarto powiększenie.
  useFocusTrap(dialogRef, isOpen, { initialFocusRef: closeRef })

  // Escape zamyka powiększenie; blokujemy też scroll tła.
  useEffect(() => {
    if (!isOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    document.addEventListener('keydown', handleKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`Powiększone zdjęcie: ${label}`}
      onClick={onClose}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 outline-none"
    >
      <button
        ref={closeRef}
        type="button"
        onClick={onClose}
        aria-label="Zamknij powiększenie"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50"
      >
        ✕
      </button>

      <figure
        className="max-h-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={url}
          alt={label}
          className="max-h-[85vh] w-auto rounded-lg object-contain"
        />
        <figcaption className="mt-2 text-center text-sm text-white/80">
          {label}
        </figcaption>
      </figure>
    </div>
  )
}
