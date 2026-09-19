// Wspólny nagłówek bottom sheeta: drag handle + tytuł + opcjonalny opis/✕.
// Ładuje `data-sheet-drag`, więc przeciągnięcie w dół zamyka sheet (BottomSheet),
// a `touch-none` wyłącza natywne przewijanie w tym obszarze.
export default function BottomSheetHeader({
  id,
  title,
  description,
  onClose,
  closeLabel = 'Zamknij',
}) {
  return (
    <div
      data-sheet-drag
      className="flex-shrink-0 touch-none px-4 pb-1 pt-3"
    >
      <div
        className="mx-auto mb-3 h-1 w-10 rounded-full bg-gray-300"
        aria-hidden="true"
      />

      {(title || onClose) && (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title && (
              <h2 id={id} className="text-lg font-semibold text-gray-800">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
